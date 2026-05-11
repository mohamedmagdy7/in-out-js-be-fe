"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  ArrowLeft,
  Building2,
  ExternalLink,
  PowerOff,
  Power,
  Settings,
  UserPlus,
} from "lucide-react";
import {
  deactivateCompany,
  fetchCompany,
  fetchCompanyAdmins,
  fetchCompanyStats,
  inviteCompanyAdmin,
  reactivateCompany,
  setCompanyAdminActive,
} from "@/lib/api/superadmin";
import { queryKeys } from "@/lib/query/keys";
import {
  Badge,
  Button,
  CenteredSpinner,
  Modal,
  toast,
} from "@/components/ui";
import { KpiCard } from "@/components/admin/KpiCard";
import { HRAdminTable } from "@/components/superadmin/HRAdminTable";
import { AddHRAdminModal } from "@/components/superadmin/AddHRAdminModal";
import type { CompanyAdmin } from "@/lib/api/types";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";

type Tab = "admins" | "settings";

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function CompanyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("admins");
  const [addOpen, setAddOpen] = useState(false);
  const [confirmToggle, setConfirmToggle] = useState<{
    kind: "company";
  } | { kind: "admin"; admin: CompanyAdmin } | null>(null);

  const companyQuery = useQuery({
    queryKey: queryKeys.superadmin.company(id),
    queryFn: () => fetchCompany(id),
  });
  const statsQuery = useQuery({
    queryKey: queryKeys.superadmin.companyStats(id),
    queryFn: () => fetchCompanyStats(id),
    refetchInterval: 60_000,
  });
  const adminsQuery = useQuery({
    queryKey: queryKeys.superadmin.companyAdmins(id),
    queryFn: () => fetchCompanyAdmins(id),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: queryKeys.superadmin.company(id) });
    qc.invalidateQueries({ queryKey: queryKeys.superadmin.companyAdmins(id) });
    qc.invalidateQueries({ queryKey: ["superadmin", "companies"] });
    qc.invalidateQueries({ queryKey: queryKeys.superadmin.platform });
  };

  const deactivateMutation = useMutation({
    mutationFn: () => deactivateCompany(id),
    onSuccess: () => {
      toast.success("Company deactivated");
      setConfirmToggle(null);
      invalidate();
    },
    onError: errorToast("Could not deactivate"),
  });

  const reactivateMutation = useMutation({
    mutationFn: () => reactivateCompany(id),
    onSuccess: () => {
      toast.success("Company reactivated");
      setConfirmToggle(null);
      invalidate();
    },
    onError: errorToast("Could not reactivate"),
  });

  const inviteMutation = useMutation({
    mutationFn: (body: {
      first_name: string;
      last_name: string;
      email: string;
      password: string;
    }) => inviteCompanyAdmin(id, body),
    onSuccess: () => {
      toast.success("HR admin added");
      setAddOpen(false);
      qc.invalidateQueries({
        queryKey: queryKeys.superadmin.companyAdmins(id),
      });
    },
    onError: errorToast("Could not add HR admin"),
  });

  const toggleAdminMutation = useMutation({
    mutationFn: ({
      userId,
      isActive,
    }: {
      userId: string;
      isActive: boolean;
    }) => setCompanyAdminActive(id, userId, isActive),
    onSuccess: () => {
      toast.success("HR admin updated");
      setConfirmToggle(null);
      qc.invalidateQueries({
        queryKey: queryKeys.superadmin.companyAdmins(id),
      });
    },
    onError: errorToast("Could not update HR admin"),
  });

  if (companyQuery.isLoading) {
    return (
      <div className="rounded-lg border border-border bg-surface shadow-sm">
        <CenteredSpinner />
      </div>
    );
  }

  if (!companyQuery.data) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface px-6 py-12 text-center text-sm text-foreground-muted">
        Company not found.
      </div>
    );
  }

  const company = companyQuery.data;
  const stats = statsQuery.data;
  const togglePending =
    deactivateMutation.isPending || reactivateMutation.isPending;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/superadmin/companies"
          className="inline-flex items-center gap-1 text-foreground-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Companies
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-md bg-primary-soft text-primary-soft-foreground">
            {company.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={company.logo_url}
                alt=""
                className="h-full w-full rounded-md object-cover"
              />
            ) : (
              <Building2 className="h-6 w-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                {company.name}
              </h1>
              <Badge tone={company.is_active ? "success" : "neutral"}>
                {company.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="text-sm text-foreground-muted">
              <span className="font-mono">{company.slug}</span> ·{" "}
              {company.timezone} · created {formatDate(company.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            leftIcon={<ExternalLink className="h-4 w-4" />}
            disabled
            title="Coming soon"
          >
            View as HR admin
          </Button>
          <Button
            variant={company.is_active ? "danger" : "primary"}
            leftIcon={
              company.is_active ? (
                <PowerOff className="h-4 w-4" />
              ) : (
                <Power className="h-4 w-4" />
              )
            }
            onClick={() => setConfirmToggle({ kind: "company" })}
          >
            {company.is_active ? "Deactivate" : "Reactivate"}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Active employees"
          value={stats?.active_employees ?? "—"}
          tone="primary"
        />
        <KpiCard
          label="Departments"
          value={stats?.departments_count ?? "—"}
          tone="neutral"
        />
        <KpiCard
          label="Checked in today"
          value={stats?.checked_in_today ?? "—"}
          tone="success"
        />
        <KpiCard
          label="On leave"
          value={stats?.on_leave_today ?? "—"}
          tone="warning"
        />
      </div>

      <div className="inline-flex w-fit rounded-md border border-border bg-surface p-0.5">
        {(
          [
            { key: "admins", label: "HR admins" },
            { key: "settings", label: "Company settings" },
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

      {tab === "admins" ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-foreground-muted">
              Users who can manage this company.
            </p>
            <Button
              leftIcon={<UserPlus className="h-4 w-4" />}
              onClick={() => setAddOpen(true)}
            >
              Add HR admin
            </Button>
          </div>
          {adminsQuery.isLoading ? (
            <div className="rounded-lg border border-border bg-surface shadow-sm">
              <CenteredSpinner />
            </div>
          ) : (
            <HRAdminTable
              admins={adminsQuery.data ?? []}
              onToggle={(admin) =>
                setConfirmToggle({ kind: "admin", admin })
              }
            />
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-surface shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div>
              <h2 className="text-sm font-semibold">Company settings</h2>
              <p className="text-xs text-foreground-muted">
                Read-only. HR admins manage these inside their own panel.
              </p>
            </div>
            <Settings className="h-4 w-4 text-foreground-subtle" />
          </div>
          <dl className="divide-y divide-border">
            <SettingRow label="Timezone" value={company.timezone} />
            <SettingRow
              label="Daily hours threshold"
              value={`${company.daily_hours_threshold}h`}
            />
            <SettingRow
              label="Weekend days"
              value={
                company.weekend_days.length === 0
                  ? "None"
                  : company.weekend_days
                      .slice()
                      .sort((a, b) => a - b)
                      .map((d) => WEEKDAYS[d])
                      .join(", ")
              }
            />
            <SettingRow
              label="Logo"
              value={company.logo_url ? "Set" : "Not set"}
            />
            <SettingRow
              label="Created"
              value={formatDate(company.created_at)}
            />
          </dl>
        </div>
      )}

      <AddHRAdminModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={(body) => inviteMutation.mutate(body)}
        isSubmitting={inviteMutation.isPending}
      />

      <Modal
        open={confirmToggle !== null}
        onClose={() => setConfirmToggle(null)}
        title={
          confirmToggle?.kind === "company"
            ? company.is_active
              ? "Deactivate company"
              : "Reactivate company"
            : confirmToggle?.admin.is_active
              ? "Deactivate HR admin"
              : "Reactivate HR admin"
        }
        description={
          confirmToggle?.kind === "company"
            ? company.is_active
              ? `Deactivating "${company.name}" prevents all of its users from logging in.`
              : `Reactivate "${company.name}".`
            : confirmToggle
              ? confirmToggle.admin.is_active
                ? `Deactivating ${confirmToggle.admin.first_name} ${confirmToggle.admin.last_name} prevents them from logging in.`
                : `Reactivate ${confirmToggle.admin.first_name} ${confirmToggle.admin.last_name}.`
              : undefined
        }
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmToggle(null)}
              disabled={togglePending || toggleAdminMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant={
                confirmToggle?.kind === "company"
                  ? company.is_active
                    ? "danger"
                    : "primary"
                  : confirmToggle?.admin.is_active
                    ? "danger"
                    : "primary"
              }
              loading={togglePending || toggleAdminMutation.isPending}
              onClick={() => {
                if (!confirmToggle) return;
                if (confirmToggle.kind === "company") {
                  if (company.is_active) deactivateMutation.mutate();
                  else reactivateMutation.mutate();
                } else {
                  toggleAdminMutation.mutate({
                    userId: confirmToggle.admin.id,
                    isActive: !confirmToggle.admin.is_active,
                  });
                }
              }}
            >
              Confirm
            </Button>
          </div>
        }
      >
        <p className="text-sm text-foreground-muted">
          Records are preserved — this only controls access.
        </p>
      </Modal>
    </div>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 px-5 py-3 text-sm">
      <dt className="col-span-1 text-foreground-muted">{label}</dt>
      <dd className="col-span-2">{value}</dd>
    </div>
  );
}

function errorToast(title: string) {
  return (err: unknown) => {
    const axiosErr = err as AxiosError<{ error?: string; message?: string }>;
    toast.error(
      title,
      axiosErr.response?.data?.error ??
        axiosErr.response?.data?.message ??
        "Please try again.",
    );
  };
}
