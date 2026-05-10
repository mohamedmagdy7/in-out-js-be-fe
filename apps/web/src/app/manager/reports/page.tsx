"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { fetchAttendanceReport } from "@/lib/api/manager";
import { queryKeys } from "@/lib/query/keys";
import { AttendanceReportTable } from "@/components/manager/AttendanceReportTable";
import { AttendanceReportBars } from "@/components/manager/AttendanceReportBars";
import { ExportButtons } from "@/components/manager/ExportButtons";
import { Label, Select } from "@/components/ui";

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

export default function ManagerReportsPage() {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1); // 1-12

  const yearOptions = useMemo(() => {
    const cur = new Date().getFullYear();
    return [cur - 2, cur - 1, cur, cur + 1];
  }, []);

  const range = useMemo(() => {
    const date = new Date(year, month - 1, 1);
    return {
      from: format(startOfMonth(date), "yyyy-MM-dd"),
      to: format(endOfMonth(date), "yyyy-MM-dd"),
    };
  }, [year, month]);

  const reportQuery = useQuery({
    queryKey: queryKeys.manager.report(range),
    queryFn: () => fetchAttendanceReport(range),
  });

  const employees = reportQuery.data?.employees ?? [];
  const summary = reportQuery.data?.summary;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Monthly attendance summary for your team. Export as CSV or PDF.
          </p>
        </div>
        <ExportButtons query={range} disabled={reportQuery.isLoading} />
      </div>

      <div className="grid gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="month">Month</Label>
          <Select
            id="month"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
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
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
        </div>
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
        <div className="lg:col-span-3">
          <AttendanceReportTable
            rows={employees}
            isLoading={reportQuery.isLoading}
          />
        </div>
        <div className="lg:col-span-2">
          <AttendanceReportBars rows={employees} />
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wider text-foreground-subtle">
        {label}
      </p>
      <p className="mt-1.5 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
