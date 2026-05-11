"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Calendar,
  CalendarRange,
  Clock3,
  FileBarChart,
  LayoutGrid,
  Settings,
  TimerReset,
  Users,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth/auth-store";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { ThemeToggle } from "@/components/ui";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutGrid },
  { href: "/admin/employees", label: "Employees", icon: Users },
  { href: "/admin/departments", label: "Departments", icon: Building2 },
  { href: "/admin/shifts", label: "Shifts", icon: TimerReset },
  { href: "/admin/leave-types", label: "Leave types", icon: CalendarRange },
  { href: "/admin/attendance", label: "Attendance", icon: Clock3 },
  { href: "/admin/leave", label: "Leave", icon: Calendar },
  { href: "/admin/reports", label: "Reports", icon: FileBarChart },
  { href: "/admin/settings", label: "Settings", icon: Settings },
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const initials = user
    ? `${user.first_name[0] ?? ""}${user.last_name[0] ?? ""}`.toUpperCase()
    : "";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Clock3 className="h-4 w-4" strokeWidth={2.25} />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold">Check-in</p>
              <p className="text-[11px] uppercase tracking-wider text-foreground-subtle">
                HR Admin
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
        <nav className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto overflow-y-hidden px-3 sm:px-5">
          {NAV.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" &&
                (pathname === item.href ||
                  pathname.startsWith(`${item.href}/`)));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative inline-flex shrink-0 items-center gap-1.5 px-3 py-2 text-sm transition-colors",
                  "hover:text-foreground",
                  isActive ? "text-foreground" : "text-foreground-muted",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
                {isActive ? (
                  <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />
                ) : null}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 animate-fade-in">
        {children}
      </main>
    </div>
  );
}
