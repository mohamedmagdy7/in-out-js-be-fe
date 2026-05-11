"use client";

import { apiClient } from "@/lib/auth/api-client";
import type {
  CompaniesListResponse,
  CompanyAdmin,
  CompanyConfig,
  CompanyRow,
  CompanyStats,
  PlatformStats,
} from "./types";

// ─── Platform ────────────────────────────────────────────

export async function fetchPlatformStats(): Promise<PlatformStats> {
  const res = await apiClient.get<PlatformStats>("/api/companies/platform/stats");
  return res.data;
}

// ─── Companies ───────────────────────────────────────────

export type CompanyListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: boolean;
};

export async function fetchCompanies(
  query: CompanyListQuery = {},
): Promise<CompaniesListResponse> {
  const params: Record<string, unknown> = {
    page: query.page ?? 1,
    limit: query.limit ?? 25,
  };
  if (query.search) params.search = query.search;
  if (query.is_active !== undefined) params.is_active = query.is_active;
  const res = await apiClient.get<CompaniesListResponse>("/api/companies", {
    params,
  });
  return res.data;
}

export async function fetchCompany(id: string): Promise<CompanyConfig> {
  const res = await apiClient.get<CompanyConfig>(`/api/companies/${id}`);
  return res.data;
}

export type CreateCompanyBody = {
  name: string;
  slug: string;
  timezone: string;
  daily_hours_threshold: number;
  weekend_days?: number[];
};

export async function createCompany(
  body: CreateCompanyBody,
): Promise<CompanyRow> {
  const res = await apiClient.post<CompanyRow>("/api/companies", body);
  return res.data;
}

export type UpdateCompanyBody = {
  name?: string;
  timezone?: string;
  daily_hours_threshold?: number;
  weekend_days?: number[];
  logo_url?: string | null;
  is_active?: boolean;
};

export async function updateCompany(
  id: string,
  body: UpdateCompanyBody,
): Promise<CompanyRow> {
  const res = await apiClient.patch<CompanyRow>(`/api/companies/${id}`, body);
  return res.data;
}

export async function deactivateCompany(id: string): Promise<void> {
  await apiClient.delete(`/api/companies/${id}`);
}

export async function reactivateCompany(id: string): Promise<CompanyRow> {
  return updateCompany(id, { is_active: true });
}

export async function fetchCompanyStats(id: string): Promise<CompanyStats> {
  const res = await apiClient.get<CompanyStats>(`/api/companies/${id}/stats`);
  return res.data;
}

// ─── HR admins of a company ─────────────────────────────

export async function fetchCompanyAdmins(
  companyId: string,
): Promise<CompanyAdmin[]> {
  const res = await apiClient.get<CompanyAdmin[]>(
    `/api/companies/${companyId}/admins`,
  );
  return res.data;
}

export type InviteAdminBody = {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
};

export async function inviteCompanyAdmin(
  companyId: string,
  body: InviteAdminBody,
): Promise<CompanyAdmin> {
  const res = await apiClient.post<CompanyAdmin>(
    `/api/companies/${companyId}/invite-admin`,
    body,
  );
  return res.data;
}

export async function setCompanyAdminActive(
  companyId: string,
  userId: string,
  isActive: boolean,
): Promise<CompanyAdmin> {
  const res = await apiClient.patch<CompanyAdmin>(
    `/api/companies/${companyId}/admins/${userId}`,
    { is_active: isActive },
  );
  return res.data;
}
