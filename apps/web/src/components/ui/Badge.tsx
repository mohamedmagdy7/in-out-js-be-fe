import { cn } from "@/lib/cn";

type Tone = "neutral" | "primary" | "success" | "warning" | "danger";

const TONE: Record<Tone, string> = {
  neutral: "bg-surface-muted text-foreground-muted border-border",
  primary: "bg-primary-soft text-primary-soft-foreground border-primary/20",
  success: "bg-success-soft text-success-soft-foreground border-success/30",
  warning: "bg-warning-soft text-warning-soft-foreground border-warning/30",
  danger: "bg-danger-soft text-danger-soft-foreground border-danger/30",
};

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone };

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide",
        TONE[tone],
        className,
      )}
      {...props}
    />
  );
}
