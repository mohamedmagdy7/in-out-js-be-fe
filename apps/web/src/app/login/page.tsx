"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock3 } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuthStore } from "@/lib/auth/auth-store";
import { getRoleHome } from "@/lib/auth/roles";
import { ThemeToggle } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  useEffect(() => {
    if (isInitialized && user) {
      router.replace(getRoleHome(user.role));
    }
  }, [isInitialized, user, router]);

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 grid-bg opacity-50"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[640px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/30">
            <Clock3 className="h-6 w-6" strokeWidth={2.25} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome back
            </h1>
            <p className="mt-1 text-sm text-foreground-muted">
              Sign in to continue to your workspace.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-lg sm:p-8">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-foreground-subtle">
          Trouble signing in? Contact your HR administrator.
        </p>
      </div>
    </main>
  );
}
