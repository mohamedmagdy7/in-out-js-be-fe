"use client";

import { apiClient } from "@/lib/auth/api-client";
import type {
  AttendanceListResponse,
  AttendanceStatus,
  StatusResponse,
  TodayResponse,
} from "./types";

export type CheckInBody = { lat?: number; lng?: number; notes?: string };
export type CheckOutBody = { lat?: number; lng?: number };

export async function fetchStatus(): Promise<StatusResponse> {
  const res = await apiClient.get<StatusResponse>("/api/attendance/status");
  return res.data;
}

export async function fetchToday(): Promise<TodayResponse> {
  const res = await apiClient.get<TodayResponse>("/api/attendance/today");
  return res.data;
}

export async function postCheckIn(body: CheckInBody) {
  const res = await apiClient.post("/api/attendance/check-in", body);
  return res.data;
}

export async function postCheckOut(body: CheckOutBody) {
  const res = await apiClient.post("/api/attendance/check-out", body);
  return res.data;
}

export type AttendanceQuery = {
  from?: string;
  to?: string;
  status?: AttendanceStatus;
  page?: number;
  limit?: number;
};

export async function fetchMyAttendance(
  query: AttendanceQuery = {},
): Promise<AttendanceListResponse> {
  const res = await apiClient.get<AttendanceListResponse>("/api/attendance/my", {
    params: query,
  });
  return res.data;
}
