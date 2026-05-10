"use client";

import { apiClient } from "@/lib/auth/api-client";
import type { Profile } from "./types";

export async function fetchProfile(): Promise<Profile> {
  const res = await apiClient.get<{ profile: Profile }>("/api/auth/profile");
  return res.data.profile;
}

export type UpdateProfileBody = {
  first_name?: string;
  last_name?: string;
  phone?: string | null;
};

export async function updateProfile(body: UpdateProfileBody): Promise<Profile> {
  const res = await apiClient.patch<{ profile: Profile }>(
    "/api/auth/profile",
    body,
  );
  return res.data.profile;
}

export type ChangePasswordBody = {
  current_password: string;
  new_password: string;
};

export async function changePassword(body: ChangePasswordBody) {
  const res = await apiClient.post("/api/auth/change-password", body);
  return res.data;
}
