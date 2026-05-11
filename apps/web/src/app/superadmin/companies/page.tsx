"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Plus, Search } from "lucide-react";
import {
  deactivateCompany,
  fetchCompanies,
  reactivateCompany,
} from "@/lib/api/superadmin";
import { queryKeys } from "@/lib/query/keys";
import {
  Button,
  Input,
  Label,
  Modal,
  Select,
  toast,
} from "@/components/ui";
import { CompanyTable } from "@/components/superadmin/CompanyTable";
import type { CompanyRow } from "@/lib/api/types";

type StatusFilter = "" | "active" | "inactive";

export default function SuperAdminCompaniesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("");
  const [page, setPage] = useState(1);
  const [confirmTarget, setConfirmTarget] = useState<CompanyRow | null>(null);

  const params = useMemo(
    () => ({
      page,
      limit: 25,
      ...(search ? { search } : {}),
      ...(status ? { is_active: status === "active" } : {}),
    }),
    [page, search, status],
  );

  const companiesQuery = useQuery({
    queryKey: queryKeys.superadmin.companies(params),
    queryFn: () => fetchCompanies(params),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["superadmin", "companies"] });
    qc.invalidateQueries({ queryKey: queryKeys.superadmin.platform });
  };

  const deactivateMutation = useMutation({
    mutationFn: deactivateCompany,
    onSuccess: () => {
      toast.success("Company deactivated");
      setConfirmTarget(null);
      invalidate();
    },
    onError: handleErrorToast("Could not deactivate"),
  });

  const reactivateMutation = useMutation({
    mutationFn: reactivateCompany,
    onSuccess: () => {
      toast.success("Company reactivated");
      setConfirmTarget(null);
      invalidate();
    },
    onError: handleErrorToast("Could not reactivate"),
  });

  const isPending =
    deactivateMutation.isPending || reactivateMutation.isPending;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Companies</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            All tenants on the platform.
          </p>
        </div>
        <Link href="/superadmin/companies/new">
          <Button leftIcon={<Plus className="h-4 w-4" />}>Create company</Button>
        </Link>
      </div>

      <div className="grid gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm sm:grid-cols-3">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Name or slug"
            leftSlot={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="status">Status</Label>
          <Select
            id="status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as StatusFilter);
              setPage(1);
            }}
          >
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>
      </div>

      <CompanyTable
        rows={companiesQuery.data?.data}
        pagination={companiesQuery.data?.pagination}
        isLoading={companiesQuery.isLoading}
        onPageChange={setPage}
        onToggleActive={setConfirmTarget}
      />

      <Modal
        open={confirmTarget !== null}
        onClose={() => setConfirmTarget(null)}
        title={
          confirmTarget?.is_active
            ? "Deactivate company"
            : "Reactivate company"
        }
        description={
          confirmTarget
            ? confirmTarget.is_active
              ? `Deactivating "${confirmTarget.name}" prevents all of its HR admins and employees from logging in.`
              : `Reactivate "${confirmTarget.name}". Its HR admins and employees will be able to log in again.`
            : undefined
        }
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmTarget(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant={confirmTarget?.is_active ? "danger" : "primary"}
              loading={isPending}
              onClick={() => {
                if (!confirmTarget) return;
                if (confirmTarget.is_active) {
                  deactivateMutation.mutate(confirmTarget.id);
                } else {
                  reactivateMutation.mutate(confirmTarget.id);
                }
              }}
            >
              {confirmTarget?.is_active ? "Deactivate" : "Reactivate"}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-foreground-muted">
          Their data is preserved either way — this only controls access.
        </p>
      </Modal>
    </div>
  );
}

function handleErrorToast(title: string) {
  return (err: unknown) => {
    const axiosErr = err as AxiosError<{ error?: string; message?: string }>;
    toast.error(
      title,
      axiosErr.response?.data?.error ??
        axiosErr.response?.data?.message ??
        "Please try again.",
    );
  };
}
