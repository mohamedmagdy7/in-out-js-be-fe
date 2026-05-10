import { db } from "@repo/db";
import { DateTime } from "luxon";
import {
  todayInTimezone,
  formatDuration,
  isLate,
  recomputeLogTotals,
  enrichWithActiveSession,
  getWorkingDays,
  computeSummary,
} from "./attendance.helpers";
import type { CheckInBody, CheckOutBody, AttendanceQuery, SummaryQuery, AdminMarkBody, AdminEditLogBody, AdminAddSessionBody, AdminEditSessionBody } from "./attendance.schema";

export class AttendanceError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "AttendanceError";
  }
}

async function getCompany(companyId: string) {
  const company = await db.company.findUnique({ where: { id: companyId } });
  if (!company) throw new AttendanceError("Company not found", 404);
  return company;
}

export async function checkIn(userId: string, companyId: string, body: CheckInBody) {
  const company = await getCompany(companyId);
  const today = todayInTimezone(company.timezone);

  // Check for existing open session today
  const openSession = await db.attendanceSession.findFirst({
    where: {
      user_id: userId,
      company_id: companyId,
      check_out_at: null,
      log: { date: today },
    },
  });

  if (openSession) {
    throw new AttendanceError(
      "Already checked in. Please check out before checking in again.",
      409,
    );
  }

  // Find or create today's log
  let log = await db.attendanceLog.findUnique({
    where: { user_id_date: { user_id: userId, date: today } },
    include: { sessions: true },
  });

  const now = new Date();
  const isFirstSession = !log || log.sessions.length === 0;

  if (!log) {
    // Determine initial status
    let status: "PRESENT" | "LATE" = "PRESENT";

    // Check if user has a shift and first session is late
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { shift: true },
    });
    if (user?.shift && isLate(user.shift.start_time, now, company.timezone)) {
      status = "LATE";
    }

    log = await db.attendanceLog.create({
      data: {
        company_id: companyId,
        user_id: userId,
        date: today,
        status,
        notes: body.notes,
      },
      include: { sessions: true },
    });
  } else if (isFirstSession) {
    // Log exists but no sessions yet — check for late on first session
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { shift: true },
    });
    if (user?.shift && isLate(user.shift.start_time, now, company.timezone)) {
      log = await db.attendanceLog.update({
        where: { id: log.id },
        data: { status: "LATE" },
        include: { sessions: true },
      });
    }
  }

  // Create the session
  const session = await db.attendanceSession.create({
    data: {
      log_id: log.id,
      user_id: userId,
      company_id: companyId,
      check_in_at: now,
      check_in_lat: body.lat ?? null,
      check_in_lng: body.lng ?? null,
      notes: body.notes,
    },
  });

  const sessionsCount = log.sessions.length + 1;

  return {
    session: {
      id: session.id,
      check_in_at: session.check_in_at,
      check_in_lat: session.check_in_lat,
      check_in_lng: session.check_in_lng,
    },
    log: {
      id: log.id,
      date: log.date,
      status: log.status,
      total_work_minutes: log.total_work_minutes,
      overtime_minutes: log.overtime_minutes,
      sessions_count: sessionsCount,
    },
  };
}

export async function checkOut(userId: string, companyId: string, body: CheckOutBody) {
  const company = await getCompany(companyId);
  const today = todayInTimezone(company.timezone);

  // Find open session for today
  const openSession = await db.attendanceSession.findFirst({
    where: {
      user_id: userId,
      company_id: companyId,
      check_out_at: null,
      log: { date: today },
    },
    include: { log: true },
  });

  if (!openSession) {
    throw new AttendanceError("No active check-in found. Please check in first.", 404);
  }

  const now = new Date();
  const diffMs = now.getTime() - openSession.check_in_at.getTime();
  const diffMinutes = diffMs / (1000 * 60);

  // Minimum 1-minute session
  if (diffMinutes < 1) {
    throw new AttendanceError(
      "Session too short. Please wait at least 1 minute before checking out.",
      422,
    );
  }

  const durationMinutes = Math.round(diffMinutes);

  // Update the session
  const session = await db.attendanceSession.update({
    where: { id: openSession.id },
    data: {
      check_out_at: now,
      check_out_lat: body.lat ?? null,
      check_out_lng: body.lng ?? null,
      duration_minutes: durationMinutes,
    },
  });

  // Recompute log totals
  const thresholdMinutes = company.daily_hours_threshold * 60;
  const totals = await recomputeLogTotals(openSession.log_id, thresholdMinutes);

  const log = await db.attendanceLog.update({
    where: { id: openSession.log_id },
    data: totals,
    include: { sessions: { where: { check_out_at: { not: null } } } },
  });

  const sessionsCount = await db.attendanceSession.count({
    where: { log_id: log.id },
  });

  const remainingMinutes = Math.max(0, thresholdMinutes - totals.total_work_minutes);

  return {
    session: {
      id: session.id,
      check_in_at: session.check_in_at,
      check_out_at: session.check_out_at,
      duration_minutes: session.duration_minutes,
      formatted_duration: formatDuration(session.duration_minutes!),
    },
    log: {
      id: log.id,
      date: log.date,
      status: log.status,
      total_work_minutes: totals.total_work_minutes,
      overtime_minutes: totals.overtime_minutes,
      sessions_count: sessionsCount,
      formatted: {
        total_work_hours: formatDuration(totals.total_work_minutes),
        overtime: formatDuration(totals.overtime_minutes),
        remaining_to_threshold: formatDuration(remainingMinutes),
      },
    },
  };
}

export async function getToday(userId: string, companyId: string) {
  const company = await getCompany(companyId);
  const today = todayInTimezone(company.timezone);

  const log = await db.attendanceLog.findUnique({
    where: { user_id_date: { user_id: userId, date: today } },
  });

  if (!log) {
    return {
      log: null,
      sessions: [],
      is_checked_in: false,
      active_session_id: null,
    };
  }

  const sessions = await db.attendanceSession.findMany({
    where: { log_id: log.id },
    orderBy: { check_in_at: "asc" },
  });

  const activeSession = sessions.find((s) => !s.check_out_at);

  // Include active session elapsed time in live totals
  let activeElapsed = 0;
  if (activeSession) {
    activeElapsed = Math.round(
      (Date.now() - activeSession.check_in_at.getTime()) / (1000 * 60),
    );
  }
  const thresholdMinutes = company.daily_hours_threshold * 60;
  const liveTotalMinutes = log.total_work_minutes + activeElapsed;
  const liveOvertimeMinutes = Math.max(0, liveTotalMinutes - thresholdMinutes);

  return {
    log: {
      id: log.id,
      date: log.date,
      status: log.status,
      total_work_minutes: liveTotalMinutes,
      overtime_minutes: liveOvertimeMinutes,
      formatted: {
        total_work_hours: formatDuration(liveTotalMinutes),
        overtime: formatDuration(liveOvertimeMinutes),
      },
    },
    sessions: sessions.map((s) => ({
      id: s.id,
      check_in_at: s.check_in_at,
      check_out_at: s.check_out_at,
      duration_minutes: s.duration_minutes,
      formatted_duration: s.duration_minutes ? formatDuration(s.duration_minutes) : null,
      check_in_lat: s.check_in_lat,
      check_in_lng: s.check_in_lng,
    })),
    is_checked_in: !!activeSession,
    active_session_id: activeSession?.id ?? null,
  };
}

export async function getStatus(userId: string, companyId: string) {
  const company = await getCompany(companyId);
  const today = todayInTimezone(company.timezone);
  const thresholdMinutes = company.daily_hours_threshold * 60;

  const log = await db.attendanceLog.findUnique({
    where: { user_id_date: { user_id: userId, date: today } },
  });

  const activeSession = await db.attendanceSession.findFirst({
    where: {
      user_id: userId,
      company_id: companyId,
      check_out_at: null,
      log: { date: today },
    },
  });

  const storedMinutes = log?.total_work_minutes ?? 0;

  // Include active session elapsed time in live totals
  let elapsedMinutes: number | null = null;
  if (activeSession) {
    elapsedMinutes = Math.round(
      (Date.now() - activeSession.check_in_at.getTime()) / (1000 * 60),
    );
  }

  const liveTotalMinutes = storedMinutes + (elapsedMinutes ?? 0);
  const liveOvertimeMinutes = Math.max(0, liveTotalMinutes - thresholdMinutes);

  return {
    is_checked_in: !!activeSession,
    active_session: activeSession
      ? {
          id: activeSession.id,
          check_in_at: activeSession.check_in_at,
          elapsed_minutes: elapsedMinutes,
        }
      : null,
    today_total_minutes: liveTotalMinutes,
    today_overtime_minutes: liveOvertimeMinutes,
    threshold_minutes: thresholdMinutes,
    threshold_met: liveTotalMinutes >= thresholdMinutes,
    remaining_to_threshold: Math.max(0, thresholdMinutes - liveTotalMinutes),
  };
}

// --- Task 07: Attendance Records & History ---

function formatLogWithSessions(
  log: {
    id: string;
    date: Date;
    total_work_minutes: number;
    overtime_minutes: number;
    status: string;
    notes: string | null;
    sessions: Array<{
      id: string;
      check_in_at: Date;
      check_out_at: Date | null;
      duration_minutes: number | null;
    }>;
  },
  isLive: boolean,
  totalWorkMinutes: number,
  overtimeMinutes: number,
) {
  return {
    id: log.id,
    date: log.date,
    total_work_minutes: totalWorkMinutes,
    overtime_minutes: overtimeMinutes,
    status: log.status,
    is_live: isLive,
    formatted: {
      total_work_hours: formatDuration(totalWorkMinutes),
      overtime: formatDuration(overtimeMinutes),
    },
    sessions: log.sessions.map((s) => ({
      id: s.id,
      check_in_at: s.check_in_at,
      check_out_at: s.check_out_at,
      duration_minutes: s.duration_minutes,
      formatted_duration: s.duration_minutes ? formatDuration(s.duration_minutes) : null,
    })),
  };
}

function enrichAndFormatLog(
  log: {
    id: string;
    date: Date;
    total_work_minutes: number;
    overtime_minutes: number;
    status: string;
    notes: string | null;
    sessions: Array<{
      id: string;
      check_in_at: Date;
      check_out_at: Date | null;
      duration_minutes: number | null;
    }>;
  },
  todayDate: Date,
  now: DateTime,
  thresholdMinutes: number,
) {
  const isToday = log.date.getTime() === todayDate.getTime();
  if (isToday) {
    const enriched = enrichWithActiveSession(log as any, now, thresholdMinutes);
    return formatLogWithSessions(log, enriched.is_live, enriched.total_work_minutes, enriched.overtime_minutes);
  }
  return formatLogWithSessions(log, false, log.total_work_minutes, log.overtime_minutes);
}

export async function getMyAttendance(userId: string, companyId: string, query: AttendanceQuery) {
  const company = await getCompany(companyId);
  const today = todayInTimezone(company.timezone);
  const now = DateTime.now().setZone(company.timezone);
  const thresholdMinutes = company.daily_hours_threshold * 60;

  const where: any = { user_id: userId, company_id: companyId };

  if (query.from || query.to) {
    where.date = {};
    if (query.from) where.date.gte = new Date(`${query.from}T00:00:00.000Z`);
    if (query.to) where.date.lte = new Date(`${query.to}T00:00:00.000Z`);
  }
  if (query.status) where.status = query.status;

  const [logs, total] = await Promise.all([
    db.attendanceLog.findMany({
      where,
      include: {
        sessions: { orderBy: { check_in_at: "asc" } },
      },
      orderBy: { date: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    db.attendanceLog.count({ where }),
  ]);

  return {
    data: logs.map((log) => enrichAndFormatLog(log, today, now, thresholdMinutes)),
    pagination: { page: query.page, limit: query.limit, total },
  };
}

export async function getEmployeeAttendance(
  requesterId: string,
  requesterRole: string,
  companyId: string,
  employeeId: string,
  query: AttendanceQuery,
) {
  const company = await getCompany(companyId);

  // Verify the target employee belongs to this company
  const employee = await db.user.findFirst({
    where: { id: employeeId, company_id: companyId },
  });
  if (!employee) throw new AttendanceError("Employee not found", 404);

  // Managers can only see their direct reports
  if (requesterRole === "MANAGER") {
    if (employee.manager_id !== requesterId) {
      throw new AttendanceError("Access denied. Employee is not your direct report.", 403);
    }
  }

  const today = todayInTimezone(company.timezone);
  const now = DateTime.now().setZone(company.timezone);
  const thresholdMinutes = company.daily_hours_threshold * 60;

  const where: any = { user_id: employeeId, company_id: companyId };

  if (query.from || query.to) {
    where.date = {};
    if (query.from) where.date.gte = new Date(`${query.from}T00:00:00.000Z`);
    if (query.to) where.date.lte = new Date(`${query.to}T00:00:00.000Z`);
  }
  if (query.status) where.status = query.status;

  const [logs, total] = await Promise.all([
    db.attendanceLog.findMany({
      where,
      include: {
        sessions: { orderBy: { check_in_at: "asc" } },
      },
      orderBy: { date: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    db.attendanceLog.count({ where }),
  ]);

  return {
    employee: {
      id: employee.id,
      full_name: `${employee.first_name} ${employee.last_name}`,
    },
    data: logs.map((log) => enrichAndFormatLog(log, today, now, thresholdMinutes)),
    pagination: { page: query.page, limit: query.limit, total },
  };
}

export async function getTeamAttendance(managerId: string, companyId: string, query: AttendanceQuery) {
  const company = await getCompany(companyId);
  const today = todayInTimezone(company.timezone);
  const now = DateTime.now().setZone(company.timezone);
  const thresholdMinutes = company.daily_hours_threshold * 60;

  // Get all direct reports
  const teamMembers = await db.user.findMany({
    where: { manager_id: managerId, company_id: companyId, is_active: true },
    select: { id: true, first_name: true, last_name: true, department: { select: { name: true } } },
  });

  const teamIds = teamMembers.map((u) => u.id);
  if (teamIds.length === 0) {
    return { data: [], pagination: { page: query.page, limit: query.limit, total: 0 } };
  }

  // Narrow to a single direct report when employee_id is provided. Reject if the
  // requested id isn't in the manager's team to avoid leaking other employees.
  if (query.employee_id && !teamIds.includes(query.employee_id)) {
    throw new AttendanceError("Employee is not in your team", 403);
  }

  const where: any = {
    user_id: query.employee_id ?? { in: teamIds },
    company_id: companyId,
  };

  if (query.from || query.to) {
    where.date = {};
    if (query.from) where.date.gte = new Date(`${query.from}T00:00:00.000Z`);
    if (query.to) where.date.lte = new Date(`${query.to}T00:00:00.000Z`);
  }
  if (query.status) where.status = query.status;
  if (query.department_id) {
    where.user = { department_id: query.department_id };
  }

  const [logs, total] = await Promise.all([
    db.attendanceLog.findMany({
      where,
      include: {
        user: { select: { id: true, first_name: true, last_name: true, department: { select: { name: true } } } },
        sessions: { orderBy: { check_in_at: "asc" } },
      },
      orderBy: { date: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    db.attendanceLog.count({ where }),
  ]);

  return {
    data: logs.map((log) => {
      const formatted = enrichAndFormatLog(log, today, now, thresholdMinutes);
      return {
        user: {
          id: log.user.id,
          full_name: `${log.user.first_name} ${log.user.last_name}`,
          department: log.user.department?.name ?? null,
        },
        ...formatted,
      };
    }),
    pagination: { page: query.page, limit: query.limit, total },
  };
}

export async function getCompanyAttendance(companyId: string, query: AttendanceQuery) {
  const company = await getCompany(companyId);
  const today = todayInTimezone(company.timezone);
  const now = DateTime.now().setZone(company.timezone);
  const thresholdMinutes = company.daily_hours_threshold * 60;

  const where: any = { company_id: companyId };

  if (query.from || query.to) {
    where.date = {};
    if (query.from) where.date.gte = new Date(`${query.from}T00:00:00.000Z`);
    if (query.to) where.date.lte = new Date(`${query.to}T00:00:00.000Z`);
  }
  if (query.status) where.status = query.status;
  if (query.department_id) where.user = { department_id: query.department_id };
  if (query.employee_id) where.user_id = query.employee_id;

  const [logs, total] = await Promise.all([
    db.attendanceLog.findMany({
      where,
      include: {
        user: { select: { id: true, first_name: true, last_name: true, department: { select: { name: true } } } },
        sessions: { orderBy: { check_in_at: "asc" } },
      },
      orderBy: { date: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    db.attendanceLog.count({ where }),
  ]);

  return {
    data: logs.map((log) => {
      const formatted = enrichAndFormatLog(log, today, now, thresholdMinutes);
      return {
        user: {
          id: log.user.id,
          full_name: `${log.user.first_name} ${log.user.last_name}`,
          department: log.user.department?.name ?? null,
        },
        ...formatted,
      };
    }),
    pagination: { page: query.page, limit: query.limit, total },
  };
}

export async function getMySummary(userId: string, companyId: string, query: SummaryQuery) {
  return getSummaryForUser(userId, companyId, query);
}

export async function getEmployeeSummary(
  requesterId: string,
  requesterRole: string,
  companyId: string,
  employeeId: string,
  query: SummaryQuery,
) {
  const employee = await db.user.findFirst({
    where: { id: employeeId, company_id: companyId },
  });
  if (!employee) throw new AttendanceError("Employee not found", 404);

  if (requesterRole === "MANAGER" && employee.manager_id !== requesterId) {
    throw new AttendanceError("Access denied. Employee is not your direct report.", 403);
  }

  return getSummaryForUser(employeeId, companyId, query);
}

async function getSummaryForUser(userId: string, companyId: string, query: SummaryQuery) {
  const company = await getCompany(companyId);

  let startDate: DateTime;
  let endDate: DateTime;
  let periodLabel: string;

  if (query.period === "monthly") {
    const year = query.year ?? DateTime.now().setZone(company.timezone).year;
    const month = query.month ?? DateTime.now().setZone(company.timezone).month;
    startDate = DateTime.fromObject({ year, month, day: 1 }, { zone: company.timezone });
    endDate = startDate.endOf("month");
    periodLabel = startDate.toFormat("LLLL yyyy");
  } else {
    // weekly
    if (!query.week_start) {
      throw new AttendanceError("week_start is required for weekly summary", 400);
    }
    startDate = DateTime.fromISO(query.week_start, { zone: company.timezone });
    if (!startDate.isValid) {
      throw new AttendanceError("Invalid week_start date", 400);
    }
    endDate = startDate.plus({ days: 6 }).endOf("day");
    periodLabel = `Week of ${startDate.toFormat("LLL dd, yyyy")}`;
  }

  const fromDate = new Date(`${startDate.toFormat("yyyy-MM-dd")}T00:00:00.000Z`);
  const toDate = new Date(`${endDate.toFormat("yyyy-MM-dd")}T00:00:00.000Z`);

  const logs = await db.attendanceLog.findMany({
    where: {
      user_id: userId,
      company_id: companyId,
      date: { gte: fromDate, lte: toDate },
    },
  });

  const workingDays = getWorkingDays(startDate, endDate, company.weekend_days);
  return computeSummary(logs, workingDays, periodLabel);
}

// --- Admin Override Functions ---

export async function adminMarkAttendance(companyId: string, body: AdminMarkBody) {
  const employee = await db.user.findFirst({
    where: { id: body.user_id, company_id: companyId },
  });
  if (!employee) throw new AttendanceError("Employee not found", 404);

  const date = new Date(`${body.date}T00:00:00.000Z`);

  // Check if log already exists for this date
  const existing = await db.attendanceLog.findUnique({
    where: { user_id_date: { user_id: body.user_id, date } },
  });
  if (existing) {
    throw new AttendanceError("Attendance log already exists for this date", 409);
  }

  const log = await db.attendanceLog.create({
    data: {
      company_id: companyId,
      user_id: body.user_id,
      date,
      status: body.status as any,
      notes: body.notes,
      total_work_minutes: 0,
      overtime_minutes: 0,
    },
  });

  return log;
}

export async function adminEditLog(companyId: string, logId: string, body: AdminEditLogBody) {
  const log = await db.attendanceLog.findFirst({
    where: { id: logId, company_id: companyId },
  });
  if (!log) throw new AttendanceError("Attendance log not found", 404);

  const data: any = {};
  if (body.status) data.status = body.status;
  if (body.notes !== undefined) data.notes = body.notes;

  const updated = await db.attendanceLog.update({
    where: { id: logId },
    data,
    include: { sessions: { orderBy: { check_in_at: "asc" } } },
  });

  return updated;
}

export async function adminAddSession(companyId: string, body: AdminAddSessionBody) {
  const log = await db.attendanceLog.findFirst({
    where: { id: body.log_id, company_id: companyId },
  });
  if (!log) throw new AttendanceError("Attendance log not found", 404);

  const checkInAt = new Date(body.check_in_at);
  const checkOutAt = new Date(body.check_out_at);
  const durationMinutes = Math.round((checkOutAt.getTime() - checkInAt.getTime()) / (1000 * 60));

  if (durationMinutes < 1) {
    throw new AttendanceError("Session duration must be at least 1 minute", 422);
  }

  const session = await db.attendanceSession.create({
    data: {
      log_id: body.log_id,
      user_id: log.user_id,
      company_id: companyId,
      check_in_at: checkInAt,
      check_out_at: checkOutAt,
      duration_minutes: durationMinutes,
      notes: body.notes,
    },
  });

  // Recompute log totals
  const company = await getCompany(companyId);
  const thresholdMinutes = company.daily_hours_threshold * 60;
  const totals = await recomputeLogTotals(log.id, thresholdMinutes);
  await db.attendanceLog.update({ where: { id: log.id }, data: totals });

  return session;
}

export async function adminEditSession(companyId: string, sessionId: string, body: AdminEditSessionBody) {
  const session = await db.attendanceSession.findFirst({
    where: { id: sessionId, company_id: companyId },
  });
  if (!session) throw new AttendanceError("Session not found", 404);

  const checkInAt = body.check_in_at ? new Date(body.check_in_at) : session.check_in_at;
  const checkOutAt = body.check_out_at ? new Date(body.check_out_at) : session.check_out_at;

  const data: any = {};
  if (body.check_in_at) data.check_in_at = checkInAt;
  if (body.check_out_at) data.check_out_at = checkOutAt;

  // Recompute duration if both timestamps are available
  if (checkOutAt) {
    data.duration_minutes = Math.round((checkOutAt.getTime() - checkInAt.getTime()) / (1000 * 60));
  }

  const updated = await db.attendanceSession.update({
    where: { id: sessionId },
    data,
  });

  // Recompute log totals
  const company = await getCompany(companyId);
  const thresholdMinutes = company.daily_hours_threshold * 60;
  const totals = await recomputeLogTotals(session.log_id, thresholdMinutes);
  await db.attendanceLog.update({ where: { id: session.log_id }, data: totals });

  return updated;
}

export async function adminDeleteSession(companyId: string, sessionId: string) {
  const session = await db.attendanceSession.findFirst({
    where: { id: sessionId, company_id: companyId },
  });
  if (!session) throw new AttendanceError("Session not found", 404);

  await db.attendanceSession.delete({ where: { id: sessionId } });

  // Recompute log totals
  const company = await getCompany(companyId);
  const thresholdMinutes = company.daily_hours_threshold * 60;
  const totals = await recomputeLogTotals(session.log_id, thresholdMinutes);
  await db.attendanceLog.update({ where: { id: session.log_id }, data: totals });

  return { message: "Session deleted" };
}
