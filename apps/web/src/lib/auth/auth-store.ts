"use client";

import { create } from "zustand";
import type { AuthUser } from "@repo/shared";

export type AuthStore = {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  setAccessToken: (token: string) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  accessToken: null,
  isLoading: false,
  isInitialized: false,
  setAuth: (user, token) =>
    set({ user, accessToken: token, isLoading: false }),
  setAccessToken: (token) => set({ accessToken: token }),
  setLoading: (loading) => set({ isLoading: loading }),
  setInitialized: (initialized) => set({ isInitialized: initialized }),
  clearAuth: () =>
    set({ user: null, accessToken: null, isLoading: false }),
}));

export function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken;
}

export function setAccessTokenDirect(token: string | null) {
  useAuthStore.setState({ accessToken: token });
}

export function clearAuthDirect() {
  useAuthStore.setState({
    user: null,
    accessToken: null,
    isLoading: false,
  });
}
