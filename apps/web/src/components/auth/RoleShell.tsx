"use client";

import { Clock3 } from "lucide-react";
import { useAuthStore } from "@/lib/auth/auth-store";
import { Badge, ThemeToggle } from "@/components/ui";
import { LogoutButton } from "./LogoutButton";

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super Admin",
  hr_admin: "HR Admin",
  manager: "Manager",
  employee: "Employee",
};

export function RoleShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  const user = useAuthStore((s) => s.user);
  const roleKey = user?.role.toLowerCase() ?? "";
  const initials = user
    ? `${user.first_name[0] ?? ""}${user.last_name[0] ?? ""}`.toUpperCase()
    : "";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Clock3 className="h-4 w-4" strokeWidth={2.25} />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold">Check-in</p>
              <p className="text-[11px] uppercase tracking-wider text-foreground-subtle">
                {ROLE_LABEL[roleKey] ?? roleKey}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="hidden items-center gap-2 sm:flex">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary-soft-foreground">
                  {initials || "?"}
                </div>
                <div className="text-right leading-tight">
                  <p className="text-sm font-medium">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-[11px] text-foreground-subtle">
                    {user.email}
                  </p>
                </div>
              </div>
            ) : null}
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {subtitle ? (
              <p className="mt-1 text-sm text-foreground-muted">{subtitle}</p>
            ) : null}
          </div>
          {user ? <Badge tone="primary">{ROLE_LABEL[roleKey]}</Badge> : null}
        </div>
        <div className="animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
