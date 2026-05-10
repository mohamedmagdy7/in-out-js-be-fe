"use client";

import type { TodayResponse } from "@/lib/api/types";
import { formatTime, formatMinutes } from "@/lib/format";
import { cn } from "@/lib/cn";

type Props = { today: TodayResponse | undefined };

export function SessionsTimeline({ today }: Props) {
  const sessions = today?.sessions ?? [];

  if (sessions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface px-6 py-10 text-center">
        <p className="text-sm font-medium text-foreground">
          No activity yet today
        </p>
        <p className="mt-1 text-xs text-foreground-muted">
          Tap the Check in button above when you&apos;re ready to start.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {sessions.map((s, i) => {
        const ongoing = !s.check_out_at;
        return (
          <li
            key={s.id}
            className="flex items-center gap-4 rounded-lg border border-border bg-surface px-4 py-3 shadow-sm"
          >
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "text-[11px] font-medium uppercase tracking-wider",
                  ongoing ? "text-success" : "text-foreground-subtle",
                )}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>

            <div className="flex flex-1 items-center gap-3">
              <div className="flex flex-col items-end gap-0.5 text-right">
                <span className="text-xs uppercase tracking-wider text-foreground-subtle">
                  In
                </span>
                <span className="text-sm font-medium tabular-nums">
                  {formatTime(s.check_in_at)}
                </span>
              </div>

              <div className="relative flex flex-1 items-center px-2">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    ongoing ? "bg-success" : "bg-primary",
                  )}
                />
                <div
                  className={cn(
                    "h-px flex-1",
                    ongoing
                      ? "bg-gradient-to-r from-success via-success/40 to-transparent"
                      : "bg-border-strong",
                  )}
                />
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    ongoing
                      ? "animate-pulse bg-success"
                      : "bg-primary",
                  )}
                />
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-xs uppercase tracking-wider text-foreground-subtle">
                  Out
                </span>
                <span className="text-sm font-medium tabular-nums">
                  {ongoing ? "Ongoing" : formatTime(s.check_out_at!)}
                </span>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-foreground-subtle">
                Duration
              </p>
              <p className="text-sm font-semibold tabular-nums">
                {ongoing
                  ? "—"
                  : (s.formatted_duration ?? formatMinutes(s.duration_minutes ?? 0))}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
