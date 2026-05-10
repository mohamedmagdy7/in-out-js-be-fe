import { addDays, isAfter, parseISO, startOfDay } from "date-fns";

/**
 * Compute the number of working days in [start, end] inclusive,
 * excluding the company's weekend days. The API uses Luxon's
 * `weekday % 7` convention where Sunday = 0, Monday = 1, ..., Saturday = 6.
 */
export function computeWorkingDays(
  startISO: string,
  endISO: string,
  weekendDays: number[],
): number {
  if (!startISO || !endISO) return 0;
  const start = startOfDay(parseISO(startISO));
  const end = startOfDay(parseISO(endISO));
  if (isAfter(start, end)) return 0;

  let count = 0;
  let cursor = start;
  while (!isAfter(cursor, end)) {
    const day = cursor.getDay(); // 0 (Sun) – 6 (Sat) — matches the API convention
    if (!weekendDays.includes(day)) count++;
    cursor = addDays(cursor, 1);
  }
  return count;
}
