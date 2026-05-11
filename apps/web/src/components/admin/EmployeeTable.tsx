"use client";

import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  KeyRound,
  Pencil,
  UserCheck,
  UserX,
} from "lucide-react";
import type { Pagination, TeamMember } from "@/lib/api/types";
import { Badge, Button, CenteredSpinner, IconButton } from "@/components/ui";

type Props = {
  rows: TeamMember[] | undefined;
  pagination: (Pagination & { total_pages?: number }) | undefined;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onDeactivate: (employee: TeamMember) => void;
  onReactivate: (employee: TeamMember) => void;
  onResetPassword: (employee: TeamMember) => void;
};

const ROLE_LABEL: Record<string, string> = {
  EMPLOYEE: "Employee",
  MANAGER: "Manager",
  HR_ADMIN: "HR Admin",
};

export function EmployeeTable({
  rows,
  pagination,
  isLoading,
  onPageChange,
  onDeactivate,
  onReactivate,
  onResetPassword,
}: Props) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-surface shadow-sm">
        <CenteredSpinner />
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface px-6 py-12 text-center text-sm text-foreground-muted">
        No employees match the current filters.
      </div>
    );
  }

  const totalPages = pagination
    ? Math.max(1, pagination.total_pages ?? Math.ceil(pagination.total / pagination.limit))
    : 1;
  const page = pagination?.page ?? 1;

  return (
    <div className="rounded-lg border border-border bg-surface shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider text-foreground-subtle">
              <th className="px-5 py-2.5 text-left font-medium">Employee</th>
              <th className="px-5 py-2.5 text-left font-medium">Email</th>
              <th className="px-5 py-2.5 text-left font-medium">Department</th>
              <th className="px-5 py-2.5 text-left font-medium">Shift</th>
              <th className="px-5 py-2.5 text-left font-medium">Role</th>
              <th className="px-5 py-2.5 text-left font-medium">Status</th>
              <th className="px-5 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((emp) => {
              const initials =
                `${emp.first_name[0] ?? ""}${emp.last_name[0] ?? ""}`.toUpperCase();
              return (
                <tr
                  key={emp.id}
                  className="border-b border-border/60 last:border-0"
                >
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/employees/${emp.id}`}
                      className="flex items-center gap-3 hover:text-primary"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary-soft-foreground">
                        {initials || "?"}
                      </div>
                      <span className="font-medium">
                        {emp.first_name} {emp.last_name}
                      </span>
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-foreground-muted">
                    {emp.email}
                  </td>
                  <td className="px-5 py-3 text-foreground-muted">
                    {emp.department?.name ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-foreground-muted">
                    {emp.shift?.name ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-foreground-muted">
                    {ROLE_LABEL[emp.role] ?? emp.role}
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={emp.is_active ? "success" : "neutral"}>
                      {emp.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/employees/${emp.id}`}
                        title="Edit"
                        className="inline-flex"
                      >
                        <IconButton aria-label="Edit">
                          <Pencil className="h-4 w-4" />
                        </IconButton>
                      </Link>
                      <IconButton
                        aria-label="Reset password"
                        title="Reset password"
                        onClick={() => onResetPassword(emp)}
                      >
                        <KeyRound className="h-4 w-4" />
                      </IconButton>
                      {emp.is_active ? (
                        <IconButton
                          aria-label="Deactivate"
                          title="Deactivate"
                          onClick={() => onDeactivate(emp)}
                        >
                          <UserX className="h-4 w-4" />
                        </IconButton>
                      ) : (
                        <IconButton
                          aria-label="Reactivate"
                          title="Reactivate"
                          onClick={() => onReactivate(emp)}
                        >
                          <UserCheck className="h-4 w-4 text-success" />
                        </IconButton>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-border px-5 py-3 text-xs text-foreground-muted">
        <span>
          Page {page} of {totalPages}
          {pagination ? ` · ${pagination.total} total` : ""}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            leftIcon={<ChevronLeft className="h-4 w-4" />}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            rightIcon={<ChevronRight className="h-4 w-4" />}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
