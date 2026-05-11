"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AxiosError } from "axios";
import {
  createShift,
  deleteShift,
  fetchShifts,
  updateShift,
  type ShiftBody,
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
import type { Shift } from "@/lib/api/types";

type EditState =
  | { mode: "create" }
  | { mode: "edit"; shift: Shift }
  | null;

export default function AdminShiftsPage() {
  const qc = useQueryClient();
  const [edit, setEdit] = useState<EditState>(null);
  const [deleteTarget, setDeleteTarget] = useState<Shift | null>(null);

  const shiftsQuery = useQuery({
    queryKey: queryKeys.admin.shifts,
    queryFn: fetchShifts,
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: queryKeys.admin.shifts });

  const createMutation = useMutation({
    mutationFn: (body: ShiftBody) => createShift(body),
    onSuccess: () => {
      toast.success("Shift created");
      setEdit(null);
      invalidate();
    },
    onError: handleErrorToast("Could not create shift"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<ShiftBody> }) =>
      updateShift(id, body),
    onSuccess: () => {
      toast.success("Shift updated");
      setEdit(null);
      invalidate();
    },
    onError: handleErrorToast("Could not update shift"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteShift,
    onSuccess: () => {
      toast.success("Shift deleted");
      setDeleteTarget(null);
      invalidate();
    },
    onError: handleErrorToast("Could not delete shift"),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Shifts</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Define work hours and the default shift used for new employees.
          </p>
        </div>
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setEdit({ mode: "create" })}
        >
          Add shift
        </Button>
      </div>

      {shiftsQuery.isLoading ? (
        <div className="rounded-lg border border-border bg-surface shadow-sm">
          <CenteredSpinner />
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-surface shadow-sm">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wider text-foreground-subtle">
                <th className="px-5 py-2.5 text-left font-medium">Name</th>
                <th className="px-5 py-2.5 text-left font-medium">Start</th>
                <th className="px-5 py-2.5 text-left font-medium">End</th>
                <th className="px-5 py-2.5 text-left font-medium">Assigned</th>
                <th className="px-5 py-2.5 text-left font-medium">Default</th>
                <th className="px-5 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(shiftsQuery.data ?? []).length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-foreground-muted"
                  >
                    No shifts yet.
                  </td>
                </tr>
              ) : null}
              {(shiftsQuery.data ?? []).map((s) => {
                const count = s._count?.users ?? 0;
                return (
                  <tr
                    key={s.id}
                    className="border-b border-border/60 last:border-0"
                  >
                    <td className="px-5 py-3 font-medium">{s.name}</td>
                    <td className="px-5 py-3 tabular-nums text-foreground-muted">
                      {s.start_time}
                    </td>
                    <td className="px-5 py-3 tabular-nums text-foreground-muted">
                      {s.end_time}
                    </td>
                    <td className="px-5 py-3 tabular-nums text-foreground-muted">
                      {count}
                    </td>
                    <td className="px-5 py-3">
                      {s.is_default ? (
                        <Badge tone="primary">Default</Badge>
                      ) : (
                        <span className="text-foreground-subtle">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <IconButton
                          aria-label="Edit"
                          onClick={() => setEdit({ mode: "edit", shift: s })}
                        >
                          <Pencil className="h-4 w-4" />
                        </IconButton>
                        <IconButton
                          aria-label="Delete"
                          title={
                            count > 0
                              ? `Cannot delete — ${count} employee${count === 1 ? "" : "s"} assigned`
                              : "Delete"
                          }
                          onClick={() => setDeleteTarget(s)}
                          disabled={count > 0}
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

      <ShiftFormModal
        state={edit}
        onClose={() => setEdit(null)}
        onSubmit={(body) => {
          if (edit?.mode === "edit") {
            updateMutation.mutate({ id: edit.shift.id, body });
          } else {
            createMutation.mutate(body);
          }
        }}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete shift"
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
          Deletion is blocked if any employees are assigned to this shift.
        </p>
      </Modal>
    </div>
  );
}

function ShiftFormModal({
  state,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  state: EditState;
  onClose: () => void;
  onSubmit: (body: ShiftBody) => void;
  isSubmitting?: boolean;
}) {
  const open = state !== null;
  const initial: ShiftBody =
    state?.mode === "edit"
      ? {
          name: state.shift.name,
          start_time: state.shift.start_time,
          end_time: state.shift.end_time,
          is_default: state.shift.is_default,
        }
      : { name: "", start_time: "09:00", end_time: "17:00", is_default: false };

  const [name, setName] = useState(initial.name);
  const [start, setStart] = useState(initial.start_time);
  const [end, setEnd] = useState(initial.end_time);
  const [isDefault, setIsDefault] = useState(!!initial.is_default);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  // Reset whenever the modal opens
  useEffectOnOpen(open, state, () => {
    setName(initial.name);
    setStart(initial.start_time);
    setEnd(initial.end_time);
    setIsDefault(!!initial.is_default);
    setErrors({});
  });

  const submit = () => {
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = "Name is required";
    if (!/^\d{2}:\d{2}$/.test(start))
      nextErrors.start_time = "Use HH:MM (24h)";
    if (!/^\d{2}:\d{2}$/.test(end)) nextErrors.end_time = "Use HH:MM (24h)";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit({
      name: name.trim(),
      start_time: start,
      end_time: end,
      is_default: isDefault,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={state?.mode === "edit" ? "Edit shift" : "Add shift"}
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
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
          <Label htmlFor="shift-name">Name</Label>
          <Input
            id="shift-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            invalid={!!errors.name}
            placeholder="e.g. Day shift"
            autoFocus
          />
          {errors.name ? <FieldError>{errors.name}</FieldError> : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="shift-start">Start time</Label>
            <Input
              id="shift-start"
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              invalid={!!errors.start_time}
            />
            {errors.start_time ? (
              <FieldError>{errors.start_time}</FieldError>
            ) : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="shift-end">End time</Label>
            <Input
              id="shift-end"
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              invalid={!!errors.end_time}
            />
            {errors.end_time ? (
              <FieldError>{errors.end_time}</FieldError>
            ) : null}
          </div>
        </div>
        <Checkbox
          id="shift-default"
          label="Use as the default shift for new employees"
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
        />
      </div>
    </Modal>
  );
}

function handleErrorToast(title: string) {
  return (err: unknown) => {
    const axiosErr = err as AxiosError<{ error?: string }>;
    toast.error(title, axiosErr.response?.data?.error ?? "Please try again.");
  };
}

function useEffectOnOpen<T>(open: boolean, deps: T, fn: () => void) {
  useEffect(() => {
    if (open) fn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, deps]);
}
