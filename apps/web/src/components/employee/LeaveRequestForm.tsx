"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarPlus } from "lucide-react";
import { AxiosError } from "axios";
import {
  Alert,
  Button,
  FieldError,
  FieldHint,
  Label,
  Input,
  Select,
  Textarea,
  toast,
} from "@/components/ui";
import {
  fetchLeaveTypes,
  createLeaveRequest,
} from "@/lib/api/leave";
import { fetchProfile } from "@/lib/api/profile";
import type { LeaveBalanceResponse } from "@/lib/api/types";
import { queryKeys } from "@/lib/query/keys";
import { computeWorkingDays } from "@/lib/working-days";

const schema = z
  .object({
    leave_type_id: z.string().min(1, "Pick a leave type"),
    start_date: z.string().min(1, "Start date is required"),
    end_date: z.string().min(1, "End date is required"),
    reason: z.string().max(500).optional(),
  })
  .refine((v) => v.start_date <= v.end_date, {
    message: "End date must be on or after the start date",
    path: ["end_date"],
  });

type FormValues = z.infer<typeof schema>;

type Props = { balance: LeaveBalanceResponse | undefined };

export function LeaveRequestForm({ balance }: Props) {
  const qc = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const typesQuery = useQuery({
    queryKey: queryKeys.leave.types,
    queryFn: fetchLeaveTypes,
  });
  const profileQuery = useQuery({
    queryKey: queryKeys.profile,
    queryFn: fetchProfile,
  });
  const weekendDays = profileQuery.data?.company?.weekend_days ?? [5, 6];

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      leave_type_id: "",
      start_date: "",
      end_date: "",
      reason: "",
    },
  });

  const startDate = watch("start_date");
  const endDate = watch("end_date");
  const leaveTypeId = watch("leave_type_id");

  const workingDays = useMemo(
    () => computeWorkingDays(startDate, endDate, weekendDays),
    [startDate, endDate, weekendDays],
  );

  const selectedBalance = useMemo(() => {
    if (!balance || !leaveTypeId) return null;
    return balance.balances.find((b) => b.leave_type.id === leaveTypeId) ?? null;
  }, [balance, leaveTypeId]);

  const insufficientBalance =
    !!selectedBalance && workingDays > 0 && workingDays > selectedBalance.days_remaining;

  const mutation = useMutation({
    mutationFn: createLeaveRequest,
    onSuccess: () => {
      toast.success("Leave request submitted");
      reset({
        leave_type_id: "",
        start_date: "",
        end_date: "",
        reason: "",
      });
      qc.invalidateQueries({ queryKey: queryKeys.leave.balance });
      qc.invalidateQueries({ queryKey: ["leave", "requests"] });
    },
    onError: (err) => {
      const axiosErr = err as AxiosError<{
        message?: string;
        error?: string;
        remaining?: number;
      }>;
      const remaining = axiosErr.response?.data?.remaining;
      setServerError(
        axiosErr.response?.data?.message ??
          axiosErr.response?.data?.error ??
          (remaining !== undefined
            ? `Only ${remaining} days remaining.`
            : "Could not submit leave request."),
      );
    },
  });

  // Clear server error when the user edits anything
  useEffect(() => {
    setServerError(null);
  }, [leaveTypeId, startDate, endDate]);

  const onSubmit = (values: FormValues) => {
    if (insufficientBalance) {
      setServerError("Insufficient leave balance for the selected range.");
      return;
    }
    setServerError(null);
    mutation.mutate({
      leave_type_id: values.leave_type_id,
      start_date: values.start_date,
      end_date: values.end_date,
      reason: values.reason?.trim() || undefined,
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-soft text-primary-soft-foreground">
          <CalendarPlus className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-sm font-semibold">Request leave</h3>
          <p className="text-xs text-foreground-muted">
            Working days are computed automatically.
          </p>
        </div>
      </div>

      {serverError ? <Alert tone="danger">{serverError}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="leave_type_id">Leave type</Label>
          <Select
            id="leave_type_id"
            invalid={!!errors.leave_type_id}
            {...register("leave_type_id")}
          >
            <option value="">Select…</option>
            {typesQuery.data?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} {t.is_paid ? "" : "(unpaid)"}
              </option>
            ))}
          </Select>
          {errors.leave_type_id ? (
            <FieldError>{errors.leave_type_id.message}</FieldError>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="start_date">Start date</Label>
          <Input
            id="start_date"
            type="date"
            invalid={!!errors.start_date}
            {...register("start_date")}
          />
          {errors.start_date ? (
            <FieldError>{errors.start_date.message}</FieldError>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="end_date">End date</Label>
          <Input
            id="end_date"
            type="date"
            invalid={!!errors.end_date}
            {...register("end_date")}
          />
          {errors.end_date ? (
            <FieldError>{errors.end_date.message}</FieldError>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-md border border-dashed border-border bg-surface-muted/50 px-3 py-2 text-sm">
        <span className="text-foreground-muted">Working days</span>
        <span className="font-semibold tabular-nums">
          {workingDays > 0 ? `${workingDays} day${workingDays === 1 ? "" : "s"}` : "—"}
        </span>
        {selectedBalance ? (
          <span
            className={
              insufficientBalance
                ? "ml-auto text-xs font-medium text-danger"
                : "ml-auto text-xs text-foreground-muted"
            }
          >
            {insufficientBalance
              ? `Insufficient — only ${selectedBalance.days_remaining} remaining`
              : `${selectedBalance.days_remaining} days remaining`}
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <Label htmlFor="reason">Reason</Label>
          <span className="text-xs text-foreground-subtle">Optional</span>
        </div>
        <Textarea
          id="reason"
          placeholder="Brief context for the reviewer (optional)"
          {...register("reason")}
        />
        <FieldHint>500 characters max.</FieldHint>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          loading={isSubmitting || mutation.isPending}
          disabled={insufficientBalance}
        >
          Submit request
        </Button>
      </div>
    </form>
  );
}
