"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchReportsSummary,
  fetchTeamAttendance,
  fetchTeamMembers,
} from "@/lib/api/manager";
import { queryKeys } from "@/lib/query/keys";
import { isoToday } from "@/lib/format";
import { PendingLeaveBanner } from "@/components/manager/PendingLeaveBanner";
import { TeamSummaryBar } from "@/components/manager/TeamSummaryBar";
import {
  TeamStatusGrid,
  type EmployeeStatusEntry,
} from "@/components/manager/TeamStatusGrid";

export default function ManagerOverviewPage() {
  const today = isoToday();

  const summaryQuery = useQuery({
    queryKey: queryKeys.manager.summary,
    queryFn: fetchReportsSummary,
    refetchInterval: 120_000,
  });

  const teamQuery = useQuery({
    queryKey: queryKeys.manager.team({ is_active: true, limit: 100 }),
    queryFn: () => fetchTeamMembers({ is_active: true, limit: 100 }),
  });

  const todayAttendanceQuery = useQuery({
    queryKey: queryKeys.manager.teamAttendance({
      from: today,
      to: today,
      limit: 100,
    }),
    queryFn: () =>
      fetchTeamAttendance({ from: today, to: today, limit: 100 }),
    refetchInterval: 120_000,
  });

  const entries = useMemo<EmployeeStatusEntry[] | undefined>(() => {
    const team = teamQuery.data?.data;
    if (!team) return undefined;
    const logs = todayAttendanceQuery.data?.data ?? [];
    const logByUser = new Map(logs.map((l) => [l.user.id, l]));

    return team.map((employee) => {
      const log = logByUser.get(employee.id);
      const sessions = log?.sessions ?? [];
      const activeSession = sessions.find((s) => !s.check_out_at) ?? null;
      const status: EmployeeStatusEntry["status"] = !log
        ? "not_in"
        : log.status === "ON_LEAVE"
          ? "on_leave"
          : log.status === "ABSENT"
            ? "absent"
            : log.status === "LATE"
              ? "late"
              : log.is_live
                ? "checked_in"
                : "not_in";

      return {
        employee,
        status,
        isLive: !!log?.is_live,
        totalWorkMinutes: log?.total_work_minutes ?? 0,
        sessionsCount: sessions.length,
        currentSessionStartedAt: activeSession?.check_in_at ?? null,
      };
    });
  }, [teamQuery.data, todayAttendanceQuery.data]);

  const summary = useMemo(() => {
    const today = summaryQuery.data?.today;
    if (!today) return null;
    return {
      total: today.checked_in + today.not_checked_in + today.on_leave,
      checkedIn: today.checked_in,
      notIn: today.not_checked_in,
      late: today.late,
      onLeave: today.on_leave,
    };
  }, [summaryQuery.data]);

  const pending = summaryQuery.data?.this_month.pending_leave_requests ?? 0;
  const isLoading = teamQuery.isLoading || todayAttendanceQuery.isLoading;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Team overview</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Live status, today&apos;s totals, and outstanding approvals.
        </p>
      </div>

      <PendingLeaveBanner count={pending} />

      {summary ? (
        <TeamSummaryBar
          total={summary.total}
          checkedIn={summary.checkedIn}
          notIn={summary.notIn}
          late={summary.late}
          onLeave={summary.onLeave}
        />
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
          Today
        </h2>
        <TeamStatusGrid entries={entries} isLoading={isLoading} />
      </section>
    </div>
  );
}
