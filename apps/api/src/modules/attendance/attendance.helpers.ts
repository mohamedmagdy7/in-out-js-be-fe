import { DateTime } from "luxon";
import { db } from "@repo/db";

/**
 * Get today's date (date-only) in the given timezone.
 * Returns a JS Date set to midnight UTC of the local date.
 */
export function todayInTimezone(timezone: string): Date {
  const now = DateTime.now().setZone(timezone);
  return new Date(`${now.toFormat("yyyy-MM-dd")}T00:00:00.000Z`);
}

/** Format minutes as "Xh Ym" */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${m}m`;
}

/**
 * Determine if the first check-in of the day is late.
 * shiftStartTime is "HH:mm" (e.g. "09:00"), grace period is 15 minutes.
 */
export function isLate(shiftStartTime: string, checkInAt: Date, timezone: string): boolean {
  const checkIn = DateTime.fromJSDate(checkInAt).setZone(timezone);
  const [hours, minutes] = shiftStartTime.split(":").map(Number);
  const shiftStart = checkIn.set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });
  const deadline = shiftStart.plus({ minutes: 15 });
  return checkIn > deadline;
}

/**
 * Recompute log totals from all completed sessions.
 */
export async function recomputeLogTotals(
  logId: string,
  thresholdMinutes: number,
): Promise<{ total_work_minutes: number; overtime_minutes: number }> {
  const completedSessions = await db.attendanceSession.findMany({
    where: { log_id: logId, check_out_at: { not: null } },
  });
  const total_work_minutes = completedSessions.reduce(
    (sum, s) => sum + (s.duration_minutes ?? 0),
    0,
  );
  const overtime_minutes = Math.max(0, total_work_minutes - thresholdMinutes);
  return { total_work_minutes, overtime_minutes };
}

// --- Task 07: Attendance Records Helpers ---

interface SessionLike {
  check_in_at: Date;
  check_out_at: Date | null;
  duration_minutes: number | null;
}

interface LogLike {
  id: string;
  date: Date;
  total_work_minutes: number;
  overtime_minutes: number;
  status: string;
  notes: string | null;
  sessions: SessionLike[];
  [key: string]: unknown;
}

interface EnrichedLog {
  is_live: boolean;
  total_work_minutes: number;
  overtime_minutes: number;
}

/**
 * Enrich a log with active session elapsed time if the log is for today.
 * Only called when the log's date equals today in company timezone.
 */
export function enrichWithActiveSession(
  log: LogLike,
  now: DateTime,
  thresholdMinutes: number,
): EnrichedLog {
  const activeSession = log.sessions.find((s) => s.check_out_at === null);
  if (!activeSession) return { is_live: false, total_work_minutes: log.total_work_minutes, overtime_minutes: log.overtime_minutes };

  const elapsedMinutes = Math.floor(
    now.diff(DateTime.fromJSDate(activeSession.check_in_at), "minutes").minutes,
  );
  const liveTotal = log.total_work_minutes + elapsedMinutes;
  const liveOvertime = Math.max(0, liveTotal - thresholdMinutes);

  return {
    total_work_minutes: liveTotal,
    overtime_minutes: liveOvertime,
    is_live: true,
  };
}

/**
 * Get the number of working days in a period.
 * weekendDays uses JS Date.getDay() convention: 0=Sun, 1=Mon, ..., 6=Sat.
 * Defaults to [5, 6] (Friday + Saturday) if not provided.
 */
export function getWorkingDays(startDate: DateTime, endDate: DateTime, weekendDays: number[] = [5, 6]): number {
  let count = 0;
  let current = startDate.startOf("day");
  const end = endDate.startOf("day");

  while (current <= end) {
    // Luxon weekday: 1=Mon...7=Sun → convert to JS: 0=Sun...6=Sat via % 7
    if (!weekendDays.includes(current.weekday % 7)) {
      count++;
    }
    current = current.plus({ days: 1 });
  }
  return count;
}

/**
 * Compute attendance summary for a set of logs within a period.
 */
export function computeSummary(
  logs: Array<{ status: string; total_work_minutes: number; overtime_minutes: number }>,
  workingDays: number,
  periodLabel: string,
) {
  let daysPresent = 0;
  let daysAbsent = 0;
  let daysLate = 0;
  let daysOnLeave = 0;
  let totalWorkMinutes = 0;
  let totalOvertimeMinutes = 0;

  for (const log of logs) {
    switch (log.status) {
      case "PRESENT":
        daysPresent++;
        break;
      case "LATE":
        daysPresent++;
        daysLate++;
        break;
      case "HALF_DAY":
        daysPresent++;
        break;
      case "ABSENT":
        daysAbsent++;
        break;
      case "ON_LEAVE":
        daysOnLeave++;
        break;
    }
    totalWorkMinutes += log.total_work_minutes;
    totalOvertimeMinutes += log.overtime_minutes;
  }

  const attendanceRate = workingDays > 0 ? (daysPresent / workingDays) * 100 : 0;

  return {
    period: periodLabel,
    working_days: workingDays,
    days_present: daysPresent,
    days_absent: daysAbsent,
    days_late: daysLate,
    days_on_leave: daysOnLeave,
    total_work_minutes: totalWorkMinutes,
    total_overtime_minutes: totalOvertimeMinutes,
    formatted: {
      total_work_hours: formatDuration(totalWorkMinutes),
      total_overtime: formatDuration(totalOvertimeMinutes),
      attendance_rate: `${attendanceRate.toFixed(1)}%`,
    },
  };
}
