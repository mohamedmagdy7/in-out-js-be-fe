"use client";

import { Check, X } from "lucide-react";
import type { LeaveRequestForReviewer } from "@/lib/api/types";
import { Button } from "@/components/ui";
import { formatDate } from "@/lib/format";

type Props = {
  request: LeaveRequestForReviewer;
  onApprove: () => void;
  onReject: () => void;
  isPending?: boolean;
};

export function LeaveRequestCard({
  request,
  onApprove,
  onReject,
  isPending,
}: Props) {
  const initials =
    `${request.user.first_name[0] ?? ""}${request.user.last_name[0] ?? ""}`.toUpperCase();

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary-soft-foreground">
          {initials || "?"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {request.user.first_name} {request.user.last_name}
          </p>
          <p className="truncate text-xs text-foreground-muted">
            {request.user.department?.name ?? "No department"}
          </p>
        </div>
        <span className="shrink-0 rounded-sm border border-border bg-surface-muted px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-foreground-muted">
          {request.leave_type.name}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 rounded-md border border-dashed border-border bg-surface-muted/50 px-3 py-2 text-xs">
        <div>
          <p className="uppercase tracking-wider text-foreground-subtle">
            From
          </p>
          <p className="mt-0.5 font-medium tabular-nums">
            {formatDate(request.start_date)}
          </p>
        </div>
        <div>
          <p className="uppercase tracking-wider text-foreground-subtle">To</p>
          <p className="mt-0.5 font-medium tabular-nums">
            {formatDate(request.end_date)}
          </p>
        </div>
        <div>
          <p className="uppercase tracking-wider text-foreground-subtle">
            Days
          </p>
          <p className="mt-0.5 font-medium tabular-nums">
            {request.total_days}
          </p>
        </div>
      </div>

      {request.reason ? (
        <p className="text-sm text-foreground-muted">
          <span className="text-xs font-medium uppercase tracking-wider text-foreground-subtle">
            Reason —{" "}
          </span>
          {request.reason}
        </p>
      ) : (
        <p className="text-xs italic text-foreground-subtle">
          No reason provided.
        </p>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onReject}
          disabled={isPending}
          leftIcon={<X className="h-4 w-4" />}
        >
          Reject
        </Button>
        <Button
          size="sm"
          onClick={onApprove}
          loading={isPending}
          leftIcon={<Check className="h-4 w-4" />}
        >
          Approve
        </Button>
      </div>
    </div>
  );
}
