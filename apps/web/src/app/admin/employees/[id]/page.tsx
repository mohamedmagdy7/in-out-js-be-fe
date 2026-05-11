"use client";

import { useMemo, useState } from "react";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PASSWORD_REQUIREMENTS, validatePassword } from "@repo/shared";
import {
  fetchDepartments,
  fetchEmployee,
  fetchEmployees,
  fetchShifts,
  resetEmployeePassword,
  updateEmployee,
  type UpdateEmployeeBody,
} from "@/lib/api/admin";
import { fetchCompanyAttendance } from "@/lib/api/admin";
import { queryKeys } from "@/lib/query/keys";
import {
  Button,
  CenteredSpinner,
  FieldError,
  Input,
  Label,
  toast,
} from "@/components/ui";
import {
  EmployeeForm,
  type EditFormValues,
} from "@/components/admin/EmployeeForm";
import { AttendanceTable } from "@/components/employee/AttendanceTable";
import type { TeamMember } from "@/lib/api/types";
import { cn } from "@/lib/cn";

type Tab = "profile" | "attendance" | "leave" | "password";

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "profile", label: "Profile" },
  { key: "attendance", label: "Attendance" },
  { key: "leave", label: "Leave" },
  { key: "password", label: "Reset password" },
];

export default function EmployeeDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("profile");

  const employeeQuery = useQuery({
    queryKey: queryKeys.admin.employee(id),
    queryFn: () => fetchEmployee(id),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/admin/employees"
          className="inline-flex items-center gap-1 text-foreground-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Employees
        </Link>
      </div>

      {employeeQuery.isLoading ? (
        <div className="rounded-lg border border-border bg-surface shadow-sm">
          <CenteredSpinner />
        </div>
      ) : !employeeQuery.data ? (
        <div className="rounded-lg border border-dashed border-border bg-surface px-6 py-12 text-center text-sm text-foreground-muted">
          Employee not found.
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-base font-semibold text-primary-soft-foreground">
              {`${employeeQuery.data.first_name[0] ?? ""}${employeeQuery.data.last_name[0] ?? ""}`.toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {employeeQuery.data.first_name} {employeeQuery.data.last_name}
              </h1>
              <p className="text-sm text-foreground-muted">
                {employeeQuery.data.email}
                {employeeQuery.data.department
                  ? ` · ${employeeQuery.data.department.name}`
                  : ""}
              </p>
            </div>
          </div>

          <div className="inline-flex w-fit overflow-x-auto rounded-md border border-border bg-surface p-0.5">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={cn(
                  "h-8 whitespace-nowrap rounded px-3 text-xs font-medium transition-colors",
                  tab === key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground-muted hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "profile" ? (
            <ProfileTab
              id={id}
              employee={employeeQuery.data}
              onSaved={() => {
                qc.invalidateQueries({ queryKey: queryKeys.admin.employee(id) });
                qc.invalidateQueries({ queryKey: ["admin", "employees"] });
              }}
            />
          ) : null}
          {tab === "attendance" ? <AttendanceTab id={id} /> : null}
          {tab === "leave" ? <LeaveTab name={`${employeeQuery.data.first_name} ${employeeQuery.data.last_name}`} /> : null}
          {tab === "password" ? <PasswordTab id={id} /> : null}
        </>
      )}
    </div>
  );
}

function ProfileTab({
  id,
  employee,
  onSaved,
}: {
  id: string;
  employee: TeamMember;
  onSaved: () => void;
}) {
  const departmentsQuery = useQuery({
    queryKey: queryKeys.admin.departments,
    queryFn: fetchDepartments,
  });
  const shiftsQuery = useQuery({
    queryKey: queryKeys.admin.shifts,
    queryFn: fetchShifts,
  });
  const managersQuery = useQuery({
    queryKey: queryKeys.admin.employees({ role: "MANAGER", limit: 100 }),
    queryFn: () => fetchEmployees({ role: "MANAGER", limit: 100 }),
  });

  const mutation = useMutation({
    mutationFn: (body: UpdateEmployeeBody) => updateEmployee(id, body),
    onSuccess: () => {
      toast.success("Employee updated");
      onSaved();
    },
    onError: (err) => {
      const axiosErr = err as AxiosError<{ error?: string }>;
      toast.error(
        "Could not save",
        axiosErr.response?.data?.error ?? "Please try again.",
      );
    },
  });

  const onSubmit = (values: EditFormValues) => {
    mutation.mutate({
      first_name: values.first_name.trim(),
      last_name: values.last_name.trim(),
      phone: values.phone ? values.phone.trim() : null,
      department_id: values.department_id ? values.department_id : null,
      shift_id: values.shift_id ? values.shift_id : null,
      manager_id: values.manager_id ? values.manager_id : null,
    });
  };

  return (
    <EmployeeForm
      mode="edit"
      employee={employee}
      departments={departmentsQuery.data ?? []}
      shifts={shiftsQuery.data ?? []}
      managers={managersQuery.data?.data ?? []}
      onSubmit={onSubmit}
      isSubmitting={mutation.isPending}
    />
  );
}

function AttendanceTab({ id }: { id: string }) {
  const today = new Date();
  const [from, setFrom] = useState(() =>
    format(startOfMonth(today), "yyyy-MM-dd"),
  );
  const [to, setTo] = useState(() => format(endOfMonth(today), "yyyy-MM-dd"));
  const [page, setPage] = useState(1);

  const params = useMemo(
    () => ({ employee_id: id, from, to, page, limit: 30 }),
    [id, from, to, page],
  );

  const query = useQuery({
    queryKey: queryKeys.admin.attendance(params),
    queryFn: () => fetchCompanyAttendance(params),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="from">From</Label>
          <Input
            id="from"
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="to">To</Label>
          <Input
            id="to"
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <AttendanceTable
        logs={query.data?.data}
        pagination={query.data?.pagination}
        isLoading={query.isLoading}
        onPageChange={setPage}
      />
    </div>
  );
}

function LeaveTab({ name }: { name: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-surface px-6 py-10 text-center text-sm text-foreground-muted">
      Leave history for {name} is visible from the Leave page filtered by this
      employee.
    </div>
  );
}

function PasswordTab({ id }: { id: string }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (newPassword: string) => resetEmployeePassword(id, newPassword),
    onSuccess: () => {
      toast.success("Password reset and emailed");
      setPassword("");
    },
    onError: (err) => {
      const axiosErr = err as AxiosError<{ error?: string }>;
      toast.error(
        "Could not reset password",
        axiosErr.response?.data?.error ?? "Please try again.",
      );
    },
  });

  const submit = () => {
    const err = validatePassword(password);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    mutation.mutate(password);
  };

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5 shadow-sm">
      <div>
        <h3 className="text-sm font-semibold">Reset password</h3>
        <p className="text-xs text-foreground-muted">
          Set a new password manually. The employee will receive an email with
          the new credentials.
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new-password">New password</Label>
        <Input
          id="new-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password"
          invalid={!!error}
        />
        {error ? (
          <FieldError>{error}</FieldError>
        ) : (
          <span className="text-xs text-foreground-muted">
            {PASSWORD_REQUIREMENTS}
          </span>
        )}
      </div>
      <div className="flex justify-end">
        <Button onClick={submit} loading={mutation.isPending}>
          Reset password
        </Button>
      </div>
    </div>
  );
}
