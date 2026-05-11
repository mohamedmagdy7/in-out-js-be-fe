"use client";

import Link from "next/link";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Eye,
  PowerOff,
  Power,
} from "lucide-react";
import type { CompanyRow, Pagination } from "@/lib/api/types";
import { Badge, Button, CenteredSpinner, IconButton } from "@/components/ui";
import { formatDate } from "@/lib/format";

type Props = {
  rows: CompanyRow[] | undefined;
  pagination: (Pagination & { total_pages?: number }) | undefined;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onToggleActive: (company: CompanyRow) => void;
};

export function CompanyTable({
  rows,
  pagination,
  isLoading,
  onPageChange,
  onToggleActive,
}: Props) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-surface shadow-sm">
        <CenteredSpinner />
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface px-6 py-12 text-center text-sm text-foreground-muted">
        No companies match the current filters.
      </div>
    );
  }

  const totalPages = pagination
    ? Math.max(
        1,
        pagination.total_pages ?? Math.ceil(pagination.total / pagination.limit),
      )
    : 1;
  const page = pagination?.page ?? 1;

  return (
    <div className="rounded-lg border border-border bg-surface shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider text-foreground-subtle">
              <th className="px-5 py-2.5 text-left font-medium">Company</th>
              <th className="px-5 py-2.5 text-left font-medium">Slug</th>
              <th className="px-5 py-2.5 text-left font-medium">Timezone</th>
              <th className="px-5 py-2.5 text-left font-medium">Employees</th>
              <th className="px-5 py-2.5 text-left font-medium">Status</th>
              <th className="px-5 py-2.5 text-left font-medium">Created</th>
              <th className="px-5 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr
                key={c.id}
                className="border-b border-border/60 last:border-0"
              >
                <td className="px-5 py-3">
                  <Link
                    href={`/superadmin/companies/${c.id}`}
                    className="flex items-center gap-3 hover:text-primary"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-soft text-primary-soft-foreground">
                      {c.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.logo_url}
                          alt=""
                          className="h-full w-full rounded-md object-cover"
                        />
                      ) : (
                        <Building2 className="h-4 w-4" />
                      )}
                    </div>
                    <span className="font-medium">{c.name}</span>
                  </Link>
                </td>
                <td className="px-5 py-3 font-mono text-xs text-foreground-muted">
                  {c.slug}
                </td>
                <td className="px-5 py-3 text-foreground-muted">
                  {c.timezone}
                </td>
                <td className="px-5 py-3 tabular-nums text-foreground-muted">
                  {c.employee_count}
                </td>
                <td className="px-5 py-3">
                  <Badge tone={c.is_active ? "success" : "neutral"}>
                    {c.is_active ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="px-5 py-3 tabular-nums text-foreground-muted">
                  {formatDate(c.created_at)}
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/superadmin/companies/${c.id}`}>
                      <IconButton aria-label="View">
                        <Eye className="h-4 w-4" />
                      </IconButton>
                    </Link>
                    <IconButton
                      aria-label={
                        c.is_active ? "Deactivate" : "Reactivate"
                      }
                      title={c.is_active ? "Deactivate" : "Reactivate"}
                      onClick={() => onToggleActive(c)}
                    >
                      {c.is_active ? (
                        <PowerOff className="h-4 w-4" />
                      ) : (
                        <Power className="h-4 w-4 text-success" />
                      )}
                    </IconButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-border px-5 py-3 text-xs text-foreground-muted">
        <span>
          Page {page} of {totalPages}
          {pagination ? ` · ${pagination.total} total` : ""}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            leftIcon={<ChevronLeft className="h-4 w-4" />}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            rightIcon={<ChevronRight className="h-4 w-4" />}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
