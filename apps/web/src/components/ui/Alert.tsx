import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";

type Tone = "info" | "success" | "warning" | "danger";

const TONE: Record<
  Tone,
  { wrapper: string; icon: React.ComponentType<{ className?: string }> }
> = {
  info: {
    wrapper:
      "bg-primary-soft text-primary-soft-foreground border-primary/20",
    icon: Info,
  },
  success: {
    wrapper:
      "bg-success-soft text-success-soft-foreground border-success/30",
    icon: CheckCircle2,
  },
  warning: {
    wrapper:
      "bg-warning-soft text-warning-soft-foreground border-warning/30",
    icon: AlertTriangle,
  },
  danger: {
    wrapper:
      "bg-danger-soft text-danger-soft-foreground border-danger/30",
    icon: XCircle,
  },
};

type AlertProps = {
  tone?: Tone;
  title?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
};

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: AlertProps) {
  const Icon = TONE[tone].icon;
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded border px-3.5 py-3 text-sm animate-fade-in",
        TONE[tone].wrapper,
        className,
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />
      <div className="flex-1 leading-snug">
        {title ? <p className="font-medium">{title}</p> : null}
        {children ? <div className={title ? "mt-0.5" : ""}>{children}</div> : null}
      </div>
    </div>
  );
}
