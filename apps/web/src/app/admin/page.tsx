"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, CalendarOff, ClipboardList, Users } from "lucide-react";
import {
  fetchCompanyAttendance,
  fetchMyCompanyStats,
} from "@/lib/api/admin";
import { fetchReportsSummary } from "@/lib/api/manager";
import { fetchStatus } from "@/lib/api/attendance";
import { queryKeys } from "@/lib/query/keys";
import { isoToday } from "@/lib/format";
import { CheckInButton } from "@/components/employee/CheckInButton";
import { KpiCard } from "@/components/admin/KpiCard";
import { LiveCheckInFeed } from "@/components/admin/LiveCheckInFeed";
import { PendingLeaveAlert } from "@/components/admin/PendingLeaveAlert";

export default function AdminOverviewPage() {
  const today = isoToday();

  const statsQuery = useQuery({
    queryKey: queryKeys.admin.companyStats,
    queryFn: fetchMyCompanyStats,
    refetchInterval: 120_000,
  });

  const summaryQuery = useQuery({
    queryKey: queryKeys.admin.summary,
    queryFn: fetchReportsSummary,
    refetchInterval: 120_000,
  });

  const todayAttendanceQuery = useQuery({
    queryKey: queryKeys.admin.attendance({
      from: today,
      to: today,
      limit: 100,
    }),
    queryFn: () =>
      fetchCompanyAttendance({ from: today, to: today, limit: 100 }),
    refetchInterval: 120_000,
  });

  const statusQuery = useQuery({
    queryKey: queryKeys.attendance.status,
    queryFn: fetchStatus,
    refetchInterval: 60_000,
  });

  const stats = statsQuery.data;
  const summary = summaryQuery.data;
  const total = stats?.active_employees ?? stats?.total_employees ?? 0;
  const present = summary?.today.checked_in ?? 0;
  const onLeave = summary?.today.on_leave ?? stats?.on_leave_today ?? 0;
  const pending = summary?.this_month.pending_leave_requests ?? 0;
  const presentPct =
    total > 0 ? `${Math.round((present / total) * 100)}%` : "—";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin overview</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Company-wide attendance and outstanding approvals at a glance.
        </p>
      </div>

      <PendingLeaveAlert count={pending} />

      <CheckInButton status={statusQuery.data} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total staff"
          value={total}
          icon={Users}
          tone="primary"
        />
        <KpiCard
          label="Present today"
          value={present}
          hint={`${presentPct} of active staff`}
          icon={CalendarCheck}
          tone="success"
        />
        <KpiCard
          label="On leave"
          value={onLeave}
          icon={CalendarOff}
          tone="warning"
        />
        <KpiCard
          label="Pending leave"
          value={pending}
          icon={ClipboardList}
          tone={pending > 0 ? "warning" : "neutral"}
        />
      </div>

      <LiveCheckInFeed
        logs={todayAttendanceQuery.data?.data}
        isLoading={todayAttendanceQuery.isLoading}
      />
    </div>
  );
}
