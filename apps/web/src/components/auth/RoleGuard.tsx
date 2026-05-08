"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@repo/shared";
import { useAuthStore } from "@/lib/auth/auth-store";
import { getRoleHome } from "@/lib/auth/roles";

type RoleGuardProps = {
  roles: UserRole[];
  children: React.ReactNode;
};

export function RoleGuard({ roles, children }: RoleGuardProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  const allowed =
    user != null && roles.includes(user.role.toLowerCase() as UserRole);

  useEffect(() => {
    if (!isInitialized || !user) return;
    if (!allowed) {
      router.replace(getRoleHome(user.role));
    }
  }, [isInitialized, user, allowed, router]);

  if (!isInitialized || !user || !allowed) return null;
  return <>{children}</>;
}
