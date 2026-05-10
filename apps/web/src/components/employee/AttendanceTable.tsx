"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AttendanceLog, Pagination } from "@/lib/api/types";
import {
  AttendanceBadge,
  Button,
  CenteredSpinner,
} from "@/components/ui";
import { formatDate, formatTime, formatMinutes } from "@/lib/format";

type Props = {
  logs: AttendanceLog[] | undefined;
  pagination: Pagination | undefined;
  isLoading: boolean;
  onPageChange: (page: number) => void;
};

export function AttendanceTable({
  logs,
  pagination,
  isLoading,
  onPageChange,
}: Props) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-surface shadow-sm">
        <CenteredSpinner />
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface px-6 py-12 text-center text-sm text-foreground-muted">
        No attendance records for the selected period.
      </div>
    );
  }

  const totalPages = pagination
    ? Math.max(1, Math.ceil(pagination.total / pagination.limit))
    : 1;
  const page = pagination?.page ?? 1;

  return (
    <div className="rounded-lg border border-border bg-surface shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider text-foreground-subtle">
              <th className="px-5 py-2.5 text-left font-medium">Date</th>
              <th className="px-5 py-2.5 text-left font-medium">Check in</th>
              <th className="px-5 py-2.5 text-left font-medium">Check out</th>
              <th className="px-5 py-2.5 text-left font-medium">Work</th>
              <th className="px-5 py-2.5 text-left font-medium">Overtime</th>
              <th className="px-5 py-2.5 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => {
              const sortedSessions = [...log.sessions].sort(
                (a, b) =>
                  new Date(a.check_in_at).getTime() -
                  new Date(b.check_in_at).getTime(),
              );
              const first = sortedSessions[0]?.check_in_at ?? null;
              const lastClosed = [...sortedSessions]
                .reverse()
                .find((s) => s.check_out_at !== null);
              return (
                <tr
                  key={log.id}
                  className="border-b border-border/60 last:border-0"
                >
                  <td className="px-5 py-3 font-medium">
                    {formatDate(log.date)}
                  </td>
                  <td className="px-5 py-3 tabular-nums text-foreground-muted">
                    {first ? formatTime(first) : "—"}
                  </td>
                  <td className="px-5 py-3 tabular-nums text-foreground-muted">
                    {lastClosed
                      ? formatTime(lastClosed.check_out_at!)
                      : log.is_live
                        ? "Ongoing"
                        : "—"}
                  </td>
                  <td className="px-5 py-3 tabular-nums">
                    {formatMinutes(log.total_work_minutes)}
                  </td>
                  <td className="px-5 py-3 tabular-nums">
                    {formatMinutes(log.overtime_minutes)}
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

      <div className="flex items-center justify-between border-t border-border px-5 py-3 text-xs text-foreground-muted">
        <span>
          Page {page} of {totalPages}
          {pagination ? ` · ${pagination.total} total` : ""}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            leftIcon={<ChevronLeft className="h-4 w-4" />}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            rightIcon={<ChevronRight className="h-4 w-4" />}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
