"use client";

import Link from "next/link";
import { ArrowRight, Calendar } from "lucide-react";
import type { LeaveBalanceResponse } from "@/lib/api/types";
import { CenteredSpinner } from "@/components/ui";

type Props = {
  data: LeaveBalanceResponse | undefined;
  isLoading: boolean;
};

export function LeaveBalanceStrip({ data, isLoading }: Props) {
  return (
    <div className="rounded-lg border border-border bg-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div>
          <h3 className="text-sm font-semibold">Leave balance</h3>
          <p className="text-xs text-foreground-muted">
            {data ? `For ${data.year}` : "Loading…"}
          </p>
        </div>
        <Link
          href="/dashboard/leave"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Request leave
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {isLoading ? (
        <CenteredSpinner />
      ) : !data || data.balances.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-foreground-muted">
          No leave types configured.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
          {data.balances.map((b) => (
            <li
              key={b.leave_type.id}
              className="flex items-center gap-3 bg-surface px-5 py-4"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-soft text-primary-soft-foreground">
                <Calendar className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wider text-foreground-subtle">
                  {b.leave_type.name}
                </p>
                <p className="text-base font-semibold tabular-nums">
                  {b.days_remaining}
                  <span className="text-sm font-normal text-foreground-muted">
                    {" "}
                    / {b.days_per_year} days
                  </span>
                </p>
                {b.days_pending > 0 ? (
                  <p className="text-[11px] text-warning-soft-foreground">
                    {b.days_pending} pending
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
