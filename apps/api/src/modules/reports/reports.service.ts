import { db } from "@repo/db";
import { DateTime } from "luxon";
import {
  todayInTimezone,
  formatDuration,
  enrichWithActiveSession,
  getWorkingDays,
} from "../attendance/attendance.helpers";
import { getRemainingBalance } from "../leave/leave.helpers";
import type {
  AttendanceReportQuery,
  OvertimeReportQuery,
  LeaveReportQuery,
} from "./reports.schema";

export class ReportError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ReportError";
  }
}

async function getCompany(companyId: string) {
  const company = await db.company.findUnique({ where: { id: companyId } });
  if (!company) throw new ReportError("Company not found", 404);
  return company;
}

interface EmployeeContext {
  id: string;
  first_name: string;
  last_name: string;
  department: { id: string; name: string } | null;
}

async function getScopedEmployees(
  companyId: string,
  requesterId: string,
  requesterRole: string,
  filters: { department_id?: string; employee_id?: string },
): Promise<EmployeeContext[]> {
  const where: any = { company_id: companyId, is_active: true };
  if (requesterRole === "MANAGER") where.manager_id = requesterId;
  if (filters.department_id) where.department_id = filters.department_id;
  if (filters.employee_id) where.id = filters.employee_id;

  return db.user.findMany({
    where,
    select: {
      id: true,
      first_name: true,
      last_name: true,
      department: { select: { id: true, name: true } },
    },
    orderBy: [{ first_name: "asc" }, { last_name: "asc" }],
  });
}

interface EmployeeAttendanceStats {
  user: {
    id: string;
    full_name: string;
    department: string | null;
  };
  days_present: number;
  days_absent: number;
  days_late: number;
  days_on_leave: number;
  total_work_minutes: number;
  total_overtime_minutes: number;
  attendance_rate: string;
  has_active_session: boolean;
}

interface EmployeeAttendanceData extends EmployeeAttendanceStats {
  daily_logs: Array<{
    date: Date;
    sessions_count: number;
    total_work_minutes: number;
    overtime_minutes: number;
    status: string;
    is_live: boolean;
  }>;
}

async function buildAttendanceData(
  companyId: string,
  employees: EmployeeContext[],
  fromDate: string,
  toDate: string,
  status: string | undefined,
  todayDate: Date,
  now: DateTime,
  thresholdMinutes: number,
  workingDays: number,
  rangeIncludesToday: boolean,
): Promise<EmployeeAttendanceData[]> {
  if (employees.length === 0) return [];

  const employeeIds = employees.map((e) => e.id);
  const logWhere: any = {
    company_id: companyId,
    user_id: { in: employeeIds },
    date: {
      gte: new Date(`${fromDate}T00:00:00.000Z`),
      lte: new Date(`${toDate}T00:00:00.000Z`),
    },
  };
  if (status) logWhere.status = status;

  const logs = await db.attendanceLog.findMany({
    where: logWhere,
    include: {
      sessions: { orderBy: { check_in_at: "asc" } },
    },
    orderBy: { date: "asc" },
  });

  const logsByUser = new Map<string, typeof logs>();
  for (const log of logs) {
    const list = logsByUser.get(log.user_id) ?? [];
    list.push(log);
    logsByUser.set(log.user_id, list);
  }

  const todayTime = todayDate.getTime();

  return employees.map((emp) => {
    const empLogs = logsByUser.get(emp.id) ?? [];
    let days_present = 0;
    let days_absent = 0;
    let days_late = 0;
    let days_on_leave = 0;
    let total_work_minutes = 0;
    let total_overtime_minutes = 0;
    let has_active_session = false;

    const daily_logs: EmployeeAttendanceData["daily_logs"] = [];

    for (const log of empLogs) {
      const isToday = rangeIncludesToday && log.date.getTime() === todayTime;
      let workMin = log.total_work_minutes;
      let otMin = log.overtime_minutes;
      let isLive = false;

      if (isToday) {
        const enriched = enrichWithActiveSession(log as any, now, thresholdMinutes);
        workMin = enriched.total_work_minutes;
        otMin = enriched.overtime_minutes;
        isLive = enriched.is_live;
        if (isLive) has_active_session = true;
      }

      switch (log.status) {
        case "PRESENT":
          days_present++;
          break;
        case "LATE":
          days_present++;
          days_late++;
          break;
        case "HALF_DAY":
          days_present++;
          break;
        case "ABSENT":
          days_absent++;
          break;
        case "ON_LEAVE":
          days_on_leave++;
          break;
      }

      total_work_minutes += workMin;
      total_overtime_minutes += otMin;

      daily_logs.push({
        date: log.date,
        sessions_count: log.sessions.length,
        total_work_minutes: workMin,
        overtime_minutes: otMin,
        status: log.status,
        is_live: isLive,
      });
    }

    const attendance_rate = workingDays > 0 ? (days_present / workingDays) * 100 : 0;

    return {
      user: {
        id: emp.id,
        full_name: `${emp.first_name} ${emp.last_name}`,
        department: emp.department?.name ?? null,
      },
      days_present,
      days_absent,
      days_late,
      days_on_leave,
      total_work_minutes,
      total_overtime_minutes,
      attendance_rate: `${attendance_rate.toFixed(1)}%`,
      has_active_session,
      daily_logs,
    };
  });
}

// ─── Attendance Report ────────────────────────────────────

export async function getAttendanceReport(
  requesterId: string,
  requesterRole: string,
  companyId: string,
  query: AttendanceReportQuery,
) {
  if (query.from > query.to) {
    throw new ReportError("from must be before or equal to to", 400);
  }

  const company = await getCompany(companyId);
  const today = todayInTimezone(company.timezone);
  const now = DateTime.now().setZone(company.timezone);
  const thresholdMinutes = company.daily_hours_threshold * 60;

  const fromDate = new Date(`${query.from}T00:00:00.000Z`);
  const toDate = new Date(`${query.to}T00:00:00.000Z`);
  const rangeIncludesToday = today >= fromDate && today <= toDate;

  const startDt = DateTime.fromISO(query.from, { zone: company.timezone });
  const endDt = DateTime.fromISO(query.to, { zone: company.timezone });
  const workingDays = getWorkingDays(startDt, endDt, company.weekend_days);

  const employees = await getScopedEmployees(companyId, requesterId, requesterRole, {
    department_id: query.department_id,
    employee_id: query.employee_id,
  });

  const data = await buildAttendanceData(
    companyId,
    employees,
    query.from,
    query.to,
    query.status,
    today,
    now,
    thresholdMinutes,
    workingDays,
    rangeIncludesToday,
  );

  const total_employees = data.length;
  const total_work_minutes = data.reduce((s, e) => s + e.total_work_minutes, 0);
  const total_overtime_minutes = data.reduce((s, e) => s + e.total_overtime_minutes, 0);
  const avg_rate =
    total_employees > 0
      ? data.reduce((s, e) => s + parseFloat(e.attendance_rate), 0) / total_employees
      : 0;

  return {
    period: { from: query.from, to: query.to },
    includes_live_data: rangeIncludesToday,
    summary: {
      total_employees,
      avg_attendance_rate: `${avg_rate.toFixed(1)}%`,
      total_work_hours: `${Math.round(total_work_minutes / 60)}h`,
      total_overtime_hours: `${Math.round(total_overtime_minutes / 60)}h`,
    },
    employees: data.map(({ daily_logs: _omitted, ...row }) => row),
  };
}

// Used by exporters — returns daily rows too.
export async function getAttendanceReportFull(
  requesterId: string,
  requesterRole: string,
  companyId: string,
  query: AttendanceReportQuery,
) {
  if (query.from > query.to) {
    throw new ReportError("from must be before or equal to to", 400);
  }

  const company = await getCompany(companyId);
  const today = todayInTimezone(company.timezone);
  const now = DateTime.now().setZone(company.timezone);
  const thresholdMinutes = company.daily_hours_threshold * 60;

  const fromDate = new Date(`${query.from}T00:00:00.000Z`);
  const toDate = new Date(`${query.to}T00:00:00.000Z`);
  const rangeIncludesToday = today >= fromDate && today <= toDate;

  const startDt = DateTime.fromISO(query.from, { zone: company.timezone });
  const endDt = DateTime.fromISO(query.to, { zone: company.timezone });
  const workingDays = getWorkingDays(startDt, endDt, company.weekend_days);

  const employees = await getScopedEmployees(companyId, requesterId, requesterRole, {
    department_id: query.department_id,
    employee_id: query.employee_id,
  });

  const data = await buildAttendanceData(
    companyId,
    employees,
    query.from,
    query.to,
    query.status,
    today,
    now,
    thresholdMinutes,
    workingDays,
    rangeIncludesToday,
  );

  return { company, period: { from: query.from, to: query.to }, includes_live_data: rangeIncludesToday, employees: data };
}

// ─── Overtime Report ──────────────────────────────────────

export async function getOvertimeReport(
  requesterId: string,
  requesterRole: string,
  companyId: string,
  query: OvertimeReportQuery,
) {
  if (query.from > query.to) {
    throw new ReportError("from must be before or equal to to", 400);
  }

  const company = await getCompany(companyId);
  const today = todayInTimezone(company.timezone);
  const now = DateTime.now().setZone(company.timezone);
  const thresholdMinutes = company.daily_hours_threshold * 60;

  const fromDate = new Date(`${query.from}T00:00:00.000Z`);
  const toDate = new Date(`${query.to}T00:00:00.000Z`);
  const rangeIncludesToday = today >= fromDate && today <= toDate;

  const employees = await getScopedEmployees(companyId, requesterId, requesterRole, {
    department_id: query.department_id,
  });

  if (employees.length === 0) return { employees: [] };

  const employeeIds = employees.map((e) => e.id);
  const logs = await db.attendanceLog.findMany({
    where: {
      company_id: companyId,
      user_id: { in: employeeIds },
      date: { gte: fromDate, lte: toDate },
    },
    include: { sessions: { orderBy: { check_in_at: "asc" } } },
  });

  const logsByUser = new Map<string, typeof logs>();
  for (const log of logs) {
    const list = logsByUser.get(log.user_id) ?? [];
    list.push(log);
    logsByUser.set(log.user_id, list);
  }

  const todayTime = today.getTime();
  const minOvertimeMinutes = query.min_hours * 60;

  const rows = employees
    .map((emp) => {
      let total_overtime_minutes = 0;
      let overtime_days = 0;

      const empLogs = logsByUser.get(emp.id) ?? [];
      for (const log of empLogs) {
        const isToday = rangeIncludesToday && log.date.getTime() === todayTime;
        let otMin = log.overtime_minutes;
        if (isToday) {
          const enriched = enrichWithActiveSession(log as any, now, thresholdMinutes);
          otMin = enriched.overtime_minutes;
        }
        if (otMin > 0) {
          overtime_days++;
          total_overtime_minutes += otMin;
        }
      }

      return {
        user: {
          id: emp.id,
          full_name: `${emp.first_name} ${emp.last_name}`,
          department: emp.department?.name ?? null,
        },
        total_overtime_minutes,
        formatted_overtime: formatDuration(total_overtime_minutes),
        overtime_days,
      };
    })
    .filter((r) => r.total_overtime_minutes >= minOvertimeMinutes)
    .sort((a, b) => b.total_overtime_minutes - a.total_overtime_minutes);

  return { employees: rows };
}

// ─── Leave Report ─────────────────────────────────────────

export async function getLeaveReport(
  requesterId: string,
  requesterRole: string,
  companyId: string,
  query: LeaveReportQuery,
) {
  await getCompany(companyId);

  const employees = await getScopedEmployees(companyId, requesterId, requesterRole, {
    department_id: query.department_id,
  });

  if (employees.length === 0) return { year: query.year, employees: [] };

  const leaveTypeWhere: any = { company_id: companyId };
  if (query.leave_type_id) leaveTypeWhere.id = query.leave_type_id;
  const leaveTypes = await db.leaveType.findMany({ where: leaveTypeWhere });

  const rows = await Promise.all(
    employees.map(async (emp) => {
      const balances = await Promise.all(
        leaveTypes.map(async (lt) => {
          const balance = await getRemainingBalance(emp.id, companyId, lt.id, query.year);
          return {
            type: lt.name,
            used: balance.days_used,
            pending: balance.days_pending,
            remaining: balance.days_remaining,
          };
        }),
      );

      return {
        user: {
          id: emp.id,
          full_name: `${emp.first_name} ${emp.last_name}`,
          department: emp.department?.name ?? null,
        },
        balances,
      };
    }),
  );

  return { year: query.year, employees: rows };
}

// ─── Summary (live dashboard) ─────────────────────────────

export async function getSummary(
  requesterId: string,
  requesterRole: string,
  companyId: string,
) {
  const company = await getCompany(companyId);
  const today = todayInTimezone(company.timezone);
  const now = DateTime.now().setZone(company.timezone);
  const thresholdMinutes = company.daily_hours_threshold * 60;

  const employees = await getScopedEmployees(companyId, requesterId, requesterRole, {});
  if (employees.length === 0) {
    return {
      today: {
        checked_in: 0,
        not_checked_in: 0,
        on_leave: 0,
        late: 0,
        total_live_work_minutes: 0,
      },
      this_month: {
        avg_attendance_rate: "0.0%",
        total_overtime_hours: "0h",
        pending_leave_requests: 0,
      },
    };
  }

  const employeeIds = employees.map((e) => e.id);

  const todayLogs = await db.attendanceLog.findMany({
    where: { company_id: companyId, user_id: { in: employeeIds }, date: today },
    include: { sessions: { orderBy: { check_in_at: "asc" } } },
  });

  let checked_in = 0;
  let on_leave = 0;
  let late = 0;
  let total_live_work_minutes = 0;
  const employeesWithLog = new Set<string>();

  for (const log of todayLogs) {
    employeesWithLog.add(log.user_id);
    const enriched = enrichWithActiveSession(log as any, now, thresholdMinutes);
    if (enriched.is_live) checked_in++;
    if (log.status === "ON_LEAVE") on_leave++;
    if (log.status === "LATE") late++;
    total_live_work_minutes += enriched.total_work_minutes;
  }

  const not_checked_in = employees.length - checked_in - on_leave;

  // This-month aggregates
  const monthStart = now.startOf("month");
  const monthEnd = now.endOf("month");
  const monthFrom = new Date(`${monthStart.toFormat("yyyy-MM-dd")}T00:00:00.000Z`);
  const monthTo = new Date(`${monthEnd.toFormat("yyyy-MM-dd")}T00:00:00.000Z`);
  const workingDays = getWorkingDays(monthStart, monthEnd, company.weekend_days);

  const monthLogs = await db.attendanceLog.findMany({
    where: {
      company_id: companyId,
      user_id: { in: employeeIds },
      date: { gte: monthFrom, lte: monthTo },
    },
    include: { sessions: { orderBy: { check_in_at: "asc" } } },
  });

  const presentByUser = new Map<string, number>();
  let total_overtime_minutes = 0;
  const todayTime = today.getTime();

  for (const log of monthLogs) {
    const isToday = log.date.getTime() === todayTime;
    let otMin = log.overtime_minutes;
    if (isToday) {
      const enriched = enrichWithActiveSession(log as any, now, thresholdMinutes);
      otMin = enriched.overtime_minutes;
    }
    total_overtime_minutes += otMin;

    if (["PRESENT", "LATE", "HALF_DAY"].includes(log.status)) {
      presentByUser.set(log.user_id, (presentByUser.get(log.user_id) ?? 0) + 1);
    }
  }

  let avgRate = 0;
  if (workingDays > 0) {
    const ratesSum = employees.reduce((sum, emp) => {
      const present = presentByUser.get(emp.id) ?? 0;
      return sum + (present / workingDays) * 100;
    }, 0);
    avgRate = ratesSum / employees.length;
  }

  // Pending leave requests scoped the same way
  const pendingWhere: any = {
    company_id: companyId,
    status: "PENDING",
    user_id: { in: employeeIds },
  };
  const pending_leave_requests = await db.leaveRequest.count({ where: pendingWhere });

  return {
    today: {
      checked_in,
      not_checked_in: Math.max(0, not_checked_in),
      on_leave,
      late,
      total_live_work_minutes,
    },
    this_month: {
      avg_attendance_rate: `${avgRate.toFixed(1)}%`,
      total_overtime_hours: `${Math.round(total_overtime_minutes / 60)}h`,
      pending_leave_requests,
    },
  };
}
