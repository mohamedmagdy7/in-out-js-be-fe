"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Info, XCircle, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/cn";

type Tone = "success" | "danger" | "info" | "warning";

type Toast = {
  id: number;
  tone: Tone;
  title: string;
  description?: string;
};

const ICON: Record<Tone, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle2,
  danger: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const TONE_CLASS: Record<Tone, string> = {
  success: "text-success",
  danger: "text-danger",
  info: "text-primary",
  warning: "text-warning",
};

let pushImpl: ((t: Omit<Toast, "id">) => void) | null = null;
let counter = 0;

export const toast = {
  success: (title: string, description?: string) =>
    pushImpl?.({ tone: "success", title, description }),
  error: (title: string, description?: string) =>
    pushImpl?.({ tone: "danger", title, description }),
  info: (title: string, description?: string) =>
    pushImpl?.({ tone: "info", title, description }),
  warning: (title: string, description?: string) =>
    pushImpl?.({ tone: "warning", title, description }),
};

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    pushImpl = (t) => {
      const id = ++counter;
      setToasts((prev) => [...prev, { id, ...t }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== id));
      }, 4500);
    };
    return () => {
      pushImpl = null;
    };
  }, []);

  const dismiss = (id: number) =>
    setToasts((prev) => prev.filter((x) => x.id !== id));

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => {
        const Icon = ICON[t.tone];
        return (
          <div
            key={t.id}
            role="status"
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded border border-border bg-surface px-4 py-3 shadow-lg animate-fade-in",
            )}
          >
            <Icon className={cn("mt-0.5 h-4 w-4 flex-shrink-0", TONE_CLASS[t.tone])} />
            <div className="flex-1 leading-snug">
              <p className="text-sm font-medium text-foreground">{t.title}</p>
              {t.description ? (
                <p className="mt-0.5 text-xs text-foreground-muted">
                  {t.description}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => dismiss(t.id)}
              className="text-foreground-subtle transition hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
