"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import type {
  AttendanceSession,
  Pagination,
  TeamAttendanceLog,
} from "@/lib/api/types";
import {
  AttendanceBadge,
  Button,
  CenteredSpinner,
} from "@/components/ui";
import { formatDate, formatMinutes, formatTime } from "@/lib/format";
import { cn } from "@/lib/cn";

type Props = {
  logs: TeamAttendanceLog[] | undefined;
  pagination: Pagination | undefined;
  isLoading: boolean;
  onPageChange: (page: number) => void;
};

export function TeamAttendanceTable({
  logs,
  pagination,
  isLoading,
  onPageChange,
}: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

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
        No attendance records for the selected filters.
      </div>
    );
  }

  const totalPages = pagination
    ? Math.max(1, Math.ceil(pagination.total / pagination.limit))
    : 1;
  const page = pagination?.page ?? 1;

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="rounded-lg border border-border bg-surface shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider text-foreground-subtle">
              <th className="w-8 px-3 py-2.5"></th>
              <th className="px-5 py-2.5 text-left font-medium">Employee</th>
              <th className="px-5 py-2.5 text-left font-medium">Department</th>
              <th className="px-5 py-2.5 text-left font-medium">Date</th>
              <th className="px-5 py-2.5 text-left font-medium">Sessions</th>
              <th className="px-5 py-2.5 text-left font-medium">Work</th>
              <th className="px-5 py-2.5 text-left font-medium">Overtime</th>
              <th className="px-5 py-2.5 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => {
              const isOpen = expanded.has(log.id);
              return (
                <Fragment key={log.id}>
                  <tr
                    onClick={() => toggle(log.id)}
                    className="cursor-pointer border-b border-border/60 transition-colors hover:bg-surface-hover"
                  >
                    <td className="px-3 py-3 text-foreground-subtle">
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </td>
                    <td className="px-5 py-3 font-medium">
                      {log.user.full_name}
                    </td>
                    <td className="px-5 py-3 text-foreground-muted">
                      {log.user.department ?? "—"}
                    </td>
                    <td className="px-5 py-3 tabular-nums text-foreground-muted">
                      {formatDate(log.date)}
                    </td>
                    <td className="px-5 py-3 tabular-nums">
                      {log.sessions.length === 0
                        ? "—"
                        : `${log.sessions.length} session${log.sessions.length === 1 ? "" : "s"}`}
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1.5 tabular-nums">
                        {formatMinutes(log.total_work_minutes)}
                        {log.is_live ? (
                          <span
                            className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-success"
                            title="Currently checked in"
                          />
                        ) : null}
                      </span>
                    </td>
                    <td className="px-5 py-3 tabular-nums">
                      {formatMinutes(log.overtime_minutes)}
                    </td>
                    <td className="px-5 py-3">
                      <AttendanceBadge status={log.status} />
                    </td>
                  </tr>
                  {isOpen ? (
                    <tr className="border-b border-border/60 bg-surface-muted/40">
                      <td colSpan={8} className="px-5 py-4">
                        <SessionsList sessions={log.sessions} />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
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

function SessionsList({ sessions }: { sessions: AttendanceSession[] }) {
  if (sessions.length === 0) {
    return (
      <p className="text-xs text-foreground-muted">
        No sessions logged for this day.
      </p>
    );
  }
  return (
    <ol className="flex flex-col gap-2">
      {sessions.map((s, i) => {
        const ongoing = !s.check_out_at;
        return (
          <li
            key={s.id}
            className="flex items-center gap-3 rounded border border-border bg-surface px-3 py-2 text-xs"
          >
            <span className="font-medium tabular-nums text-foreground-subtle">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="tabular-nums">
              {formatTime(s.check_in_at)} →{" "}
              {ongoing ? (
                <span className="font-medium text-success">Ongoing</span>
              ) : (
                formatTime(s.check_out_at!)
              )}
            </span>
            <span
              className={cn(
                "ml-auto font-semibold tabular-nums",
                ongoing && "text-success",
              )}
            >
              {ongoing
                ? "—"
                : (s.formatted_duration ??
                  formatMinutes(s.duration_minutes ?? 0))}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
