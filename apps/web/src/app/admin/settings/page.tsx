"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  fetchMyCompany,
  updateMyCompany,
  type UpdateCompanyBody,
} from "@/lib/api/admin";
import { queryKeys } from "@/lib/query/keys";
import {
  Button,
  CenteredSpinner,
  FieldError,
  Input,
  Label,
  Select,
  toast,
} from "@/components/ui";
import { WeekendDaysField } from "@/components/admin/WeekendDaysField";

const COMMON_TIMEZONES = [
  "UTC",
  "Africa/Cairo",
  "Africa/Lagos",
  "Africa/Nairobi",
  "Africa/Johannesburg",
  "Asia/Dubai",
  "Asia/Riyadh",
  "Asia/Tehran",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Istanbul",
  "Europe/Moscow",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
];

export default function AdminSettingsPage() {
  const qc = useQueryClient();
  const companyQuery = useQuery({
    queryKey: queryKeys.admin.company,
    queryFn: fetchMyCompany,
  });

  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [threshold, setThreshold] = useState("8");
  const [weekendDays, setWeekendDays] = useState<number[]>([5, 6]);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!companyQuery.data) return;
    setName(companyQuery.data.name);
    setTimezone(companyQuery.data.timezone);
    setThreshold(String(companyQuery.data.daily_hours_threshold));
    setWeekendDays(companyQuery.data.weekend_days);
    setTouched(false);
  }, [companyQuery.data]);

  const mutation = useMutation({
    mutationFn: (body: UpdateCompanyBody) => updateMyCompany(body),
    onSuccess: (next) => {
      toast.success("Settings saved");
      qc.setQueryData(queryKeys.admin.company, next);
      setTouched(false);
    },
    onError: (err) => {
      const axiosErr = err as AxiosError<{ message?: string; error?: string }>;
      toast.error(
        "Could not save",
        axiosErr.response?.data?.message ??
          axiosErr.response?.data?.error ??
          "Please try again.",
      );
    },
  });

  const submit = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Company name is required";
    const t = Number(threshold);
    if (!Number.isFinite(t) || t <= 0) {
      next.threshold = "Must be a positive number";
    }
    if (weekendDays.length >= 7) {
      next.weekend = "Cannot mark all 7 days as weekend";
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    mutation.mutate({
      name: name.trim(),
      timezone,
      daily_hours_threshold: t,
      weekend_days: weekendDays,
    });
  };

  const onAnyChange = () => {
    if (!touched) setTouched(true);
  };

  if (companyQuery.isLoading || !companyQuery.data) {
    return (
      <div className="rounded-lg border border-border bg-surface shadow-sm">
        <CenteredSpinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Company settings
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Changes apply to all employees and any time calculations going
          forward.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex flex-col gap-6 rounded-lg border border-border bg-surface p-5 shadow-sm"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="cs-name">Company name</Label>
            <Input
              id="cs-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                onAnyChange();
              }}
              invalid={!!errors.name}
            />
            {errors.name ? <FieldError>{errors.name}</FieldError> : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cs-tz">Timezone</Label>
            <Select
              id="cs-tz"
              value={timezone}
              onChange={(e) => {
                setTimezone(e.target.value);
                onAnyChange();
              }}
            >
              {COMMON_TIMEZONES.includes(timezone) ? null : (
                <option value={timezone}>{timezone}</option>
              )}
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </Select>
            <span className="text-xs text-foreground-muted">
              Used for all time displays across the app.
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cs-threshold">Daily hours threshold</Label>
            <Input
              id="cs-threshold"
              type="number"
              step="0.25"
              min="0.25"
              value={threshold}
              onChange={(e) => {
                setThreshold(e.target.value);
                onAnyChange();
              }}
              invalid={!!errors.threshold}
            />
            {errors.threshold ? (
              <FieldError>{errors.threshold}</FieldError>
            ) : (
              <span className="text-xs text-foreground-muted">
                Hours worked beyond this count as overtime.
              </span>
            )}
          </div>
        </div>

        <WeekendDaysField
          value={weekendDays}
          error={errors.weekend ?? null}
          onChange={(next) => {
            setWeekendDays(next);
            onAnyChange();
          }}
        />

        <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (!companyQuery.data) return;
              setName(companyQuery.data.name);
              setTimezone(companyQuery.data.timezone);
              setThreshold(String(companyQuery.data.daily_hours_threshold));
              setWeekendDays(companyQuery.data.weekend_days);
              setTouched(false);
              setErrors({});
            }}
            disabled={!touched || mutation.isPending}
          >
            Discard
          </Button>
          <Button
            type="submit"
            loading={mutation.isPending}
            disabled={!touched || weekendDays.length >= 7}
          >
            Save changes
          </Button>
        </div>
      </form>
    </div>
  );
}
