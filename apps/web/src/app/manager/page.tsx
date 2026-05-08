"use client";

import { Users, Activity, FileBarChart } from "lucide-react";
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

export default function ManagerDashboardPage() {
  return (
    <AuthGuard>
      <RoleGuard roles={["manager"]}>
        <RoleShell
          title="Team overview"
          subtitle="Live status, attendance, and team reports."
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-soft text-primary-soft-foreground">
                    <Activity className="h-4 w-4" />
                  </span>
                  <CardTitle>Live status</CardTitle>
                </div>
                <CardDescription>Who&apos;s in right now.</CardDescription>
              </CardHeader>
              <CardBody>
                <div className="h-24 rounded-md bg-surface-muted" />
              </CardBody>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-soft text-primary-soft-foreground">
                    <Users className="h-4 w-4" />
                  </span>
                  <CardTitle>Attendance</CardTitle>
                </div>
                <CardDescription>This week at a glance.</CardDescription>
              </CardHeader>
              <CardBody>
                <div className="h-24 rounded-md bg-surface-muted" />
              </CardBody>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-soft text-primary-soft-foreground">
                    <FileBarChart className="h-4 w-4" />
                  </span>
                  <CardTitle>Reports</CardTitle>
                </div>
                <CardDescription>Export team data.</CardDescription>
              </CardHeader>
              <CardBody>
                <div className="h-24 rounded-md bg-surface-muted" />
              </CardBody>
            </Card>
          </div>
          <p className="mt-8 text-xs text-foreground-subtle">
            Functional UI ships in Task 13.
          </p>
        </RoleShell>
      </RoleGuard>
    </AuthGuard>
  );
}
