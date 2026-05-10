"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { endOfMonth, format, startOfMonth } from "date-fns";
import {
  fetchTeamAttendance,
  fetchTeamMembers,
} from "@/lib/api/manager";
import { queryKeys } from "@/lib/query/keys";
import {
  Button,
  Input,
  Label,
  Select,
} from "@/components/ui";
import { TeamAttendanceTable } from "@/components/manager/TeamAttendanceTable";
import { formatMinutes } from "@/lib/format";
import type { AttendanceStatus } from "@/lib/api/types";

type StatusFilter = AttendanceStatus | "";

export default function ManagerAttendancePage() {
  const today = new Date();
  const [from, setFrom] = useState(() =>
    format(startOfMonth(today), "yyyy-MM-dd"),
  );
  const [to, setTo] = useState(() => format(endOfMonth(today), "yyyy-MM-dd"));
  const [employeeId, setEmployeeId] = useState<string>("");
  const [status, setStatus] = useState<StatusFilter>("");
  const [page, setPage] = useState(1);

  const teamQuery = useQuery({
    queryKey: queryKeys.manager.team({ is_active: true, limit: 100 }),
    queryFn: () => fetchTeamMembers({ is_active: true, limit: 100 }),
  });

  const queryParams = useMemo(
    () => ({
      from,
      to,
      ...(employeeId ? { employee_id: employeeId } : {}),
      ...(status ? { status } : {}),
      page,
      limit: 30,
    }),
    [from, to, employeeId, status, page],
  );

  const attendanceQuery = useQuery({
    queryKey: queryKeys.manager.teamAttendance(queryParams),
    queryFn: () => fetchTeamAttendance(queryParams),
  });

  const stats = useMemo(() => {
    const data = attendanceQuery.data?.data ?? [];
    if (data.length === 0) {
      return { rate: "—", overtime: 0, mostAbsent: "—" };
    }
    const present = data.filter(
      (l) => l.status === "PRESENT" || l.status === "LATE" || l.status === "HALF_DAY",
    ).length;
    const rate = `${((present / data.length) * 100).toFixed(1)}%`;
    const overtime = data.reduce((sum, l) => sum + l.overtime_minutes, 0);

    const absentByUser = new Map<string, { name: string; count: number }>();
    for (const l of data) {
      if (l.status !== "ABSENT") continue;
      const cur = absentByUser.get(l.user.id) ?? {
        name: l.user.full_name,
        count: 0,
      };
      cur.count += 1;
      absentByUser.set(l.user.id, cur);
    }
    const top = Array.from(absentByUser.values()).sort(
      (a, b) => b.count - a.count,
    )[0];
    const mostAbsent = top ? `${top.name} (${top.count})` : "—";

    return { rate, overtime, mostAbsent };
  }, [attendanceQuery.data]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Team attendance
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Filter by employee, status, and date range. Click a row to expand its
          sessions.
        </p>
      </div>

      <div className="grid gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
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
            {teamQuery.data?.data.map((m) => (
              <option key={m.id} value={m.id}>
                {m.first_name} {m.last_name}
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
            <option value="">All statuses</option>
            <option value="PRESENT">Present</option>
            <option value="ABSENT">Absent</option>
            <option value="LATE">Late</option>
            <option value="ON_LEAVE">On leave</option>
          </Select>
        </div>
        <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFrom(format(startOfMonth(new Date()), "yyyy-MM-dd"));
              setTo(format(endOfMonth(new Date()), "yyyy-MM-dd"));
              setEmployeeId("");
              setStatus("");
              setPage(1);
            }}
          >
            Reset filters
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Attendance rate" value={stats.rate} />
        <Stat label="Total overtime" value={formatMinutes(stats.overtime)} />
        <Stat label="Most absent" value={stats.mostAbsent} />
      </div>

      <TeamAttendanceTable
        logs={attendanceQuery.data?.data}
        pagination={attendanceQuery.data?.pagination}
        isLoading={attendanceQuery.isLoading}
        onPageChange={setPage}
      />
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
