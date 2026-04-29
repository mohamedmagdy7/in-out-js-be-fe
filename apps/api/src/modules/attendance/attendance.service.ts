import { db } from "@repo/db";
import { DateTime } from "luxon";
import { todayInTimezone, formatDuration, isLate, recomputeLogTotals } from "./attendance.helpers";
import type { CheckInBody, CheckOutBody } from "./attendance.schema";

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
