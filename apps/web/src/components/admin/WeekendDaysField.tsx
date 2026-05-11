"use client";

import { Button, Checkbox, FieldError, Label } from "@/components/ui";

const DAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
] as const;

const PRESETS: Array<{ label: string; value: number[] }> = [
  { label: "Fri + Sat", value: [5, 6] },
  { label: "Sat + Sun", value: [0, 6] },
  { label: "Sat only", value: [6] },
];

type Props = {
  value: number[];
  onChange: (next: number[]) => void;
  error?: string | null;
};

export function WeekendDaysField({ value, onChange, error }: Props) {
  const working = 7 - value.length;
  const lowWarning = working > 0 && working < 2;
  const allWeekend = value.length >= 7;

  const toggle = (day: number) => {
    if (value.includes(day)) {
      onChange(value.filter((d) => d !== day));
    } else {
      onChange([...value, day].sort((a, b) => a - b));
    }
  };

  return (
    <div className="flex flex-col gap-2.5">
      <Label>Weekend days</Label>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
        {DAYS.map((d) => (
          <Checkbox
            key={d.value}
            id={`wknd-${d.value}`}
            label={d.label}
            checked={value.includes(d.value)}
            onChange={() => toggle(d.value)}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-wider text-foreground-subtle">
          Presets
        </span>
        {PRESETS.map((p) => (
          <Button
            key={p.label}
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onChange([...p.value])}
          >
            {p.label}
          </Button>
        ))}
      </div>

      {allWeekend ? (
        <FieldError>
          At least one day must remain as a working day.
        </FieldError>
      ) : error ? (
        <FieldError>{error}</FieldError>
      ) : lowWarning ? (
        <p className="text-xs text-warning-soft-foreground">
          Warning: employees will have very few working days per week.
        </p>
      ) : null}
    </div>
  );
}
