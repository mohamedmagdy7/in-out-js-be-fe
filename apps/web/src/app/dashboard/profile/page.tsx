"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchProfile } from "@/lib/api/profile";
import { queryKeys } from "@/lib/query/keys";
import { ProfileForm } from "@/components/employee/ProfileForm";
import { ChangePasswordForm } from "@/components/employee/ChangePasswordForm";
import { CenteredSpinner } from "@/components/ui";
import { formatDate } from "@/lib/format";

export default function ProfilePage() {
  const profileQuery = useQuery({
    queryKey: queryKeys.profile,
    queryFn: fetchProfile,
  });

  const profile = profileQuery.data;

  if (profileQuery.isLoading || !profile) {
    return <CenteredSpinner />;
  }

  const initials =
    `${profile.first_name[0] ?? ""}${profile.last_name[0] ?? ""}`.toUpperCase();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Personal info and account settings.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
          Account
        </h2>
        <div className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-5 shadow-sm sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-primary-soft text-lg font-semibold text-primary-soft-foreground">
            {initials || "?"}
          </div>
          <div className="flex flex-1 flex-col gap-3 sm:grid sm:grid-cols-2">
            <ReadOnly label="Email" value={profile.email} />
            <ReadOnly label="Role" value={formatRole(profile.role)} />
            <ReadOnly
              label="Department"
              value={profile.department?.name ?? "—"}
            />
            <ReadOnly
              label="Shift"
              value={
                profile.shift
                  ? `${profile.shift.name} · ${profile.shift.start_time} – ${profile.shift.end_time}`
                  : "—"
              }
            />
            <ReadOnly
              label="Manager"
              value={
                profile.manager
                  ? `${profile.manager.first_name} ${profile.manager.last_name}`
                  : "—"
              }
            />
            <ReadOnly
              label="Joined"
              value={formatDate(profile.created_at)}
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
          Personal info
        </h2>
        <ProfileForm profile={profile} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
          Security
        </h2>
        <ChangePasswordForm />
      </section>
    </div>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-foreground-subtle">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}

function formatRole(role: string): string {
  switch (role.toUpperCase()) {
    case "EMPLOYEE":
      return "Employee";
    case "MANAGER":
      return "Manager";
    case "HR_ADMIN":
      return "HR Admin";
    case "SUPER_ADMIN":
      return "Super Admin";
    default:
      return role;
  }
}
