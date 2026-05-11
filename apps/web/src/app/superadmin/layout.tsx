import { AuthGuard } from "@/components/auth/AuthGuard";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { SuperAdminShell } from "@/components/superadmin/SuperAdminShell";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <RoleGuard roles={["super_admin"]}>
        <SuperAdminShell>{children}</SuperAdminShell>
      </RoleGuard>
    </AuthGuard>
  );
}
