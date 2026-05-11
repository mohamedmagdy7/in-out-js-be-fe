"use client";

import { useMemo } from "react";
import type { TeamAttendanceLog } from "@/lib/api/types";
import { formatTime } from "@/lib/format";

type FeedEntry = {
  id: string;
  userName: string;
  department: string;
  time: string;
  isLive: boolean;
};

type Props = {
  logs: TeamAttendanceLog[] | undefined;
  isLoading: boolean;
};

export function LiveCheckInFeed({ logs, isLoading }: Props) {
  const entries = useMemo<FeedEntry[]>(() => {
    if (!logs) return [];
    const items: FeedEntry[] = [];
    for (const log of logs) {
      for (const s of log.sessions) {
        items.push({
          id: s.id,
          userName: log.user.full_name,
          department: log.user.department ?? "—",
          time: s.check_in_at,
          isLive: !s.check_out_at,
        });
      }
    }
    return items
      .sort(
        (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
      )
      .slice(0, 12);
  }, [logs]);

  return (
    <section className="rounded-lg border border-border bg-surface shadow-sm">
      <div className="border-b border-border px-5 py-3">
        <h2 className="text-sm font-semibold">Live check-in feed</h2>
        <p className="text-xs text-foreground-muted">
          Most recent check-ins from today. Refreshes every 2 minutes.
        </p>
      </div>
      <div className="px-5 py-4">
        {isLoading ? (
          <p className="py-6 text-center text-sm text-foreground-muted">
            Loading…
          </p>
        ) : entries.length === 0 ? (
          <p className="py-6 text-center text-sm text-foreground-muted">
            No check-ins yet today.
          </p>
        ) : (
          <ol className="flex flex-col gap-1.5">
            {entries.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between gap-3 rounded border border-border bg-surface-muted/40 px-3 py-2 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <span className="font-medium">{e.userName}</span>{" "}
                  <span className="text-foreground-muted">
                    checked in
                  </span>{" "}
                  <span className="font-medium tabular-nums">
                    {formatTime(e.time)}
                  </span>
                  <span className="ml-2 text-xs text-foreground-subtle">
                    {e.department}
                  </span>
                </div>
                {e.isLive ? (
                  <span className="inline-flex items-center gap-1 rounded bg-success-soft px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-success-soft-foreground">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
                    Live
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
