"use client";

import { Globe2, ShieldCheck, BarChart3 } from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RoleShell } from "@/components/auth/RoleShell";
import {
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";

export default function SuperAdminPage() {
  return (
    <AuthGuard>
      <RoleGuard roles={["super_admin"]}>
        <RoleShell
          title="Platform"
          subtitle="Manage tenants and platform-level settings."
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-soft text-primary-soft-foreground">
                    <Globe2 className="h-4 w-4" />
                  </span>
                  <CardTitle>Companies</CardTitle>
                </div>
                <CardDescription>Tenant directory.</CardDescription>
              </CardHeader>
              <CardBody>
                <div className="h-24 rounded-md bg-surface-muted" />
              </CardBody>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-soft text-primary-soft-foreground">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  <CardTitle>Access</CardTitle>
                </div>
                <CardDescription>Roles & permissions.</CardDescription>
              </CardHeader>
              <CardBody>
                <div className="h-24 rounded-md bg-surface-muted" />
              </CardBody>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-soft text-primary-soft-foreground">
                    <BarChart3 className="h-4 w-4" />
                  </span>
                  <CardTitle>Platform metrics</CardTitle>
                </div>
                <CardDescription>Usage across tenants.</CardDescription>
              </CardHeader>
              <CardBody>
                <div className="h-24 rounded-md bg-surface-muted" />
              </CardBody>
            </Card>
          </div>
          <p className="mt-8 text-xs text-foreground-subtle">
            Functional UI ships in Task 15.
          </p>
        </RoleShell>
      </RoleGuard>
    </AuthGuard>
  );
}
