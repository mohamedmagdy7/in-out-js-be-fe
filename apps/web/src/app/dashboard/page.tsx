"use client";

import { Clock3, Calendar, History } from "lucide-react";
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

export default function EmployeeDashboardPage() {
  return (
    <AuthGuard>
      <RoleGuard roles={["employee"]}>
        <RoleShell
          title="Your day"
          subtitle="Check in, view your history, and request leave."
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <PreviewCard
              icon={<Clock3 className="h-4 w-4" />}
              title="Check-in"
              description="One tap to start your day."
            />
            <PreviewCard
              icon={<History className="h-4 w-4" />}
              title="History"
              description="Your recent attendance records."
            />
            <PreviewCard
              icon={<Calendar className="h-4 w-4" />}
              title="Leave"
              description="Request and track time off."
            />
          </div>
          <p className="mt-8 text-xs text-foreground-subtle">
            Functional UI ships in Task 12.
          </p>
        </RoleShell>
      </RoleGuard>
    </AuthGuard>
  );
}

function PreviewCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-soft text-primary-soft-foreground">
            {icon}
          </span>
          <CardTitle>{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardBody>
        <div className="h-16 rounded-md bg-surface-muted" />
      </CardBody>
    </Card>
  );
}
