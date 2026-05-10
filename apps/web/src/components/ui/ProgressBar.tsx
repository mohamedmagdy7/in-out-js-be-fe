import { cn } from "@/lib/cn";

type Tone = "primary" | "success" | "warning" | "danger";

const TONE: Record<Tone, string> = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

type ProgressBarProps = {
  value: number;
  max?: number;
  tone?: Tone;
  className?: string;
};

export function ProgressBar({
  value,
  max = 100,
  tone = "primary",
  className,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, max === 0 ? 0 : (value / max) * 100));
  return (
    <div
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-surface-muted",
        className,
      )}
    >
      <div
        className={cn("h-full rounded-full transition-all", TONE[tone])}
        style={{ width: `${pct}%` }}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        role="progressbar"
      />
    </div>
  );
}
