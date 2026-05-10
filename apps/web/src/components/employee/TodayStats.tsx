"use client";

import { CheckCircle2, Clock3, Flame, Hourglass } from "lucide-react";
import type { StatusResponse, TodayResponse } from "@/lib/api/types";
import { formatMinutes } from "@/lib/format";

type Props = {
  status: StatusResponse | undefined;
  today: TodayResponse | undefined;
};

export function TodayStats({ status, today }: Props) {
  const sessions = today?.sessions.length ?? 0;
  const total = status?.today_total_minutes ?? 0;
  const overtime = status?.today_overtime_minutes ?? 0;
  const remaining = status?.remaining_to_threshold ?? 0;
  const thresholdMet = status?.threshold_met ?? false;

  const items = [
    {
      label: "Sessions",
      value: String(sessions),
      icon: Clock3,
      tone: "text-primary",
    },
    {
      label: "Work hours",
      value: formatMinutes(total),
      icon: Hourglass,
      tone: "text-primary",
    },
    {
      label: "Overtime",
      value: formatMinutes(overtime),
      icon: Flame,
      tone: overtime > 0 ? "text-warning" : "text-foreground-subtle",
    },
    {
      label: "Remaining",
      value: thresholdMet ? "Done" : formatMinutes(remaining),
      icon: CheckCircle2,
      tone: thresholdMet ? "text-success" : "text-foreground-subtle",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map(({ label, value, icon: Icon, tone }) => (
        <div
          key={label}
          className="rounded-lg border border-border bg-surface p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-foreground-subtle">
              {label}
            </p>
            <Icon className={`h-4 w-4 ${tone}`} />
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
        </div>
      ))}
    </div>
  );
}
