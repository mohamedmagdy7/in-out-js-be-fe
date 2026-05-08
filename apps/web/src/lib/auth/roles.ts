import type { UserRole } from "@repo/shared";

export const ROLE_HOME: Record<UserRole, string> = {
  super_admin: "/superadmin",
  hr_admin: "/admin",
  manager: "/manager",
  employee: "/dashboard",
};

export function getRoleHome(role: string | null | undefined): string {
  if (!role) return "/login";
  const r = role.toLowerCase() as UserRole;
  return ROLE_HOME[r] ?? "/login";
}

export function isAllowedForPath(
  role: string | null | undefined,
  pathname: string,
): boolean {
  if (!role) return false;
  const r = role.toLowerCase();

  if (pathname.startsWith("/superadmin")) return r === "super_admin";
  if (pathname.startsWith("/admin")) return r === "hr_admin";
  if (pathname.startsWith("/manager")) return r === "manager";
  if (pathname.startsWith("/dashboard")) return r === "employee";

  return true;
}
