"use client";

type Props = {
  total: number;
  checkedIn: number;
  notIn: number;
  late: number;
  onLeave: number;
};

const ITEMS: Array<{
  key: keyof Omit<Props, "total">;
  label: string;
  tone: string;
}> = [
  { key: "checkedIn", label: "Checked in", tone: "text-success" },
  { key: "notIn", label: "Not in", tone: "text-foreground-subtle" },
  { key: "late", label: "Late", tone: "text-warning" },
  { key: "onLeave", label: "On leave", tone: "text-primary" },
];

export function TeamSummaryBar(props: Props) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-border bg-surface px-5 py-3 shadow-sm">
      <div className="flex items-baseline gap-1.5">
        <span className="text-xs uppercase tracking-wider text-foreground-subtle">
          Team
        </span>
        <span className="text-lg font-semibold tabular-nums">
          {props.total}
        </span>
      </div>
      <div className="hidden h-4 w-px bg-border sm:block" />
      {ITEMS.map(({ key, label, tone }) => (
        <div key={key} className="flex items-baseline gap-1.5">
          <span className="text-xs uppercase tracking-wider text-foreground-subtle">
            {label}
          </span>
          <span className={`text-lg font-semibold tabular-nums ${tone}`}>
            {props[key]}
          </span>
        </div>
      ))}
    </div>
  );
}
