"use client";

import { useMemo } from "react";
import { cn } from "@/lib/cn";

type Props = { password: string };

type Strength = {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  tone: string;
};

function scorePassword(pw: string): Strength {
  if (!pw) return { score: 0, label: "Empty", tone: "bg-surface-muted" };
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const score = Math.min(4, s) as Strength["score"];
  const labels = ["Too weak", "Weak", "Fair", "Strong", "Very strong"];
  const tones = [
    "bg-danger",
    "bg-danger",
    "bg-warning",
    "bg-success",
    "bg-success",
  ];
  return { score, label: labels[score], tone: tones[score] };
}

export function PasswordStrength({ password }: Props) {
  const { score, label, tone } = useMemo(
    () => scorePassword(password),
    [password],
  );

  return (
    <div className="mt-1.5 flex items-center gap-2">
      <div className="flex flex-1 gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              i < score ? tone : "bg-surface-muted",
            )}
          />
        ))}
      </div>
      <span className="text-[11px] uppercase tracking-wider text-foreground-muted">
        {label}
      </span>
    </div>
  );
}
