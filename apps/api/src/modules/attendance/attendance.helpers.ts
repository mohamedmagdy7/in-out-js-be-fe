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
