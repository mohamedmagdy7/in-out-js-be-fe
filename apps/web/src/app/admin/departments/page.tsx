"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { AxiosError } from "axios";
import {
  createDepartment,
  deleteDepartment,
  fetchDepartments,
  updateDepartment,
} from "@/lib/api/admin";
import { queryKeys } from "@/lib/query/keys";
import {
  Button,
  CenteredSpinner,
  FieldError,
  IconButton,
  Input,
  Label,
  Modal,
  toast,
} from "@/components/ui";
import type { Department } from "@/lib/api/types";

export default function AdminDepartmentsPage() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newError, setNewError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);

  const departmentsQuery = useQuery({
    queryKey: queryKeys.admin.departments,
    queryFn: fetchDepartments,
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: queryKeys.admin.departments });

  const createMutation = useMutation({
    mutationFn: createDepartment,
    onSuccess: () => {
      toast.success("Department created");
      setCreating(false);
      setNewName("");
      setNewError(null);
      invalidate();
    },
    onError: (err) => {
      const axiosErr = err as AxiosError<{ error?: string }>;
      setNewError(axiosErr.response?.data?.error ?? "Could not create");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      updateDepartment(id, name),
    onSuccess: () => {
      toast.success("Department renamed");
      setEditingId(null);
      setEditName("");
      invalidate();
    },
    onError: (err) => {
      const axiosErr = err as AxiosError<{ error?: string }>;
      toast.error(
        "Could not rename",
        axiosErr.response?.data?.error ?? "Please try again.",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDepartment,
    onSuccess: () => {
      toast.success("Department deleted");
      setDeleteTarget(null);
      invalidate();
    },
    onError: (err) => {
      const axiosErr = err as AxiosError<{ error?: string }>;
      toast.error(
        "Could not delete",
        axiosErr.response?.data?.error ?? "Please try again.",
      );
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Departments</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Org units used for grouping employees and reports.
          </p>
        </div>
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => {
            setCreating(true);
            setNewName("");
            setNewError(null);
          }}
        >
          Add department
        </Button>
      </div>

      {departmentsQuery.isLoading ? (
        <div className="rounded-lg border border-border bg-surface shadow-sm">
          <CenteredSpinner />
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-surface shadow-sm">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wider text-foreground-subtle">
                <th className="px-5 py-2.5 text-left font-medium">Name</th>
                <th className="px-5 py-2.5 text-left font-medium">
                  Employees
                </th>
                <th className="px-5 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(departmentsQuery.data ?? []).length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-5 py-10 text-center text-foreground-muted"
                  >
                    No departments yet.
                  </td>
                </tr>
              ) : null}
              {(departmentsQuery.data ?? []).map((d) => {
                const count = d._count?.users ?? 0;
                const isEditing = editingId === d.id;
                return (
                  <tr
                    key={d.id}
                    className="border-b border-border/60 last:border-0"
                  >
                    <td className="px-5 py-3 font-medium">
                      {isEditing ? (
                        <div className="flex max-w-sm items-center gap-2">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                updateMutation.mutate({
                                  id: d.id,
                                  name: editName.trim(),
                                });
                              } else if (e.key === "Escape") {
                                setEditingId(null);
                              }
                            }}
                          />
                          <IconButton
                            aria-label="Save"
                            onClick={() =>
                              updateMutation.mutate({
                                id: d.id,
                                name: editName.trim(),
                              })
                            }
                          >
                            <Check className="h-4 w-4" />
                          </IconButton>
                          <IconButton
                            aria-label="Cancel"
                            onClick={() => setEditingId(null)}
                          >
                            <X className="h-4 w-4" />
                          </IconButton>
                        </div>
                      ) : (
                        d.name
                      )}
                    </td>
                    <td className="px-5 py-3 tabular-nums text-foreground-muted">
                      {count}
                    </td>
                    <td className="px-5 py-3">
                      {!isEditing ? (
                        <div className="flex items-center justify-end gap-1">
                          <IconButton
                            aria-label="Rename"
                            title="Rename"
                            onClick={() => {
                              setEditingId(d.id);
                              setEditName(d.name);
                            }}
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
                            onClick={() => setDeleteTarget(d)}
                            disabled={count > 0}
                          >
                            <Trash2 className="h-4 w-4" />
                          </IconButton>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Add department"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setCreating(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              loading={createMutation.isPending}
              onClick={() => {
                const trimmed = newName.trim();
                if (!trimmed) {
                  setNewError("Name is required");
                  return;
                }
                setNewError(null);
                createMutation.mutate(trimmed);
              }}
            >
              Create
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dept-name">Name</Label>
          <Input
            id="dept-name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            invalid={!!newError}
            autoFocus
            placeholder="e.g. Engineering"
          />
          {newError ? <FieldError>{newError}</FieldError> : null}
        </div>
      </Modal>

      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete department"
        description={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}"? This cannot be undone.`
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
          Deletion is blocked if any employees are assigned to this department.
        </p>
      </Modal>
    </div>
  );
}
