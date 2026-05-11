"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AxiosError } from "axios";
import {
  createLeaveType,
  deleteLeaveType,
  fetchLeaveTypes,
  updateLeaveType,
  type LeaveTypeBody,
} from "@/lib/api/admin";
import { queryKeys } from "@/lib/query/keys";
import {
  Badge,
  Button,
  CenteredSpinner,
  Checkbox,
  FieldError,
  IconButton,
  Input,
  Label,
  Modal,
  toast,
} from "@/components/ui";
import type { LeaveTypeFull } from "@/lib/api/types";

type EditState =
  | { mode: "create" }
  | { mode: "edit"; leaveType: LeaveTypeFull }
  | null;

export default function AdminLeaveTypesPage() {
  const qc = useQueryClient();
  const [edit, setEdit] = useState<EditState>(null);
  const [deleteTarget, setDeleteTarget] = useState<LeaveTypeFull | null>(null);

  const leaveTypesQuery = useQuery({
    queryKey: queryKeys.admin.leaveTypes,
    queryFn: fetchLeaveTypes,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: queryKeys.admin.leaveTypes });
    qc.invalidateQueries({ queryKey: queryKeys.leave.types });
  };

  const createMutation = useMutation({
    mutationFn: (body: LeaveTypeBody) => createLeaveType(body),
    onSuccess: () => {
      toast.success("Leave type created");
      setEdit(null);
      invalidate();
    },
    onError: handleErrorToast("Could not create"),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Partial<LeaveTypeBody>;
    }) => updateLeaveType(id, body),
    onSuccess: () => {
      toast.success("Leave type updated");
      setEdit(null);
      invalidate();
    },
    onError: handleErrorToast("Could not update"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLeaveType,
    onSuccess: () => {
      toast.success("Leave type deleted");
      setDeleteTarget(null);
      invalidate();
    },
    onError: handleErrorToast("Could not delete"),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leave types</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Configure annual allotment and paid status for each leave category.
          </p>
        </div>
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setEdit({ mode: "create" })}
        >
          Add leave type
        </Button>
      </div>

      {leaveTypesQuery.isLoading ? (
        <div className="rounded-lg border border-border bg-surface shadow-sm">
          <CenteredSpinner />
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-surface shadow-sm">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wider text-foreground-subtle">
                <th className="px-5 py-2.5 text-left font-medium">Name</th>
                <th className="px-5 py-2.5 text-left font-medium">Days/year</th>
                <th className="px-5 py-2.5 text-left font-medium">Paid</th>
                <th className="px-5 py-2.5 text-left font-medium">In use</th>
                <th className="px-5 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(leaveTypesQuery.data ?? []).length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-foreground-muted"
                  >
                    No leave types yet.
                  </td>
                </tr>
              ) : null}
              {(leaveTypesQuery.data ?? []).map((lt) => {
                const inUse = lt._count?.leave_requests ?? 0;
                return (
                  <tr
                    key={lt.id}
                    className="border-b border-border/60 last:border-0"
                  >
                    <td className="px-5 py-3 font-medium">{lt.name}</td>
                    <td className="px-5 py-3 tabular-nums text-foreground-muted">
                      {lt.days_per_year}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={lt.is_paid ? "success" : "neutral"}>
                        {lt.is_paid ? "Paid" : "Unpaid"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 tabular-nums text-foreground-muted">
                      {inUse}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <IconButton
                          aria-label="Edit"
                          onClick={() =>
                            setEdit({ mode: "edit", leaveType: lt })
                          }
                        >
                          <Pencil className="h-4 w-4" />
                        </IconButton>
                        <IconButton
                          aria-label="Delete"
                          title={
                            inUse > 0
                              ? `Cannot delete — ${inUse} request${inUse === 1 ? "" : "s"} exist`
                              : "Delete"
                          }
                          disabled={inUse > 0}
                          onClick={() => setDeleteTarget(lt)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <LeaveTypeFormModal
        state={edit}
        onClose={() => setEdit(null)}
        onSubmit={(body) => {
          if (edit?.mode === "edit") {
            updateMutation.mutate({ id: edit.leaveType.id, body });
          } else {
            createMutation.mutate(body);
          }
        }}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete leave type"
        description={
          deleteTarget
            ? `Delete "${deleteTarget.name}"? This cannot be undone.`
            : undefined
        }
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleteMutation.isPending}
              onClick={() =>
                deleteTarget && deleteMutation.mutate(deleteTarget.id)
              }
            >
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-sm text-foreground-muted">
          Deletion is blocked when there are existing leave requests of this
          type.
        </p>
      </Modal>
    </div>
  );
}

function LeaveTypeFormModal({
  state,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  state: EditState;
  onClose: () => void;
  onSubmit: (body: LeaveTypeBody) => void;
  isSubmitting?: boolean;
}) {
  const open = state !== null;
  const initial: LeaveTypeBody =
    state?.mode === "edit"
      ? {
          name: state.leaveType.name,
          days_per_year: state.leaveType.days_per_year,
          is_paid: state.leaveType.is_paid,
        }
      : { name: "", days_per_year: 0, is_paid: true };

  const [name, setName] = useState(initial.name);
  const [days, setDays] = useState(String(initial.days_per_year));
  const [isPaid, setIsPaid] = useState(initial.is_paid);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  useEffect(() => {
    if (!open) return;
    setName(initial.name);
    setDays(String(initial.days_per_year));
    setIsPaid(initial.is_paid);
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, state]);

  const submit = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Name is required";
    const d = Number(days);
    if (!Number.isFinite(d) || d < 0 || d > 365) {
      next.days = "Must be 0–365";
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onSubmit({
      name: name.trim(),
      days_per_year: d,
      is_paid: isPaid,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={state?.mode === "edit" ? "Edit leave type" : "Add leave type"}
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={submit} loading={isSubmitting}>
            {state?.mode === "edit" ? "Save" : "Create"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lt-name">Name</Label>
          <Input
            id="lt-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            invalid={!!errors.name}
            placeholder="e.g. Annual leave"
            autoFocus
          />
          {errors.name ? <FieldError>{errors.name}</FieldError> : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lt-days">Days per year</Label>
          <Input
            id="lt-days"
            type="number"
            min={0}
            max={365}
            value={days}
            onChange={(e) => setDays(e.target.value)}
            invalid={!!errors.days}
          />
          {errors.days ? <FieldError>{errors.days}</FieldError> : null}
        </div>
        <Checkbox
          id="lt-paid"
          label="Paid leave"
          checked={isPaid}
          onChange={(e) => setIsPaid(e.target.checked)}
        />
      </div>
    </Modal>
  );
}

function handleErrorToast(title: string) {
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
