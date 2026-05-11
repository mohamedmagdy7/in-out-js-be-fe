"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Building2,
  CheckCircle2,
  Users,
} from "lucide-react";
import { fetchPlatformStats } from "@/lib/api/superadmin";
import { queryKeys } from "@/lib/query/keys";
import { KpiCard } from "@/components/admin/KpiCard";
import { Badge, CenteredSpinner } from "@/components/ui";
import { formatDate } from "@/lib/format";

export default function SuperAdminOverviewPage() {
  const platformQuery = useQuery({
    queryKey: queryKeys.superadmin.platform,
    queryFn: fetchPlatformStats,
    refetchInterval: 120_000,
  });

  const stats = platformQuery.data;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Platform overview
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Tenant counts, activity, and most recent companies.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total companies"
          value={stats?.total_companies ?? "—"}
          icon={Building2}
          tone="primary"
        />
        <KpiCard
          label="Active companies"
          value={stats?.active_companies ?? "—"}
          hint={
            stats
              ? `${stats.total_companies - stats.active_companies} inactive`
              : undefined
          }
          icon={CheckCircle2}
          tone="success"
        />
        <KpiCard
          label="Total employees"
          value={stats?.total_employees ?? "—"}
          icon={Users}
          tone="neutral"
        />
        <KpiCard
          label="Check-ins today"
          value={stats?.checked_in_today ?? "—"}
          icon={Activity}
          tone="warning"
        />
      </div>

      <section className="rounded-lg border border-border bg-surface shadow-sm">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold">Recently created companies</h2>
          <p className="text-xs text-foreground-muted">
            The 5 most recent tenants.
          </p>
        </div>
        {platformQuery.isLoading ? (
          <CenteredSpinner />
        ) : (stats?.recent_companies ?? []).length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-foreground-muted">
            No companies yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-foreground-subtle">
                  <th className="px-5 py-2.5 text-left font-medium">Name</th>
                  <th className="px-5 py-2.5 text-left font-medium">Slug</th>
                  <th className="px-5 py-2.5 text-left font-medium">
                    Employees
                  </th>
                  <th className="px-5 py-2.5 text-left font-medium">Status</th>
                  <th className="px-5 py-2.5 text-left font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.recent_companies ?? []).map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-border/60 last:border-0"
                  >
                    <td className="px-5 py-3 font-medium">
                      <Link
                        href={`/superadmin/companies/${c.id}`}
                        className="hover:text-primary"
                      >
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-foreground-muted">
                      {c.slug}
                    </td>
                    <td className="px-5 py-3 tabular-nums text-foreground-muted">
                      {c.employee_count}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={c.is_active ? "success" : "neutral"}>
                        {c.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 tabular-nums text-foreground-muted">
                      {formatDate(c.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
