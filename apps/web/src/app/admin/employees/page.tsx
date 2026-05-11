"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { AxiosError } from "axios";
import { PASSWORD_REQUIREMENTS, validatePassword } from "@repo/shared";
import {
  deactivateEmployee,
  fetchDepartments,
  fetchEmployees,
  resetEmployeePassword,
  updateEmployee,
} from "@/lib/api/admin";
import { queryKeys } from "@/lib/query/keys";
import {
  Button,
  FieldError,
  Input,
  Label,
  Modal,
  Select,
  toast,
} from "@/components/ui";
import { EmployeeTable } from "@/components/admin/EmployeeTable";
import type { TeamMember } from "@/lib/api/types";

type RoleFilter = "" | "EMPLOYEE" | "MANAGER" | "HR_ADMIN";
type StatusFilter = "" | "active" | "inactive";

export default function AdminEmployeesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState<RoleFilter>("");
  const [status, setStatus] = useState<StatusFilter>("");
  const [page, setPage] = useState(1);
  const [deactivateTarget, setDeactivateTarget] =
    useState<TeamMember | null>(null);
  const [resetTarget, setResetTarget] = useState<TeamMember | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);

  const departmentsQuery = useQuery({
    queryKey: queryKeys.admin.departments,
    queryFn: fetchDepartments,
  });

  const queryParams = useMemo(
    () => ({
      page,
      limit: 25,
      ...(search ? { search } : {}),
      ...(department ? { department_id: department } : {}),
      ...(role ? { role } : {}),
      ...(status ? { is_active: status === "active" } : {}),
    }),
    [page, search, department, role, status],
  );

  const employeesQuery = useQuery({
    queryKey: queryKeys.admin.employees(queryParams),
    queryFn: () => fetchEmployees(queryParams),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => deactivateEmployee(id),
    onSuccess: () => {
      toast.success("Employee deactivated");
      setDeactivateTarget(null);
      qc.invalidateQueries({ queryKey: ["admin", "employees"] });
      qc.invalidateQueries({ queryKey: queryKeys.admin.companyStats });
    },
    onError: (err) => {
      const axiosErr = err as AxiosError<{ error?: string }>;
      toast.error(
        "Could not deactivate",
        axiosErr.response?.data?.error ?? "Please try again.",
      );
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: (id: string) => updateEmployee(id, { is_active: true }),
    onSuccess: () => {
      toast.success("Employee reactivated");
      qc.invalidateQueries({ queryKey: ["admin", "employees"] });
      qc.invalidateQueries({ queryKey: queryKeys.admin.companyStats });
    },
    onError: (err) => {
      const axiosErr = err as AxiosError<{ error?: string }>;
      toast.error(
        "Could not reactivate",
        axiosErr.response?.data?.error ?? "Please try again.",
      );
    },
  });

  const resetMutation = useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      resetEmployeePassword(id, newPassword),
    onSuccess: () => {
      toast.success("Password reset email sent");
      setResetTarget(null);
      setResetPassword("");
      setResetError(null);
    },
    onError: (err) => {
      const axiosErr = err as AxiosError<{ error?: string }>;
      toast.error(
        "Could not reset password",
        axiosErr.response?.data?.error ?? "Please try again.",
      );
    },
  });

  const onResetSubmit = () => {
    const err = validatePassword(resetPassword);
    if (err) {
      setResetError(err);
      return;
    }
    if (!resetTarget) return;
    setResetError(null);
    resetMutation.mutate({ id: resetTarget.id, newPassword: resetPassword });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Manage onboarding, role assignments, and access.
          </p>
        </div>
        <Link href="/admin/employees/new">
          <Button leftIcon={<Plus className="h-4 w-4" />}>Add employee</Button>
        </Link>
      </div>

      <div className="grid gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Name or email"
            leftSlot={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="department">Department</Label>
          <Select
            id="department"
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All departments</option>
            {departmentsQuery.data?.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="role">Role</Label>
          <Select
            id="role"
            value={role}
            onChange={(e) => {
              setRole(e.target.value as RoleFilter);
              setPage(1);
            }}
          >
            <option value="">All roles</option>
            <option value="EMPLOYEE">Employee</option>
            <option value="MANAGER">Manager</option>
            <option value="HR_ADMIN">HR Admin</option>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="status">Status</Label>
          <Select
            id="status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as StatusFilter);
              setPage(1);
            }}
          >
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>
        <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch("");
              setDepartment("");
              setRole("");
              setStatus("");
              setPage(1);
            }}
          >
            Reset filters
          </Button>
        </div>
      </div>

      <EmployeeTable
        rows={employeesQuery.data?.data}
        pagination={employeesQuery.data?.pagination}
        isLoading={employeesQuery.isLoading}
        onPageChange={setPage}
        onDeactivate={setDeactivateTarget}
        onReactivate={(emp) => reactivateMutation.mutate(emp.id)}
        onResetPassword={(e) => {
          setResetTarget(e);
          setResetPassword("");
          setResetError(null);
        }}
      />

      <Modal
        open={deactivateTarget !== null}
        onClose={() => setDeactivateTarget(null)}
        title="Deactivate employee"
        description={
          deactivateTarget
            ? `${deactivateTarget.first_name} ${deactivateTarget.last_name} will no longer be able to log in. You can re-enable them later from the employee detail page.`
            : undefined
        }
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeactivateTarget(null)}
              disabled={deactivateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deactivateMutation.isPending}
              onClick={() =>
                deactivateTarget &&
                deactivateMutation.mutate(deactivateTarget.id)
              }
            >
              Deactivate
            </Button>
          </div>
        }
      >
        <p className="text-sm text-foreground-muted">
          Their attendance and leave history are preserved.
        </p>
      </Modal>

      <Modal
        open={resetTarget !== null}
        onClose={() => {
          setResetTarget(null);
          setResetPassword("");
          setResetError(null);
        }}
        title="Reset password"
        description={
          resetTarget
            ? `Set a new password for ${resetTarget.first_name} ${resetTarget.last_name}. They will be emailed the new password.`
            : undefined
        }
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setResetTarget(null);
                setResetPassword("");
                setResetError(null);
              }}
              disabled={resetMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              loading={resetMutation.isPending}
              onClick={onResetSubmit}
            >
              Reset password
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reset-password">New password</Label>
          <Input
            id="reset-password"
            type="password"
            value={resetPassword}
            onChange={(e) => setResetPassword(e.target.value)}
            placeholder="New password"
            invalid={!!resetError}
            autoFocus
          />
          {resetError ? (
            <FieldError>{resetError}</FieldError>
          ) : (
            <span className="text-xs text-foreground-muted">
              {PASSWORD_REQUIREMENTS}
            </span>
          )}
        </div>
      </Modal>
    </div>
  );
}
