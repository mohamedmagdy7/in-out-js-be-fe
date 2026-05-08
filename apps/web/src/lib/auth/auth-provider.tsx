"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "./auth-store";
import { refreshSession } from "./api-client";
import { fetchMe, logoutRequest } from "./auth-api";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const setLoading = useAuthStore((s) => s.setLoading);
  const setInitialized = useAuthStore((s) => s.setInitialized);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    (async () => {
      setLoading(true);
      try {
        const token = await refreshSession();
        if (!token) {
          clearAuth();
          return;
        }
        const user = await fetchMe();
        setAuth(user, token);
      } catch {
        clearAuth();
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    })();
  }, [setAuth, clearAuth, setLoading, setInitialized]);

  return <>{children}</>;
}

export async function logout() {
  try {
    await logoutRequest();
  } catch {
    // ignore network errors on logout
  }
  useAuthStore.getState().clearAuth();
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}
