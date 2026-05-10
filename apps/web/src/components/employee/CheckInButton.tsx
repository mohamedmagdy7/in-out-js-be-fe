"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock3, LogIn, LogOut } from "lucide-react";
import { AxiosError } from "axios";
import { Spinner, toast } from "@/components/ui";
import { postCheckIn, postCheckOut } from "@/lib/api/attendance";
import { getCurrentCoords } from "@/lib/geolocation";
import { queryKeys } from "@/lib/query/keys";
import type { StatusResponse } from "@/lib/api/types";
import { formatMinutes, formatTime } from "@/lib/format";
import { cn } from "@/lib/cn";

type Props = {
  status: StatusResponse | undefined;
};

export function CheckInButton({ status }: Props) {
  const qc = useQueryClient();
  const [pending, setPending] = useState(false);

  const checkIn = useMutation({
    mutationFn: async () => {
      const coords = await getCurrentCoords();
      return postCheckIn({
        lat: coords?.lat,
        lng: coords?.lng,
      });
    },
    onSuccess: () => {
      toast.success("Checked in", "Have a productive day.");
      qc.invalidateQueries({ queryKey: queryKeys.attendance.status });
      qc.invalidateQueries({ queryKey: queryKeys.attendance.today });
      qc.invalidateQueries({ queryKey: ["attendance", "my"] });
    },
    onError: (err) => {
      const axiosErr = err as AxiosError<{ message?: string; error?: string }>;
      toast.error(
        "Check-in failed",
        axiosErr.response?.data?.message ??
          axiosErr.response?.data?.error ??
          "Please try again.",
      );
    },
  });

  const checkOut = useMutation({
    mutationFn: async () => {
      const coords = await getCurrentCoords();
      return postCheckOut({ lat: coords?.lat, lng: coords?.lng });
    },
    onSuccess: (data: { log?: { formatted?: { total_work_hours?: string } } }) => {
      const hours = data?.log?.formatted?.total_work_hours;
      toast.success(
        "Checked out",
        hours ? `Worked ${hours} today.` : undefined,
      );
      qc.invalidateQueries({ queryKey: queryKeys.attendance.status });
      qc.invalidateQueries({ queryKey: queryKeys.attendance.today });
      qc.invalidateQueries({ queryKey: ["attendance", "my"] });
    },
    onError: (err) => {
      const axiosErr = err as AxiosError<{ message?: string; error?: string }>;
      toast.error(
        "Check-out failed",
        axiosErr.response?.data?.message ??
          axiosErr.response?.data?.error ??
          "Please try again.",
      );
    },
  });

  const isCheckedIn = !!status?.is_checked_in;
  const elapsed = status?.active_session?.elapsed_minutes ?? 0;
  const isLoading = pending || checkIn.isPending || checkOut.isPending;

  const handleClick = async () => {
    if (isLoading) return;
    setPending(true);
    try {
      if (isCheckedIn) await checkOut.mutateAsync();
      else await checkIn.mutateAsync();
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-surface p-8 text-center shadow-sm sm:flex-row sm:text-left">
      <div
        className={cn(
          "relative flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full",
          isCheckedIn ? "bg-success/10 text-success" : "bg-primary-soft text-primary-soft-foreground",
        )}
      >
        <Clock3 className="h-9 w-9" strokeWidth={2} />
        {isCheckedIn ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-success" />
          </span>
        ) : null}
      </div>

      <div className="flex-1">
        <p className="text-xs uppercase tracking-wider text-foreground-subtle">
          {isCheckedIn ? "Currently checked in" : "Ready to start"}
        </p>
        <p className="mt-1 text-lg font-semibold">
          {isCheckedIn && status?.active_session ? (
            <>Since {formatTime(status.active_session.check_in_at)}</>
          ) : (
            "Not checked in"
          )}
        </p>
        <p className="mt-0.5 text-sm text-foreground-muted">
          {isCheckedIn
            ? `${formatMinutes(elapsed)} this session · ${formatMinutes(
                status?.today_total_minutes ?? 0,
              )} today`
            : status?.today_total_minutes
              ? `Already worked ${formatMinutes(status.today_total_minutes)} today.`
              : "Tap to start your day."}
        </p>
      </div>

      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className={cn(
          "inline-flex h-12 min-w-[140px] items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold transition-colors",
          "focus-ring",
          "disabled:cursor-not-allowed disabled:opacity-70",
          isCheckedIn
            ? "bg-danger text-danger-foreground hover:opacity-90"
            : "bg-success text-white hover:opacity-90",
        )}
      >
        {isLoading ? (
          <Spinner className="h-4 w-4 text-current" />
        ) : isCheckedIn ? (
          <LogOut className="h-4 w-4" />
        ) : (
          <LogIn className="h-4 w-4" />
        )}
        {isCheckedIn ? "Check out" : "Check in"}
      </button>
    </div>
  );
}
