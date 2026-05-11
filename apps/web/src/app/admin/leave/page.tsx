"use client";

import { useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { format, startOfMonth } from "date-fns";
import {
  approveLeaveRequest,
  rejectLeaveRequest,
} from "@/lib/api/manager";
import {
  cancelLeaveRequest,
  fetchAllLeaveRequests,
  fetchEmployees,
} from "@/lib/api/admin";
import { queryKeys } from "@/lib/query/keys";
import {
  Button,
  CenteredSpinner,
  Input,
  Label,
  LeaveBadge,
  Modal,
  Select,
  toast,
} from "@/components/ui";
import { LeaveRequestCard } from "@/components/manager/LeaveRequestCard";
import { RejectModal } from "@/components/manager/RejectModal";
import type { LeaveRequestForReviewer } from "@/lib/api/types";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";

type Tab = "PENDING" | "ALL";

export default function AdminLeavePage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("PENDING");
  const [employeeId, setEmployeeId] = useState("");
  const [from, setFrom] = useState(() =>
    format(startOfMonth(new Date()), "yyyy-MM-dd"),
  );
  const [to, setTo] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "" | "PENDING" | "APPROVED" | "REJECTED"
  >("");

  const [rejectTarget, setRejectTarget] =
    useState<LeaveRequestForReviewer | null>(null);
  const [cancelTarget, setCancelTarget] =
    useState<LeaveRequestForReviewer | null>(null);

  const employeesQuery = useQuery({
    queryKey: queryKeys.admin.employees({ limit: 200 }),
    queryFn: () => fetchEmployees({ limit: 200 }),
  });

  const params = useMemo(() => {
    if (tab === "PENDING") {
      return { status: "PENDING" as const, limit: 50 };
    }
    return {
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(employeeId ? { employee_id: employeeId } : {}),
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
      limit: 50,
    };
  }, [tab, statusFilter, employeeId, from, to]);

  const requestsQuery = useQuery({
    queryKey: queryKeys.admin.leaveRequests({ tab, ...params }),
    queryFn: () => fetchAllLeaveRequests(params),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveLeaveRequest(id),
    onSuccess: () => {
      toast.success("Request approved");
      qc.invalidateQueries({ queryKey: ["admin", "leave"] });
      qc.invalidateQueries({ queryKey: queryKeys.admin.summary });
    },
    onError: errorToast("Could not approve"),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rejectLeaveRequest(id, reason),
    onSuccess: () => {
      toast.success("Request rejected");
      setRejectTarget(null);
      qc.invalidateQueries({ queryKey: ["admin", "leave"] });
      qc.invalidateQueries({ queryKey: queryKeys.admin.summary });
    },
    onError: errorToast("Could not reject"),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelLeaveRequest(id),
    onSuccess: () => {
      toast.success("Request cancelled");
      setCancelTarget(null);
      qc.invalidateQueries({ queryKey: ["admin", "leave"] });
      qc.invalidateQueries({ queryKey: queryKeys.admin.summary });
    },
    onError: errorToast("Could not cancel"),
  });

  const data = requestsQuery.data?.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Leave requests
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Review pending requests and audit decisions across the company.
        </p>
      </div>

      <div className="inline-flex w-fit rounded-md border border-border bg-surface p-0.5">
        {(["PENDING", "ALL"] as Tab[]).map((key) => (
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
            {key === "PENDING" ? "Pending" : "All"}
          </button>
        ))}
      </div>

      {tab === "ALL" ? (
        <div className="grid gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lv-employee">Employee</Label>
            <Select
              id="lv-employee"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
            >
              <option value="">All employees</option>
              {employeesQuery.data?.data.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.first_name} {e.last_name}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lv-status">Status</Label>
            <Select
              id="lv-status"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as "" | "PENDING" | "APPROVED" | "REJECTED",
                )
              }
            >
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lv-from">From</Label>
            <Input
              id="lv-from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lv-to">To</Label>
            <Input
              id="lv-to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>
      ) : null}

      {requestsQuery.isLoading ? (
        <div className="rounded-lg border border-border bg-surface shadow-sm">
          <CenteredSpinner />
        </div>
      ) : data.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface px-6 py-10 text-center text-sm text-foreground-muted">
          {tab === "PENDING"
            ? "All caught up — no pending requests."
            : "No matching requests."}
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
                (approveMutation.isPending &&
                  approveMutation.variables === r.id) ||
                (rejectMutation.isPending &&
                  rejectMutation.variables?.id === r.id)
              }
            />
          ))}
        </div>
      ) : (
        <AllTable
          rows={data}
          onCancel={(r) => setCancelTarget(r)}
          isCancelling={cancelMutation.isPending}
        />
      )}

      <RejectModal
        open={rejectTarget !== null}
        onClose={() => setRejectTarget(null)}
        onConfirm={(reason) => {
          if (rejectTarget) {
            rejectMutation.mutate({ id: rejectTarget.id, reason });
          }
        }}
        isSubmitting={rejectMutation.isPending}
        employeeName={
          rejectTarget
            ? `${rejectTarget.user.first_name} ${rejectTarget.user.last_name}`
            : undefined
        }
      />

      <Modal
        open={cancelTarget !== null}
        onClose={() => setCancelTarget(null)}
        title="Cancel leave request"
        description={
          cancelTarget
            ? `This will reverse the leave for ${cancelTarget.user.first_name} ${cancelTarget.user.last_name} and restore those days to their balance.`
            : undefined
        }
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setCancelTarget(null)}
              disabled={cancelMutation.isPending}
            >
              Keep request
            </Button>
            <Button
              variant="danger"
              loading={cancelMutation.isPending}
              onClick={() =>
                cancelTarget && cancelMutation.mutate(cancelTarget.id)
              }
            >
              Cancel request
            </Button>
          </div>
        }
      >
        <p className="text-sm text-foreground-muted">
          This action cannot be undone. Approved attendance days marked as
          “on leave” will be reverted to absent.
        </p>
      </Modal>
    </div>
  );
}

function AllTable({
  rows,
  onCancel,
  isCancelling,
}: {
  rows: LeaveRequestForReviewer[];
  onCancel: (r: LeaveRequestForReviewer) => void;
  isCancelling?: boolean;
}) {
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
              <th className="px-5 py-2.5 text-left font-medium">Status</th>
              <th className="px-5 py-2.5 text-left font-medium">Decided on</th>
              <th className="px-5 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border/60 last:border-0">
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
                  <LeaveBadge status={r.status} />
                </td>
                <td className="px-5 py-3 text-foreground-muted">
                  {r.reviewed_at ? formatDate(r.reviewed_at) : "—"}
                </td>
                <td className="px-5 py-3 text-right">
                  {r.status !== "REJECTED" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onCancel(r)}
                      disabled={isCancelling}
                    >
                      Cancel
                    </Button>
                  ) : (
                    <span className="text-xs text-foreground-subtle">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function errorToast(title: string) {
  return (err: unknown) => {
    const axiosErr = err as AxiosError<{ message?: string; error?: string }>;
    toast.error(
      title,
      axiosErr.response?.data?.message ??
        axiosErr.response?.data?.error ??
        "Please try again.",
    );
  };
}
