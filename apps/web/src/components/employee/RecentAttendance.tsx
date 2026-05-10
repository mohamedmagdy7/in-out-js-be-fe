"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { AttendanceLog, AttendanceSession } from "@/lib/api/types";
import { AttendanceBadge, CenteredSpinner } from "@/components/ui";
import { formatShortDate, formatTime, formatMinutes } from "@/lib/format";

type Props = {
  logs: AttendanceLog[] | undefined;
  isLoading: boolean;
};

function firstAndLast(sessions: AttendanceSession[]): {
  first: string | null;
  last: string | null;
} {
  if (sessions.length === 0) return { first: null, last: null };
  const sorted = [...sessions].sort((a, b) =>
    new Date(a.check_in_at).getTime() - new Date(b.check_in_at).getTime(),
  );
  const first = sorted[0].check_in_at;
  const lastSession = [...sorted]
    .reverse()
    .find((s) => s.check_out_at !== null);
  return {
    first,
    last: lastSession?.check_out_at ?? null,
  };
}

export function RecentAttendance({ logs, isLoading }: Props) {
  return (
    <div className="rounded-lg border border-border bg-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div>
          <h3 className="text-sm font-semibold">Recent attendance</h3>
          <p className="text-xs text-foreground-muted">Last 5 days</p>
        </div>
        <Link
          href="/dashboard/history"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          View all
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {isLoading ? (
        <CenteredSpinner />
      ) : !logs || logs.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-foreground-muted">
          No attendance records yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wider text-foreground-subtle">
                <th className="px-5 py-2 text-left font-medium">Date</th>
                <th className="px-5 py-2 text-left font-medium">In</th>
                <th className="px-5 py-2 text-left font-medium">Out</th>
                <th className="px-5 py-2 text-left font-medium">Hours</th>
                <th className="px-5 py-2 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const { first, last } = firstAndLast(log.sessions);
                return (
                  <tr
                    key={log.id}
                    className="border-b border-border/60 last:border-0"
                  >
                    <td className="px-5 py-3 font-medium">
                      {formatShortDate(log.date)}
                    </td>
                    <td className="px-5 py-3 tabular-nums text-foreground-muted">
                      {first ? formatTime(first) : "—"}
                    </td>
                    <td className="px-5 py-3 tabular-nums text-foreground-muted">
                      {last ? formatTime(last) : log.is_live ? "Ongoing" : "—"}
                    </td>
                    <td className="px-5 py-3 tabular-nums">
                      {formatMinutes(log.total_work_minutes)}
                    </td>
                    <td className="px-5 py-3">
                      <AttendanceBadge status={log.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
