"use client";

import { apiClient } from "@/lib/auth/api-client";
import type {
  LeaveBalanceResponse,
  LeaveRequest,
  LeaveRequestsResponse,
  LeaveType,
} from "./types";

export async function fetchLeaveTypes(): Promise<LeaveType[]> {
  const res = await apiClient.get<LeaveType[]>("/api/leave/types");
  return res.data;
}

export async function fetchLeaveBalance(): Promise<LeaveBalanceResponse> {
  const res = await apiClient.get<LeaveBalanceResponse>("/api/leave/balance");
  return res.data;
}

export type MyLeaveQuery = {
  status?: "PENDING" | "APPROVED" | "REJECTED";
  page?: number;
  limit?: number;
};

export async function fetchMyLeaveRequests(
  query: MyLeaveQuery = {},
): Promise<LeaveRequestsResponse> {
  const res = await apiClient.get<LeaveRequestsResponse>(
    "/api/leave/requests",
    { params: query },
  );
  return res.data;
}

export type CreateLeaveBody = {
  leave_type_id: string;
  start_date: string;
  end_date: string;
  reason?: string;
};

export async function createLeaveRequest(
  body: CreateLeaveBody,
): Promise<LeaveRequest> {
  const res = await apiClient.post<LeaveRequest>(
    "/api/leave/requests",
    body,
  );
  return res.data;
}

export async function cancelLeaveRequest(id: string) {
  const res = await apiClient.delete(`/api/leave/requests/${id}`);
  return res.data;
}
