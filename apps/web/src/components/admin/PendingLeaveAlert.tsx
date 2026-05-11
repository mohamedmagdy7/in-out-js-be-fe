"use client";

import Link from "next/link";
import { ArrowRight, CalendarClock } from "lucide-react";

type Props = { count: number };

export function PendingLeaveAlert({ count }: Props) {
  if (count <= 0) return null;
  return (
    <Link
      href="/admin/leave"
      className="group flex items-center justify-between gap-3 rounded-lg border border-warning/30 bg-warning-soft/60 px-4 py-3 text-sm shadow-sm transition-colors hover:bg-warning-soft"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-warning/20 text-warning-soft-foreground">
          <CalendarClock className="h-4 w-4" />
        </span>
        <span className="font-medium text-warning-soft-foreground">
          {count} leave request{count === 1 ? "" : "s"} awaiting approval
        </span>
      </div>
      <ArrowRight className="h-4 w-4 text-warning-soft-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
