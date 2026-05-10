"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import type { LeaveRequest } from "@/lib/api/types";
import {
  Button,
  CenteredSpinner,
  LeaveBadge,
  toast,
} from "@/components/ui";
import { cancelLeaveRequest } from "@/lib/api/leave";
import { queryKeys } from "@/lib/query/keys";
import { formatDate } from "@/lib/format";

type Props = {
  data: LeaveRequest[] | undefined;
  isLoading: boolean;
};

export function LeaveRequestsTable({ data, isLoading }: Props) {
  const qc = useQueryClient();
  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelLeaveRequest(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["leave", "requests"] });
      const snapshots = qc.getQueriesData<{ data: LeaveRequest[] }>({
        queryKey: ["leave", "requests"],
      });
      for (const [key, snap] of snapshots) {
        if (!snap) continue;
        qc.setQueryData(key, {
          ...snap,
          data: snap.data.filter((r) => r.id !== id),
        });
      }
      return { snapshots };
    },
    onError: (err, _id, ctx) => {
      ctx?.snapshots.forEach(([key, snap]) => qc.setQueryData(key, snap));
      const axiosErr = err as AxiosError<{ message?: string }>;
      toast.error(
        "Could not cancel",
        axiosErr.response?.data?.message ?? "Please try again.",
      );
    },
    onSuccess: () => {
      toast.success("Request cancelled");
      qc.invalidateQueries({ queryKey: queryKeys.leave.balance });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["leave", "requests"] });
    },
  });

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-surface shadow-sm">
        <CenteredSpinner />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface px-6 py-10 text-center text-sm text-foreground-muted">
        You haven&apos;t submitted any leave requests yet.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider text-foreground-subtle">
              <th className="px-5 py-2.5 text-left font-medium">Type</th>
              <th className="px-5 py-2.5 text-left font-medium">From</th>
              <th className="px-5 py-2.5 text-left font-medium">To</th>
              <th className="px-5 py-2.5 text-left font-medium">Days</th>
              <th className="px-5 py-2.5 text-left font-medium">Status</th>
              <th className="px-5 py-2.5 text-left font-medium">Submitted</th>
              <th className="px-5 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r) => {
              const rejected = r.status === "REJECTED";
              return (
                <tr
                  key={r.id}
                  className="border-b border-border/60 align-top last:border-0"
                >
                  <td className="px-5 py-3 font-medium">{r.leave_type.name}</td>
                  <td className="px-5 py-3 tabular-nums text-foreground-muted">
                    {formatDate(r.start_date)}
                  </td>
                  <td className="px-5 py-3 tabular-nums text-foreground-muted">
                    {formatDate(r.end_date)}
                  </td>
                  <td className="px-5 py-3 tabular-nums">{r.total_days}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-col gap-1">
                      <LeaveBadge status={r.status} />
                      {rejected && r.reason ? (
                        <span className="text-[11px] text-foreground-subtle">
                          {r.reason}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-foreground-muted">
                    {formatDate(r.created_at)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {r.status === "PENDING" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => cancelMutation.mutate(r.id)}
                        disabled={
                          cancelMutation.isPending &&
                          cancelMutation.variables === r.id
                        }
                      >
                        Cancel
                      </Button>
                    ) : (
                      <span className="text-xs text-foreground-subtle">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
