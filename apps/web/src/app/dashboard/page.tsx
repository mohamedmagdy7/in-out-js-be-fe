"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckInButton } from "@/components/employee/CheckInButton";
import { TodayStats } from "@/components/employee/TodayStats";
import { SessionsTimeline } from "@/components/employee/SessionsTimeline";
import { RecentAttendance } from "@/components/employee/RecentAttendance";
import { LeaveBalanceStrip } from "@/components/employee/LeaveBalanceStrip";
import { fetchStatus, fetchToday, fetchMyAttendance } from "@/lib/api/attendance";
import { fetchLeaveBalance } from "@/lib/api/leave";
import { queryKeys } from "@/lib/query/keys";

export default function EmployeeDashboardPage() {
  const statusQuery = useQuery({
    queryKey: queryKeys.attendance.status,
    queryFn: fetchStatus,
    refetchInterval: 60_000,
  });

  const todayQuery = useQuery({
    queryKey: queryKeys.attendance.today,
    queryFn: fetchToday,
    refetchInterval: 60_000,
  });

  const recentParams = { limit: 5, page: 1 };
  const recentQuery = useQuery({
    queryKey: queryKeys.attendance.my(recentParams),
    queryFn: () => fetchMyAttendance(recentParams),
  });

  const balanceQuery = useQuery({
    queryKey: queryKeys.leave.balance,
    queryFn: fetchLeaveBalance,
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Today</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Check in to start your day. We&apos;ll track your hours from there.
        </p>
      </div>

      <CheckInButton status={statusQuery.data} />

      <TodayStats status={statusQuery.data} today={todayQuery.data} />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
          Today&apos;s sessions
        </h2>
        <SessionsTimeline today={todayQuery.data} />
      </section>

      <RecentAttendance
        logs={recentQuery.data?.data}
        isLoading={recentQuery.isLoading}
      />

      <LeaveBalanceStrip
        data={balanceQuery.data}
        isLoading={balanceQuery.isLoading}
      />
    </div>
  );
}
