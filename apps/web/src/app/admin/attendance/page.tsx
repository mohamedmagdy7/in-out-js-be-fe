"use client";

import { Fragment, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { endOfMonth, format, startOfMonth } from "date-fns";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Pencil,
  Plus,
} from "lucide-react";
import {
  fetchCompanyAttendance,
  fetchDepartments,
  fetchEmployees,
} from "@/lib/api/admin";
import { queryKeys } from "@/lib/query/keys";
import {
  AttendanceBadge,
  Button,
  CenteredSpinner,
  IconButton,
  Input,
  Label,
  Select,
} from "@/components/ui";
import { AttendanceOverrideModal } from "@/components/admin/AttendanceOverrideModal";
import { ManualMarkModal } from "@/components/admin/ManualMarkModal";
import type {
  AttendanceStatus,
  TeamAttendanceLog,
} from "@/lib/api/types";
import { formatDate, formatMinutes, formatTime } from "@/lib/format";

type StatusFilter = AttendanceStatus | "";

export default function AdminAttendancePage() {
  const today = new Date();
  const [from, setFrom] = useState(() =>
    format(startOfMonth(today), "yyyy-MM-dd"),
  );
  const [to, setTo] = useState(() => format(endOfMonth(today), "yyyy-MM-dd"));
  const [employeeId, setEmployeeId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [status, setStatus] = useState<StatusFilter>("");
  const [page, setPage] = useState(1);

  const [overrideTarget, setOverrideTarget] =
    useState<TeamAttendanceLog | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const employeesQuery = useQuery({
    queryKey: queryKeys.admin.employees({ is_active: true, limit: 200 }),
    queryFn: () => fetchEmployees({ is_active: true, limit: 200 }),
  });

  const departmentsQuery = useQuery({
    queryKey: queryKeys.admin.departments,
    queryFn: fetchDepartments,
  });

  const params = useMemo(
    () => ({
      from,
      to,
      page,
      limit: 30,
      ...(employeeId ? { employee_id: employeeId } : {}),
      ...(departmentId ? { department_id: departmentId } : {}),
      ...(status ? { status } : {}),
    }),
    [from, to, employeeId, departmentId, status, page],
  );

  const attendanceQuery = useQuery({
    queryKey: queryKeys.admin.attendance(params),
    queryFn: () => fetchCompanyAttendance(params),
  });

  const rows = attendanceQuery.data?.data ?? [];
  const pagination = attendanceQuery.data?.pagination;
  const totalPages = pagination
    ? Math.max(1, Math.ceil(pagination.total / pagination.limit))
    : 1;

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Company attendance
          </h1>
          <p className="mt-1 text-sm text-foreground-muted">
            All employees across all departments. Click a row to view sessions
            or edit the record.
          </p>
        </div>
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setManualOpen(true)}
        >
          Manual record
        </Button>
      </div>

      <div className="grid gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
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
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="employee">Employee</Label>
          <Select
            id="employee"
            value={employeeId}
            onChange={(e) => {
              setEmployeeId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All employees</option>
            {employeesQuery.data?.data.map((m) => (
              <option key={m.id} value={m.id}>
                {m.first_name} {m.last_name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="department">Department</Label>
          <Select
            id="department"
            value={departmentId}
            onChange={(e) => {
              setDepartmentId(e.target.value);
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
            <option value="PRESENT">Present</option>
            <option value="ABSENT">Absent</option>
            <option value="LATE">Late</option>
            <option value="HALF_DAY">Half day</option>
            <option value="ON_LEAVE">On leave</option>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface shadow-sm">
        {attendanceQuery.isLoading ? (
          <CenteredSpinner />
        ) : rows.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-foreground-muted">
            No attendance records for the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-foreground-subtle">
                  <th className="w-8 px-3 py-2.5"></th>
                  <th className="px-5 py-2.5 text-left font-medium">Employee</th>
                  <th className="px-5 py-2.5 text-left font-medium">Department</th>
                  <th className="px-5 py-2.5 text-left font-medium">Date</th>
                  <th className="px-5 py-2.5 text-left font-medium">Sessions</th>
                  <th className="px-5 py-2.5 text-left font-medium">Work</th>
                  <th className="px-5 py-2.5 text-left font-medium">Overtime</th>
                  <th className="px-5 py-2.5 text-left font-medium">Status</th>
                  <th className="px-5 py-2.5 text-right font-medium">Edit</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((log) => {
                  const isOpen = expanded.has(log.id);
                  return (
                    <Fragment key={log.id}>
                      <tr className="border-b border-border/60">
                        <td
                          className="cursor-pointer px-3 py-3 text-foreground-subtle"
                          onClick={() => toggle(log.id)}
                        >
                          {isOpen ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </td>
                        <td className="px-5 py-3 font-medium">
                          {log.user.full_name}
                        </td>
                        <td className="px-5 py-3 text-foreground-muted">
                          {log.user.department ?? "—"}
                        </td>
                        <td className="px-5 py-3 tabular-nums text-foreground-muted">
                          {formatDate(log.date)}
                        </td>
                        <td className="px-5 py-3 tabular-nums">
                          {log.sessions.length === 0
                            ? "—"
                            : `${log.sessions.length} session${log.sessions.length === 1 ? "" : "s"}`}
                        </td>
                        <td className="px-5 py-3 tabular-nums">
                          {formatMinutes(log.total_work_minutes)}
                        </td>
                        <td className="px-5 py-3 tabular-nums">
                          {formatMinutes(log.overtime_minutes)}
                        </td>
                        <td className="px-5 py-3">
                          <AttendanceBadge status={log.status} />
                        </td>
                        <td className="px-5 py-3 text-right">
                          <IconButton
                            aria-label="Override"
                            onClick={() => setOverrideTarget(log)}
                          >
                            <Pencil className="h-4 w-4" />
                          </IconButton>
                        </td>
                      </tr>
                      {isOpen ? (
                        <tr className="border-b border-border/60 bg-surface-muted/40">
                          <td colSpan={9} className="px-5 py-3">
                            {log.sessions.length === 0 ? (
                              <p className="text-xs text-foreground-muted">
                                No sessions logged.
                              </p>
                            ) : (
                              <ol className="flex flex-col gap-1.5">
                                {log.sessions.map((s, i) => (
                                  <li
                                    key={s.id}
                                    className="flex items-center gap-3 rounded border border-border bg-surface px-3 py-2 text-xs"
                                  >
                                    <span className="font-medium tabular-nums text-foreground-subtle">
                                      {String(i + 1).padStart(2, "0")}
                                    </span>
                                    <span className="tabular-nums">
                                      {formatTime(s.check_in_at)} →{" "}
                                      {s.check_out_at
                                        ? formatTime(s.check_out_at)
                                        : "Ongoing"}
                                    </span>
                                    <span className="ml-auto font-semibold tabular-nums">
                                      {s.formatted_duration ??
                                        (s.duration_minutes
                                          ? formatMinutes(s.duration_minutes)
                                          : "—")}
                                    </span>
                                  </li>
                                ))}
                              </ol>
                            )}
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {pagination ? (
          <div className="flex items-center justify-between border-t border-border px-5 py-3 text-xs text-foreground-muted">
            <span>
              Page {pagination.page} of {totalPages} · {pagination.total} total
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                leftIcon={<ChevronLeft className="h-4 w-4" />}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={pagination.page >= totalPages}
                rightIcon={<ChevronRight className="h-4 w-4" />}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <AttendanceOverrideModal
        log={overrideTarget}
        onClose={() => setOverrideTarget(null)}
      />

      <ManualMarkModal
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        employees={employeesQuery.data?.data ?? []}
      />
    </div>
  );
}
