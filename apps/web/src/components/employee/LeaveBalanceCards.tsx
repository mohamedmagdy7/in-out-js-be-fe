"use client";

import type { LeaveBalanceResponse } from "@/lib/api/types";
import { CenteredSpinner, ProgressBar } from "@/components/ui";

type Props = {
  data: LeaveBalanceResponse | undefined;
  isLoading: boolean;
};

export function LeaveBalanceCards({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-surface shadow-sm">
        <CenteredSpinner />
      </div>
    );
  }

  if (!data || data.balances.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface px-6 py-10 text-center text-sm text-foreground-muted">
        No leave types configured.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {data.balances.map((b) => {
        const pct = b.days_per_year
          ? (b.days_used / b.days_per_year) * 100
          : 0;
        return (
          <div
            key={b.leave_type.id}
            className="rounded-lg border border-border bg-surface p-5 shadow-sm"
          >
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-semibold">{b.leave_type.name}</h3>
              <span className="text-[11px] uppercase tracking-wider text-foreground-subtle">
                {b.leave_type.is_paid ? "Paid" : "Unpaid"}
              </span>
            </div>
            <p className="mt-3 text-3xl font-semibold tabular-nums">
              {b.days_remaining}
              <span className="ml-1 text-base font-normal text-foreground-muted">
                / {b.days_per_year} days
              </span>
            </p>
            <ProgressBar
              value={b.days_used}
              max={b.days_per_year}
              tone={pct >= 80 ? "warning" : "primary"}
              className="mt-4"
            />
            <div className="mt-3 flex items-center justify-between text-xs text-foreground-muted">
              <span>{b.days_used} used</span>
              {b.days_pending > 0 ? (
                <span className="text-warning-soft-foreground">
                  {b.days_pending} pending
                </span>
              ) : (
                <span>{b.days_remaining} remaining</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
