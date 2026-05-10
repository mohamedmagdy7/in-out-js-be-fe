"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { ManagerShell } from "@/components/manager/ManagerShell";

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <RoleGuard roles={["manager"]}>
        <ManagerShell>{children}</ManagerShell>
      </RoleGuard>
    </AuthGuard>
  );
}
