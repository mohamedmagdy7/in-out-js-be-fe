"use client";

import { useMemo } from "react";
import {
  addMonths,
  endOfMonth,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameDay,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AttendanceLog, AttendanceStatus } from "@/lib/api/types";
import { IconButton } from "@/components/ui";
import { cn } from "@/lib/cn";

type Props = {
  monthDate: Date;
  onChangeMonth: (date: Date) => void;
  weekendDays: number[];
  logs: AttendanceLog[];
  onSelectDay: (date: Date, log?: AttendanceLog) => void;
};

const STATUS_DOT: Record<AttendanceStatus, string> = {
  PRESENT: "bg-success",
  LATE: "bg-warning",
  HALF_DAY: "bg-warning",
  ABSENT: "bg-danger",
  ON_LEAVE: "bg-primary",
};

const STATUS_BG: Record<AttendanceStatus, string> = {
  PRESENT: "bg-success/10 hover:bg-success/15",
  LATE: "bg-warning/10 hover:bg-warning/15",
  HALF_DAY: "bg-warning/10 hover:bg-warning/15",
  ABSENT: "bg-danger/10 hover:bg-danger/15",
  ON_LEAVE: "bg-primary/10 hover:bg-primary/15",
};

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export function AttendanceCalendar({
  monthDate,
  onChangeMonth,
  weekendDays,
  logs,
  onSelectDay,
}: Props) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 0 });
    const arr: Date[] = [];
    let d = start;
    while (d <= end) {
      arr.push(d);
      d = addDays(d, 1);
    }
    return arr;
  }, [monthDate]);

  const logByDate = useMemo(() => {
    const m = new Map<string, AttendanceLog>();
    for (const log of logs) {
      const key = format(new Date(log.date), "yyyy-MM-dd");
      m.set(key, log);
    }
    return m;
  }, [logs]);

  const today = new Date();

  return (
    <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold tracking-tight">
          {format(monthDate, "LLLL yyyy")}
        </h3>
        <div className="flex items-center gap-1">
          <IconButton
            aria-label="Previous month"
            onClick={() => onChangeMonth(addMonths(monthDate, -1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </IconButton>
          <IconButton
            aria-label="This month"
            onClick={() => onChangeMonth(new Date())}
            className="px-3 text-xs uppercase tracking-wider"
          >
            Today
          </IconButton>
          <IconButton
            aria-label="Next month"
            onClick={() => onChangeMonth(addMonths(monthDate, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </IconButton>
        </div>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase tracking-wider text-foreground-subtle">
        {WEEKDAYS.map((d, i) => (
          <span key={`${d}-${i}`}>{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const inMonth = isSameMonth(d, monthDate);
          const key = format(d, "yyyy-MM-dd");
          const log = logByDate.get(key);
          const dayOfWeek = d.getDay();
          const isoWeekday = dayOfWeek === 0 ? 7 : dayOfWeek;
          const isWeekend = weekendDays.includes(isoWeekday % 7);
          const isToday = isSameDay(d, today);

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDay(d, log)}
              disabled={!inMonth}
              className={cn(
                "group flex aspect-square flex-col items-center justify-between rounded-md border border-transparent p-2 text-xs transition focus-ring",
                inMonth ? "text-foreground" : "text-foreground-subtle/40",
                inMonth && !log && (isWeekend ? "bg-surface-muted/40" : "bg-surface hover:bg-surface-hover"),
                inMonth && log && STATUS_BG[log.status],
                isToday && "ring-1 ring-primary/60",
              )}
            >
              <span
                className={cn(
                  "self-start text-xs font-medium tabular-nums",
                  isToday && "text-primary",
                )}
              >
                {format(d, "d")}
              </span>
              {log ? (
                <span
                  className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[log.status])}
                  aria-label={log.status}
                />
              ) : isWeekend && inMonth ? (
                <span className="h-1 w-3 rounded-full bg-foreground-subtle/40" />
              ) : (
                <span className="h-1.5 w-1.5" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-foreground-muted">
        <Legend dot="bg-success" label="Present" />
        <Legend dot="bg-warning" label="Late / Half day" />
        <Legend dot="bg-danger" label="Absent" />
        <Legend dot="bg-primary" label="On leave" />
        <Legend dot="bg-foreground-subtle/40" label="Weekend" />
      </div>
    </div>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
      {label}
    </span>
  );
}
