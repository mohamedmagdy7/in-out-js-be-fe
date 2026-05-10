"use client";

import { useEffect, useState } from "react";
import type { TeamMember } from "@/lib/api/types";
import { CenteredSpinner } from "@/components/ui";
import { formatMinutes } from "@/lib/format";
import { cn } from "@/lib/cn";

type LiveStatus = "checked_in" | "not_in" | "late" | "absent" | "on_leave";

const DOT_CLASS: Record<LiveStatus, string> = {
  checked_in: "bg-success",
  not_in: "bg-foreground-subtle",
  late: "bg-warning",
  absent: "bg-danger",
  on_leave: "bg-primary",
};

const LABEL: Record<LiveStatus, string> = {
  checked_in: "Checked in",
  not_in: "Not yet in",
  late: "Late",
  absent: "Absent",
  on_leave: "On leave",
};

export type EmployeeStatusEntry = {
  employee: TeamMember;
  status: LiveStatus;
  isLive: boolean;
  totalWorkMinutes: number;
  sessionsCount: number;
  currentSessionStartedAt: string | null;
};

type Props = {
  entries: EmployeeStatusEntry[] | undefined;
  isLoading: boolean;
};

export function TeamStatusGrid({ entries, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-surface shadow-sm">
        <CenteredSpinner />
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface px-6 py-10 text-center text-sm text-foreground-muted">
        You have no direct reports yet.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {entries.map((entry) => (
        <EmployeeCard key={entry.employee.id} entry={entry} />
      ))}
    </div>
  );
}

function EmployeeCard({ entry }: { entry: EmployeeStatusEntry }) {
  const { employee, status, isLive, totalWorkMinutes, sessionsCount } = entry;
  const initials =
    `${employee.first_name[0] ?? ""}${employee.last_name[0] ?? ""}`.toUpperCase();

  const sessionElapsed = useElapsedSinceStart(
    isLive ? entry.currentSessionStartedAt : null,
  );

  return (
    <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="relative">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary-soft-foreground">
            {initials || "?"}
          </div>
          <span
            aria-hidden
            className={cn(
              "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-surface",
              DOT_CLASS[status],
              status === "checked_in" && "animate-pulse",
            )}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate text-sm font-semibold">
              {employee.first_name} {employee.last_name}
            </p>
            <span className="shrink-0 text-[11px] uppercase tracking-wider text-foreground-subtle">
              {LABEL[status]}
            </span>
          </div>
          <p className="truncate text-xs text-foreground-muted">
            {employee.department?.name ?? "No department"}
          </p>

          <div className="mt-3 flex items-center justify-between text-xs">
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wider text-foreground-subtle">
                Today
              </span>
              <span className="flex items-center gap-1.5 text-sm font-semibold tabular-nums text-foreground">
                {formatMinutes(totalWorkMinutes)}
                {isLive ? (
                  <span
                    className="inline-flex items-center gap-1 rounded bg-success-soft px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-success-soft-foreground"
                    title="Live — current session in progress"
                  >
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
                    Live
                  </span>
                ) : null}
              </span>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-[11px] uppercase tracking-wider text-foreground-subtle">
                {isLive
                  ? `Session ${sessionsCount}`
                  : sessionsCount > 0
                    ? `${sessionsCount} session${sessionsCount === 1 ? "" : "s"}`
                    : "—"}
              </span>
              <span className="text-sm font-medium tabular-nums text-foreground-muted">
                {isLive && sessionElapsed !== null ? sessionElapsed : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function useElapsedSinceStart(start: string | null): string | null {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!start) return;
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, [start]);

  if (!start) return null;
  const ms = now - new Date(start).getTime();
  if (ms < 0) return null;
  const minutes = Math.round(ms / 60_000);
  return formatMinutes(minutes);
}
