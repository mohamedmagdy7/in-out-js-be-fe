"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  approveLeaveRequest,
  fetchTeamLeaveRequests,
  rejectLeaveRequest,
} from "@/lib/api/manager";
import { queryKeys } from "@/lib/query/keys";
import {
  CenteredSpinner,
  LeaveBadge,
  toast,
} from "@/components/ui";
import { LeaveRequestCard } from "@/components/manager/LeaveRequestCard";
import { RejectModal } from "@/components/manager/RejectModal";
import type { LeaveRequestForReviewer } from "@/lib/api/types";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";

type Tab = "PENDING" | "APPROVED" | "REJECTED";

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "PENDING", label: "Pending" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
];

export default function ManagerLeavePage() {
  const [tab, setTab] = useState<Tab>("PENDING");
  const [rejectTarget, setRejectTarget] =
    useState<LeaveRequestForReviewer | null>(null);

  const qc = useQueryClient();

  const requestsQuery = useQuery({
    queryKey: queryKeys.manager.leaveRequests({ status: tab, limit: 50 }),
    queryFn: () => fetchTeamLeaveRequests({ status: tab, limit: 50 }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveLeaveRequest(id),
    onSuccess: () => {
      toast.success("Request approved");
      qc.invalidateQueries({ queryKey: ["manager", "leave"] });
      qc.invalidateQueries({ queryKey: queryKeys.manager.summary });
    },
    onError: (err) => {
      const axiosErr = err as AxiosError<{ message?: string }>;
      toast.error(
        "Could not approve",
        axiosErr.response?.data?.message ?? "Please try again.",
      );
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rejectLeaveRequest(id, reason),
    onSuccess: () => {
      toast.success("Request rejected");
      setRejectTarget(null);
      qc.invalidateQueries({ queryKey: ["manager", "leave"] });
      qc.invalidateQueries({ queryKey: queryKeys.manager.summary });
    },
    onError: (err) => {
      const axiosErr = err as AxiosError<{ message?: string }>;
      toast.error(
        "Could not reject",
        axiosErr.response?.data?.message ?? "Please try again.",
      );
    },
  });

  const data = requestsQuery.data?.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Leave requests
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Review and decide on time-off from your team.
        </p>
      </div>

      <div className="inline-flex w-fit rounded-md border border-border bg-surface p-0.5">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "h-8 rounded px-3 text-xs font-medium transition-colors",
              tab === key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-foreground-muted hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {requestsQuery.isLoading ? (
        <div className="rounded-lg border border-border bg-surface shadow-sm">
          <CenteredSpinner />
        </div>
      ) : data.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface px-6 py-10 text-center text-sm text-foreground-muted">
          {tab === "PENDING"
            ? "No leave requests pending. You're all caught up."
            : tab === "APPROVED"
              ? "No approved requests yet."
              : "No rejected requests yet."}
        </div>
      ) : tab === "PENDING" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.map((r) => (
            <LeaveRequestCard
              key={r.id}
              request={r}
              onApprove={() => approveMutation.mutate(r.id)}
              onReject={() => setRejectTarget(r)}
              isPending={
                (approveMutation.isPending && approveMutation.variables === r.id) ||
                (rejectMutation.isPending && rejectMutation.variables?.id === r.id)
              }
            />
          ))}
        </div>
      ) : (
        <DecidedTable rows={data} />
      )}

      <RejectModal
        open={rejectTarget !== null}
        onClose={() => setRejectTarget(null)}
        onConfirm={(reason) => {
          if (!rejectTarget) return;
          rejectMutation.mutate({ id: rejectTarget.id, reason });
        }}
        isSubmitting={rejectMutation.isPending}
        employeeName={
          rejectTarget
            ? `${rejectTarget.user.first_name} ${rejectTarget.user.last_name}`
            : undefined
        }
      />
    </div>
  );
}

function DecidedTable({ rows }: { rows: LeaveRequestForReviewer[] }) {
  return (
    <div className="rounded-lg border border-border bg-surface shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider text-foreground-subtle">
              <th className="px-5 py-2.5 text-left font-medium">Employee</th>
              <th className="px-5 py-2.5 text-left font-medium">Type</th>
              <th className="px-5 py-2.5 text-left font-medium">Dates</th>
              <th className="px-5 py-2.5 text-left font-medium">Days</th>
              <th className="px-5 py-2.5 text-left font-medium">Decision</th>
              <th className="px-5 py-2.5 text-left font-medium">Decided on</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-b border-border/60 align-top last:border-0"
              >
                <td className="px-5 py-3 font-medium">
                  {r.user.first_name} {r.user.last_name}
                </td>
                <td className="px-5 py-3 text-foreground-muted">
                  {r.leave_type.name}
                </td>
                <td className="px-5 py-3 tabular-nums text-foreground-muted">
                  {formatDate(r.start_date)} → {formatDate(r.end_date)}
                </td>
                <td className="px-5 py-3 tabular-nums">{r.total_days}</td>
                <td className="px-5 py-3">
                  <div className="flex flex-col items-start gap-1">
                    <LeaveBadge status={r.status} />
                    {r.status === "REJECTED" && r.reason ? (
                      <span className="text-[11px] text-foreground-subtle">
                        {r.reason}
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-5 py-3 text-foreground-muted">
                  {r.reviewed_at ? formatDate(r.reviewed_at) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
