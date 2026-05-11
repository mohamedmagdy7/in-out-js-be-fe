"use client";

import { apiClient } from "@/lib/auth/api-client";
import type {
  AttendanceStatus,
  CompanyConfig,
  CompanyStats,
  Department,
  LeaveRequest,
  LeaveRequestsForReviewerResponse,
  LeaveTypeFull,
  Pagination,
  Shift,
  TeamAttendanceLog,
  TeamMember,
  TeamMembersResponse,
} from "./types";

// ─── Employees ───────────────────────────────────────────

export type EmployeeListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  department_id?: string;
  shift_id?: string;
  role?: "EMPLOYEE" | "MANAGER" | "HR_ADMIN";
  is_active?: boolean;
};

export async function fetchEmployees(
  query: EmployeeListQuery = {},
): Promise<TeamMembersResponse> {
  const params: Record<string, unknown> = {
    page: query.page ?? 1,
    limit: query.limit ?? 25,
  };
  if (query.search) params.search = query.search;
  if (query.department_id) params.department_id = query.department_id;
  if (query.shift_id) params.shift_id = query.shift_id;
  if (query.role) params.role = query.role;
  if (query.is_active !== undefined) params.is_active = query.is_active;
  const res = await apiClient.get<TeamMembersResponse>("/api/employees", {
    params,
  });
  return res.data;
}

export type CreateEmployeeBody = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: "EMPLOYEE" | "MANAGER";
  department_id?: string;
  shift_id?: string;
  manager_id?: string;
  phone?: string;
};

export async function createEmployee(
  body: CreateEmployeeBody,
): Promise<TeamMember> {
  const res = await apiClient.post<TeamMember>("/api/employees", body);
  return res.data;
}

export async function fetchEmployee(id: string): Promise<TeamMember> {
  const res = await apiClient.get<TeamMember>(`/api/employees/${id}`);
  return res.data;
}

export type UpdateEmployeeBody = {
  first_name?: string;
  last_name?: string;
  phone?: string | null;
  department_id?: string | null;
  shift_id?: string | null;
  manager_id?: string | null;
  is_active?: boolean;
};

export async function updateEmployee(
  id: string,
  body: UpdateEmployeeBody,
): Promise<TeamMember> {
  const res = await apiClient.patch<TeamMember>(`/api/employees/${id}`, body);
  return res.data;
}

export async function deactivateEmployee(id: string): Promise<void> {
  await apiClient.delete(`/api/employees/${id}`);
}

export async function resetEmployeePassword(
  id: string,
  newPassword: string,
): Promise<void> {
  await apiClient.patch(`/api/employees/${id}/reset-password`, {
    new_password: newPassword,
  });
}

// ─── Departments ─────────────────────────────────────────

export async function fetchDepartments(): Promise<Department[]> {
  const res = await apiClient.get<Department[]>("/api/departments");
  return res.data;
}

export async function createDepartment(name: string): Promise<Department> {
  const res = await apiClient.post<Department>("/api/departments", { name });
  return res.data;
}

export async function updateDepartment(
  id: string,
  name: string,
): Promise<Department> {
  const res = await apiClient.patch<Department>(`/api/departments/${id}`, {
    name,
  });
  return res.data;
}

export async function deleteDepartment(id: string): Promise<void> {
  await apiClient.delete(`/api/departments/${id}`);
}

// ─── Shifts ──────────────────────────────────────────────

export async function fetchShifts(): Promise<Shift[]> {
  const res = await apiClient.get<Shift[]>("/api/shifts");
  return res.data;
}

export type ShiftBody = {
  name: string;
  start_time: string;
  end_time: string;
  is_default?: boolean;
};

export async function createShift(body: ShiftBody): Promise<Shift> {
  const res = await apiClient.post<Shift>("/api/shifts", body);
  return res.data;
}

export async function updateShift(
  id: string,
  body: Partial<ShiftBody>,
): Promise<Shift> {
  const res = await apiClient.patch<Shift>(`/api/shifts/${id}`, body);
  return res.data;
}

export async function deleteShift(id: string): Promise<void> {
  await apiClient.delete(`/api/shifts/${id}`);
}

// ─── Leave types ─────────────────────────────────────────

export async function fetchLeaveTypes(): Promise<LeaveTypeFull[]> {
  const res = await apiClient.get<LeaveTypeFull[]>("/api/leave/types");
  return res.data;
}

export type LeaveTypeBody = {
  name: string;
  days_per_year: number;
  is_paid: boolean;
};

export async function createLeaveType(
  body: LeaveTypeBody,
): Promise<LeaveTypeFull> {
  const res = await apiClient.post<LeaveTypeFull>("/api/leave/types", body);
  return res.data;
}

export async function updateLeaveType(
  id: string,
  body: Partial<LeaveTypeBody>,
): Promise<LeaveTypeFull> {
  const res = await apiClient.patch<LeaveTypeFull>(
    `/api/leave/types/${id}`,
    body,
  );
  return res.data;
}

export async function deleteLeaveType(id: string): Promise<void> {
  await apiClient.delete(`/api/leave/types/${id}`);
}

// ─── Company-wide attendance ─────────────────────────────

export type CompanyAttendanceQuery = {
  from?: string;
  to?: string;
  status?: AttendanceStatus;
  employee_id?: string;
  department_id?: string;
  page?: number;
  limit?: number;
};

export type CompanyAttendanceResponse = {
  data: TeamAttendanceLog[];
  pagination: Pagination;
};

export async function fetchCompanyAttendance(
  query: CompanyAttendanceQuery = {},
): Promise<CompanyAttendanceResponse> {
  const res = await apiClient.get<CompanyAttendanceResponse>(
    "/api/attendance/company",
    { params: query },
  );
  return res.data;
}

export type AdminMarkBody = {
  user_id: string;
  date: string;
  status: AttendanceStatus;
  notes?: string;
};

export async function adminMarkAttendance(body: AdminMarkBody) {
  const res = await apiClient.post("/api/attendance/admin/mark", body);
  return res.data;
}

export type AdminEditLogBody = {
  status?: AttendanceStatus;
  notes?: string;
};

export async function adminEditLog(id: string, body: AdminEditLogBody) {
  const res = await apiClient.patch(`/api/attendance/admin/logs/${id}`, body);
  return res.data;
}

export type AdminEditSessionBody = {
  check_in_at?: string;
  check_out_at?: string;
};

export async function adminEditSession(
  id: string,
  body: AdminEditSessionBody,
) {
  const res = await apiClient.patch(
    `/api/attendance/admin/sessions/${id}`,
    body,
  );
  return res.data;
}

export async function adminDeleteSession(id: string) {
  const res = await apiClient.delete(`/api/attendance/admin/sessions/${id}`);
  return res.data;
}

// ─── Leave requests (HR Admin) ───────────────────────────

export type AdminLeaveListQuery = {
  status?: "PENDING" | "APPROVED" | "REJECTED";
  employee_id?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};

export async function fetchAllLeaveRequests(
  query: AdminLeaveListQuery = {},
): Promise<LeaveRequestsForReviewerResponse> {
  const res = await apiClient.get<LeaveRequestsForReviewerResponse>(
    "/api/leave/requests/all",
    { params: query },
  );
  return res.data;
}

export async function cancelLeaveRequest(id: string): Promise<void> {
  await apiClient.delete(`/api/leave/requests/${id}`);
}

// ─── Reports (HR Admin) ──────────────────────────────────

export type OvertimeReportRow = {
  user: {
    id: string;
    full_name: string;
    department: string | null;
  };
  total_overtime_minutes: number;
  formatted_overtime: string;
  overtime_days: number;
};

export type OvertimeReportResponse = {
  employees: OvertimeReportRow[];
};

export type OvertimeReportQuery = {
  from: string;
  to: string;
  department_id?: string;
  min_hours?: number;
};

export async function fetchOvertimeReport(
  query: OvertimeReportQuery,
): Promise<OvertimeReportResponse> {
  const res = await apiClient.get<OvertimeReportResponse>(
    "/api/reports/overtime",
    { params: query },
  );
  return res.data;
}

export type LeaveReportRow = {
  user: {
    id: string;
    full_name: string;
    department: string | null;
  };
  balances: Array<{
    type: string;
    used: number;
    pending: number;
    remaining: number;
  }>;
};

export type LeaveReportResponse = {
  year: number;
  employees: LeaveReportRow[];
};

export type LeaveReportQuery = {
  year: number;
  department_id?: string;
  leave_type_id?: string;
};

export async function fetchLeaveReport(
  query: LeaveReportQuery,
): Promise<LeaveReportResponse> {
  const res = await apiClient.get<LeaveReportResponse>("/api/reports/leave", {
    params: query,
  });
  return res.data;
}

// ─── Company settings ────────────────────────────────────

export async function fetchMyCompany(): Promise<CompanyConfig> {
  const res = await apiClient.get<CompanyConfig>("/api/companies/me");
  return res.data;
}

export type UpdateCompanyBody = {
  name?: string;
  timezone?: string;
  daily_hours_threshold?: number;
  weekend_days?: number[];
  logo_url?: string | null;
};

export async function updateMyCompany(
  body: UpdateCompanyBody,
): Promise<CompanyConfig> {
  const res = await apiClient.patch<CompanyConfig>("/api/companies/me", body);
  return res.data;
}

export async function fetchMyCompanyStats(): Promise<CompanyStats> {
  const res = await apiClient.get<CompanyStats>("/api/companies/me/stats");
  return res.data;
}

// ─── Re-export the shared LeaveRequest type for convenience ──
export type { LeaveRequest };
