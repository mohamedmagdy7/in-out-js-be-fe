"use client";

import { apiClient } from "@/lib/auth/api-client";
import type {
  AttendanceReportResponse,
  AttendanceStatus,
  LeaveRequest,
  LeaveRequestsForReviewerResponse,
  ReportsSummary,
  TeamAttendanceResponse,
  TeamMembersResponse,
} from "./types";

// ─── Team ────────────────────────────────────────────────

export type TeamQuery = {
  department_id?: string;
  page?: number;
  limit?: number;
  search?: string;
  is_active?: boolean;
};

export async function fetchTeamMembers(
  query: TeamQuery = {},
): Promise<TeamMembersResponse> {
  const params: Record<string, unknown> = {
    page: query.page ?? 1,
    limit: query.limit ?? 100,
  };
  if (query.department_id) params.department_id = query.department_id;
  if (query.search) params.search = query.search;
  if (query.is_active !== undefined) params.is_active = query.is_active;

  const res = await apiClient.get<TeamMembersResponse>("/api/employees", {
    params,
  });
  return res.data;
}

export type TeamAttendanceQuery = {
  from?: string;
  to?: string;
  status?: AttendanceStatus;
  employee_id?: string;
  page?: number;
  limit?: number;
};

export async function fetchTeamAttendance(
  query: TeamAttendanceQuery = {},
): Promise<TeamAttendanceResponse> {
  const res = await apiClient.get<TeamAttendanceResponse>(
    "/api/attendance/team",
    { params: query },
  );
  return res.data;
}

// ─── Leave (manager-side) ────────────────────────────────

export type LeaveListQuery = {
  status?: "PENDING" | "APPROVED" | "REJECTED";
  page?: number;
  limit?: number;
};

export async function fetchTeamLeaveRequests(
  query: LeaveListQuery = {},
): Promise<LeaveRequestsForReviewerResponse> {
  const res = await apiClient.get<LeaveRequestsForReviewerResponse>(
    "/api/leave/requests/pending",
    { params: query },
  );
  return res.data;
}

export async function approveLeaveRequest(
  id: string,
): Promise<LeaveRequest> {
  const res = await apiClient.patch<LeaveRequest>(
    `/api/leave/requests/${id}/approve`,
  );
  return res.data;
}

export async function rejectLeaveRequest(
  id: string,
  reason: string,
): Promise<LeaveRequest> {
  const res = await apiClient.patch<LeaveRequest>(
    `/api/leave/requests/${id}/reject`,
    { reason },
  );
  return res.data;
}

// ─── Reports ─────────────────────────────────────────────

export async function fetchReportsSummary(): Promise<ReportsSummary> {
  const res = await apiClient.get<ReportsSummary>("/api/reports/summary");
  return res.data;
}

export type AttendanceReportQuery = {
  from: string;
  to: string;
  department_id?: string;
  employee_id?: string;
  status?: AttendanceStatus;
};

export async function fetchAttendanceReport(
  query: AttendanceReportQuery,
): Promise<AttendanceReportResponse> {
  const res = await apiClient.get<AttendanceReportResponse>(
    "/api/reports/attendance",
    { params: query },
  );
  return res.data;
}

export async function exportAttendanceCsv(
  body: AttendanceReportQuery,
): Promise<Blob> {
  const res = await apiClient.post("/api/reports/export/csv", body, {
    responseType: "blob",
  });
  return res.data as Blob;
}

export async function exportAttendancePdf(
  body: AttendanceReportQuery,
): Promise<Blob> {
  const res = await apiClient.post("/api/reports/export/pdf", body, {
    responseType: "blob",
  });
  return res.data as Blob;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
