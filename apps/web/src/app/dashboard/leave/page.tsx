"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchLeaveBalance, fetchMyLeaveRequests } from "@/lib/api/leave";
import { queryKeys } from "@/lib/query/keys";
import { LeaveBalanceCards } from "@/components/employee/LeaveBalanceCards";
import { LeaveRequestForm } from "@/components/employee/LeaveRequestForm";
import { LeaveRequestsTable } from "@/components/employee/LeaveRequestsTable";

export default function LeavePage() {
  const balanceQuery = useQuery({
    queryKey: queryKeys.leave.balance,
    queryFn: fetchLeaveBalance,
  });

  const requestsQuery = useQuery({
    queryKey: queryKeys.leave.requests({ limit: 30 }),
    queryFn: () => fetchMyLeaveRequests({ limit: 30 }),
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Leave</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Track balances and submit time-off requests.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
          Balances
        </h2>
        <LeaveBalanceCards
          data={balanceQuery.data}
          isLoading={balanceQuery.isLoading}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
          New request
        </h2>
        <LeaveRequestForm balance={balanceQuery.data} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
          Your requests
        </h2>
        <LeaveRequestsTable
          data={requestsQuery.data?.data}
          isLoading={requestsQuery.isLoading}
        />
      </section>
    </div>
  );
}
