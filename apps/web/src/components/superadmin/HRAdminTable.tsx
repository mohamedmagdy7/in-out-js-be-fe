"use client";

import { Power, PowerOff } from "lucide-react";
import type { CompanyAdmin } from "@/lib/api/types";
import { Badge, IconButton } from "@/components/ui";
import { formatDate } from "@/lib/format";

type Props = {
  admins: CompanyAdmin[];
  onToggle: (admin: CompanyAdmin) => void;
};

export function HRAdminTable({ admins, onToggle }: Props) {
  if (admins.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface px-6 py-10 text-center text-sm text-foreground-muted">
        No HR admins yet. Add one to let them manage this company.
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-border bg-surface shadow-sm">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wider text-foreground-subtle">
            <th className="px-5 py-2.5 text-left font-medium">Name</th>
            <th className="px-5 py-2.5 text-left font-medium">Email</th>
            <th className="px-5 py-2.5 text-left font-medium">Created</th>
            <th className="px-5 py-2.5 text-left font-medium">Status</th>
            <th className="px-5 py-2.5 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {admins.map((a) => (
            <tr key={a.id} className="border-b border-border/60 last:border-0">
              <td className="px-5 py-3 font-medium">
                {a.first_name} {a.last_name}
              </td>
              <td className="px-5 py-3 text-foreground-muted">{a.email}</td>
              <td className="px-5 py-3 tabular-nums text-foreground-muted">
                {formatDate(a.created_at)}
              </td>
              <td className="px-5 py-3">
                <Badge tone={a.is_active ? "success" : "neutral"}>
                  {a.is_active ? "Active" : "Inactive"}
                </Badge>
              </td>
              <td className="px-5 py-3">
                <div className="flex items-center justify-end">
                  <IconButton
                    aria-label={a.is_active ? "Deactivate" : "Reactivate"}
                    title={a.is_active ? "Deactivate" : "Reactivate"}
                    onClick={() => onToggle(a)}
                  >
                    {a.is_active ? (
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
  );
}
