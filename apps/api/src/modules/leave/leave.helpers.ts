import { DateTime } from "luxon";
import { db } from "@repo/db";
import { getWorkingDays } from "../attendance/attendance.helpers";

/**
 * Compute the number of working days between two dates,
 * excluding the company's configured weekend days.
 */
export function computeWorkingDays(
  startDate: string,
  endDate: string,
  weekendDays: number[],
): number {
  const start = DateTime.fromISO(startDate);
  const end = DateTime.fromISO(endDate);
  return getWorkingDays(start, end, weekendDays);
}

/**
 * Get the list of working dates (as YYYY-MM-DD strings) in a range,
 * excluding the company's weekend days.
 */
export function getWorkingDatesList(
  startDate: string,
  endDate: string,
  weekendDays: number[],
): string[] {
  const dates: string[] = [];
  let current = DateTime.fromISO(startDate).startOf("day");
  const end = DateTime.fromISO(endDate).startOf("day");

  while (current <= end) {
    if (!weekendDays.includes(current.weekday % 7)) {
      dates.push(current.toFormat("yyyy-MM-dd"));
    }
    current = current.plus({ days: 1 });
  }
  return dates;
}

/**
 * Check if a leave request overlaps with any existing approved or pending requests
 * for the same user.
 */
export async function checkOverlap(
  userId: string,
  companyId: string,
  startDate: string,
  endDate: string,
  excludeRequestId?: string,
): Promise<boolean> {
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);

  const where: any = {
    user_id: userId,
    company_id: companyId,
    status: { in: ["APPROVED", "PENDING"] },
    start_date: { lte: end },
    end_date: { gte: start },
  };

  if (excludeRequestId) {
    where.id = { not: excludeRequestId };
  }

  const count = await db.leaveRequest.count({ where });
  return count > 0;
}

/**
 * Get the remaining leave balance for a user for a specific leave type in a given year.
 * Returns { days_per_year, days_used (approved), days_pending, days_remaining }.
 */
export async function getRemainingBalance(
  userId: string,
  companyId: string,
  leaveTypeId: string,
  year: number,
): Promise<{
  days_per_year: number;
  days_used: number;
  days_pending: number;
  days_remaining: number;
}> {
  const leaveType = await db.leaveType.findFirst({
    where: { id: leaveTypeId, company_id: companyId },
  });

  if (!leaveType) {
    return { days_per_year: 0, days_used: 0, days_pending: 0, days_remaining: 0 };
  }

  const yearStart = new Date(`${year}-01-01T00:00:00.000Z`);
  const yearEnd = new Date(`${year}-12-31T00:00:00.000Z`);

  const [approvedAgg, pendingAgg] = await Promise.all([
    db.leaveRequest.aggregate({
      where: {
        user_id: userId,
        company_id: companyId,
        leave_type_id: leaveTypeId,
        status: "APPROVED",
        start_date: { lte: yearEnd },
        end_date: { gte: yearStart },
      },
      _sum: { total_days: true },
    }),
    db.leaveRequest.aggregate({
      where: {
        user_id: userId,
        company_id: companyId,
        leave_type_id: leaveTypeId,
        status: "PENDING",
        start_date: { lte: yearEnd },
        end_date: { gte: yearStart },
      },
      _sum: { total_days: true },
    }),
  ]);

  const days_used = approvedAgg._sum.total_days ?? 0;
  const days_pending = pendingAgg._sum.total_days ?? 0;
  const days_remaining = Math.max(0, leaveType.days_per_year - days_used - days_pending);

  return {
    days_per_year: leaveType.days_per_year,
    days_used,
    days_pending,
    days_remaining,
  };
}
