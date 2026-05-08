"use client";

import { UserCog, Building2, FileText } from "lucide-react";
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

export default function HrAdminPage() {
  return (
    <AuthGuard>
      <RoleGuard roles={["hr_admin"]}>
        <RoleShell
          title="HR Admin"
          subtitle="Manage employees, departments, and reports."
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-soft text-primary-soft-foreground">
                    <UserCog className="h-4 w-4" />
                  </span>
                  <CardTitle>Employees</CardTitle>
                </div>
                <CardDescription>Onboard, edit, deactivate.</CardDescription>
              </CardHeader>
              <CardBody>
                <div className="h-24 rounded-md bg-surface-muted" />
              </CardBody>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-soft text-primary-soft-foreground">
                    <Building2 className="h-4 w-4" />
                  </span>
                  <CardTitle>Departments</CardTitle>
                </div>
                <CardDescription>Org structure & shifts.</CardDescription>
              </CardHeader>
              <CardBody>
                <div className="h-24 rounded-md bg-surface-muted" />
              </CardBody>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-soft text-primary-soft-foreground">
                    <FileText className="h-4 w-4" />
                  </span>
                  <CardTitle>Reports</CardTitle>
                </div>
                <CardDescription>Company-wide analytics.</CardDescription>
              </CardHeader>
              <CardBody>
                <div className="h-24 rounded-md bg-surface-muted" />
              </CardBody>
            </Card>
          </div>
          <p className="mt-8 text-xs text-foreground-subtle">
            Functional UI ships in Task 14.
          </p>
        </RoleShell>
      </RoleGuard>
    </AuthGuard>
  );
}
