"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { EmployeeShell } from "@/components/employee/EmployeeShell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <RoleGuard roles={["employee"]}>
        <EmployeeShell>{children}</EmployeeShell>
      </RoleGuard>
    </AuthGuard>
  );
}
