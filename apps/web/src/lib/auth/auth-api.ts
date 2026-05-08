"use client";

import type { AuthUser } from "@repo/shared";
import { apiClient } from "./api-client";

export type LoginRequest = {
  email: string;
  password: string;
  company_slug?: string;
  remember_me?: boolean;
};

export type LoginResponse = {
  access_token: string;
  user: AuthUser;
};

export async function loginRequest(
  body: LoginRequest,
): Promise<LoginResponse> {
  const res = await apiClient.post<LoginResponse>("/api/auth/login", body);
  return res.data;
}

export async function logoutRequest(): Promise<void> {
  await apiClient.post("/api/auth/logout", {});
}

export async function fetchMe(): Promise<AuthUser> {
  const res = await apiClient.get<{ user: AuthUser }>("/api/auth/me");
  return res.data.user;
}
