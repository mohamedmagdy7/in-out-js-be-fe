"use client";

import type { AttendanceReportRow } from "@/lib/api/types";
import { CenteredSpinner } from "@/components/ui";
import { formatMinutes } from "@/lib/format";

type Props = {
  rows: AttendanceReportRow[] | undefined;
  isLoading: boolean;
};

export function AttendanceReportTable({ rows, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-surface shadow-sm">
        <CenteredSpinner />
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface px-6 py-10 text-center text-sm text-foreground-muted">
        No attendance data for this period.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider text-foreground-subtle">
              <th className="px-5 py-2.5 text-left font-medium">Employee</th>
              <th className="px-5 py-2.5 text-left font-medium">Department</th>
              <th className="px-5 py-2.5 text-right font-medium">Present</th>
              <th className="px-5 py-2.5 text-right font-medium">Absent</th>
              <th className="px-5 py-2.5 text-right font-medium">Late</th>
              <th className="px-5 py-2.5 text-right font-medium">On leave</th>
              <th className="px-5 py-2.5 text-right font-medium">Work</th>
              <th className="px-5 py-2.5 text-right font-medium">Overtime</th>
              <th className="px-5 py-2.5 text-right font-medium">Rate</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.user.id}
                className="border-b border-border/60 last:border-0"
              >
                <td className="px-5 py-3 font-medium">{r.user.full_name}</td>
                <td className="px-5 py-3 text-foreground-muted">
                  {r.user.department ?? "—"}
                </td>
                <td className="px-5 py-3 text-right tabular-nums">
                  {r.days_present}
                </td>
                <td className="px-5 py-3 text-right tabular-nums">
                  {r.days_absent}
                </td>
                <td className="px-5 py-3 text-right tabular-nums">
                  {r.days_late}
                </td>
                <td className="px-5 py-3 text-right tabular-nums">
                  {r.days_on_leave}
                </td>
                <td className="px-5 py-3 text-right tabular-nums">
                  {formatMinutes(r.total_work_minutes)}
                </td>
                <td className="px-5 py-3 text-right tabular-nums">
                  {formatMinutes(r.total_overtime_minutes)}
                </td>
                <td className="px-5 py-3 text-right tabular-nums font-medium">
                  {r.attendance_rate}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
