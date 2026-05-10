"use client";

import type { AttendanceReportRow } from "@/lib/api/types";

type Props = { rows: AttendanceReportRow[] };

export function AttendanceReportBars({ rows }: Props) {
  if (rows.length === 0) return null;

  const parsed = rows.map((r) => ({
    name: r.user.full_name,
    rate: parseFloat(r.attendance_rate),
  }));
  const max = Math.max(100, ...parsed.map((p) => p.rate));

  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <h3 className="text-sm font-semibold">Attendance rate by employee</h3>
      <ul className="mt-4 flex flex-col gap-2.5">
        {parsed.map((p) => {
          const pct = Math.min(100, (p.rate / max) * 100);
          const tone =
            p.rate >= 90
              ? "bg-success"
              : p.rate >= 75
                ? "bg-primary"
                : p.rate >= 50
                  ? "bg-warning"
                  : "bg-danger";
          return (
            <li key={p.name} className="text-xs">
              <div className="flex items-baseline justify-between">
                <span className="truncate font-medium text-foreground">
                  {p.name}
                </span>
                <span className="tabular-nums text-foreground-muted">
                  {p.rate.toFixed(1)}%
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
                <div
                  className={`h-full rounded-full transition-all ${tone}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
