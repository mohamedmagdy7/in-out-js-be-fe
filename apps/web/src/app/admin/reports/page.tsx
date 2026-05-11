"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { endOfMonth, format, startOfMonth } from "date-fns";
import {
  fetchAttendanceReport,
} from "@/lib/api/manager";
import {
  fetchDepartments,
  fetchLeaveReport,
  fetchLeaveTypes,
  fetchOvertimeReport,
} from "@/lib/api/admin";
import { queryKeys } from "@/lib/query/keys";
import {
  Button,
  CenteredSpinner,
  Label,
  Select,
} from "@/components/ui";
import { AttendanceReportTable } from "@/components/manager/AttendanceReportTable";
import { AttendanceReportBars } from "@/components/manager/AttendanceReportBars";
import { ExportButtons } from "@/components/manager/ExportButtons";
import { formatMinutes } from "@/lib/format";
import { cn } from "@/lib/cn";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type Tab = "attendance" | "overtime" | "leave";

export default function AdminReportsPage() {
  const [tab, setTab] = useState<Tab>("attendance");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Company-wide attendance, overtime, and leave usage.
        </p>
      </div>

      <div className="inline-flex w-fit rounded-md border border-border bg-surface p-0.5">
        {(
          [
            { key: "attendance", label: "Attendance" },
            { key: "overtime", label: "Overtime" },
            { key: "leave", label: "Leave usage" },
          ] as Array<{ key: Tab; label: string }>
        ).map(({ key, label }) => (
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

      {tab === "attendance" ? <AttendanceTab /> : null}
      {tab === "overtime" ? <OvertimeTab /> : null}
      {tab === "leave" ? <LeaveTab /> : null}
    </div>
  );
}

function MonthYearControls({
  year,
  month,
  onChange,
}: {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
}) {
  const yearOptions = useMemo(() => {
    const cur = new Date().getFullYear();
    return [cur - 2, cur - 1, cur, cur + 1];
  }, []);

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="month">Month</Label>
        <Select
          id="month"
          value={month}
          onChange={(e) => onChange(year, Number(e.target.value))}
        >
          {MONTH_NAMES.map((name, i) => (
            <option key={name} value={i + 1}>
              {name}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="year">Year</Label>
        <Select
          id="year"
          value={year}
          onChange={(e) => onChange(Number(e.target.value), month)}
        >
          {yearOptions.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </Select>
      </div>
    </>
  );
}

function useDepartmentOptions() {
  return useQuery({
    queryKey: queryKeys.admin.departments,
    queryFn: fetchDepartments,
  });
}

function AttendanceTab() {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [departmentId, setDepartmentId] = useState("");

  const departmentsQuery = useDepartmentOptions();

  const range = useMemo(() => {
    const date = new Date(year, month - 1, 1);
    return {
      from: format(startOfMonth(date), "yyyy-MM-dd"),
      to: format(endOfMonth(date), "yyyy-MM-dd"),
      ...(departmentId ? { department_id: departmentId } : {}),
    };
  }, [year, month, departmentId]);

  const reportQuery = useQuery({
    queryKey: queryKeys.admin.report({ kind: "attendance", ...range }),
    queryFn: () => fetchAttendanceReport(range),
  });

  const employees = reportQuery.data?.employees ?? [];
  const summary = reportQuery.data?.summary;
  const grouped = useMemo(() => {
    if (!employees.length) return null;
    const map = new Map<string, typeof employees>();
    for (const e of employees) {
      const key = e.user.department ?? "No department";
      const arr = map.get(key) ?? [];
      arr.push(e);
      map.set(key, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [employees]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid flex-1 gap-3 sm:grid-cols-3">
          <MonthYearControls
            year={year}
            month={month}
            onChange={(y, m) => {
              setYear(y);
              setMonth(m);
            }}
          />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ar-dept">Department</Label>
            <Select
              id="ar-dept"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
            >
              <option value="">All departments</option>
              {departmentsQuery.data?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <ExportButtons query={range} disabled={reportQuery.isLoading} />
      </div>

      {summary ? (
        <div className="grid gap-3 sm:grid-cols-4">
          <Stat label="Employees" value={String(summary.total_employees)} />
          <Stat label="Avg attendance" value={summary.avg_attendance_rate} />
          <Stat label="Total work" value={summary.total_work_hours} />
          <Stat label="Total overtime" value={summary.total_overtime_hours} />
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3 flex flex-col gap-4">
          {reportQuery.isLoading ? (
            <div className="rounded-lg border border-border bg-surface shadow-sm">
              <CenteredSpinner />
            </div>
          ) : grouped ? (
            grouped.map(([dept, rows]) => (
              <div key={dept} className="flex flex-col gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-subtle">
                  {dept} · {rows.length}
                </h3>
                <AttendanceReportTable rows={rows} isLoading={false} />
              </div>
            ))
          ) : (
            <AttendanceReportTable rows={[]} isLoading={false} />
          )}
        </div>
        <div className="lg:col-span-2">
          <AttendanceReportBars rows={employees} />
        </div>
      </section>
    </div>
  );
}

function OvertimeTab() {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [departmentId, setDepartmentId] = useState("");
  const [minHours, setMinHours] = useState(0);

  const departmentsQuery = useDepartmentOptions();

  const range = useMemo(() => {
    const date = new Date(year, month - 1, 1);
    return {
      from: format(startOfMonth(date), "yyyy-MM-dd"),
      to: format(endOfMonth(date), "yyyy-MM-dd"),
      min_hours: minHours,
      ...(departmentId ? { department_id: departmentId } : {}),
    };
  }, [year, month, departmentId, minHours]);

  const query = useQuery({
    queryKey: queryKeys.admin.report({ kind: "overtime", ...range }),
    queryFn: () => fetchOvertimeReport(range),
  });

  const rows = query.data?.employees ?? [];
  const top = rows[0];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-4">
        <MonthYearControls
          year={year}
          month={month}
          onChange={(y, m) => {
            setYear(y);
            setMonth(m);
          }}
        />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ot-dept">Department</Label>
          <Select
            id="ot-dept"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
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
          <Label htmlFor="ot-min">Min hours</Label>
          <Select
            id="ot-min"
            value={minHours}
            onChange={(e) => setMinHours(Number(e.target.value))}
          >
            <option value={0}>Any</option>
            <option value={1}>1h+</option>
            <option value={5}>5h+</option>
            <option value={10}>10h+</option>
            <option value={20}>20h+</option>
          </Select>
        </div>
      </div>

      {top ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat
            label="Top earner"
            value={`${top.user.full_name}`}
          />
          <Stat label="Top hours" value={top.formatted_overtime} />
          <Stat label="Tracked employees" value={String(rows.length)} />
        </div>
      ) : null}

      {query.isLoading ? (
        <div className="rounded-lg border border-border bg-surface shadow-sm">
          <CenteredSpinner />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface px-6 py-10 text-center text-sm text-foreground-muted">
          No overtime recorded for this period.
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-surface shadow-sm">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wider text-foreground-subtle">
                <th className="px-5 py-2.5 text-left font-medium">#</th>
                <th className="px-5 py-2.5 text-left font-medium">Employee</th>
                <th className="px-5 py-2.5 text-left font-medium">Department</th>
                <th className="px-5 py-2.5 text-right font-medium">Days</th>
                <th className="px-5 py-2.5 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.user.id} className="border-b border-border/60 last:border-0">
                  <td className="px-5 py-3 tabular-nums text-foreground-muted">
                    {i + 1}
                  </td>
                  <td className="px-5 py-3 font-medium">{r.user.full_name}</td>
                  <td className="px-5 py-3 text-foreground-muted">
                    {r.user.department ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {r.overtime_days}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums font-semibold">
                    {r.formatted_overtime ||
                      formatMinutes(r.total_overtime_minutes)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function LeaveTab() {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  const departmentsQuery = useDepartmentOptions();
  const leaveTypesQuery = useQuery({
    queryKey: queryKeys.admin.leaveTypes,
    queryFn: fetchLeaveTypes,
  });

  const params = useMemo(
    () => ({
      year,
      ...(leaveTypeId ? { leave_type_id: leaveTypeId } : {}),
      ...(departmentId ? { department_id: departmentId } : {}),
    }),
    [year, leaveTypeId, departmentId],
  );

  const query = useQuery({
    queryKey: queryKeys.admin.report({ kind: "leave", ...params }),
    queryFn: () => fetchLeaveReport(params),
  });

  const yearOptions = useMemo(() => {
    const cur = new Date().getFullYear();
    return [cur - 2, cur - 1, cur];
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lr-year">Year</Label>
          <Select
            id="lr-year"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lr-dept">Department</Label>
          <Select
            id="lr-dept"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
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
          <Label htmlFor="lr-type">Leave type</Label>
          <Select
            id="lr-type"
            value={leaveTypeId}
            onChange={(e) => setLeaveTypeId(e.target.value)}
          >
            <option value="">All types</option>
            {leaveTypesQuery.data?.map((lt) => (
              <option key={lt.id} value={lt.id}>
                {lt.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {query.isLoading ? (
        <div className="rounded-lg border border-border bg-surface shadow-sm">
          <CenteredSpinner />
        </div>
      ) : (query.data?.employees ?? []).length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface px-6 py-10 text-center text-sm text-foreground-muted">
          No leave usage data.
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-surface shadow-sm">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wider text-foreground-subtle">
                <th className="px-5 py-2.5 text-left font-medium">Employee</th>
                <th className="px-5 py-2.5 text-left font-medium">Department</th>
                <th className="px-5 py-2.5 text-left font-medium">Type</th>
                <th className="px-5 py-2.5 text-right font-medium">Used</th>
                <th className="px-5 py-2.5 text-right font-medium">Pending</th>
                <th className="px-5 py-2.5 text-right font-medium">Remaining</th>
              </tr>
            </thead>
            <tbody>
              {query.data!.employees.flatMap((row) =>
                row.balances.map((b, i) => (
                  <tr
                    key={`${row.user.id}-${b.type}`}
                    className="border-b border-border/60 last:border-0"
                  >
                    {i === 0 ? (
                      <>
                        <td
                          rowSpan={row.balances.length}
                          className="px-5 py-3 align-top font-medium"
                        >
                          {row.user.full_name}
                        </td>
                        <td
                          rowSpan={row.balances.length}
                          className="px-5 py-3 align-top text-foreground-muted"
                        >
                          {row.user.department ?? "—"}
                        </td>
                      </>
                    ) : null}
                    <td className="px-5 py-3 text-foreground-muted">
                      {b.type}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      {b.used}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      {b.pending}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums font-semibold">
                      {b.remaining}
                    </td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wider text-foreground-subtle">
        {label}
      </p>
      <p className="mt-1.5 truncate text-xl font-semibold tabular-nums">
        {value}
      </p>
    </div>
  );
}
