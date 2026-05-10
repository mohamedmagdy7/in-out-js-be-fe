"use client";

import { MapPin } from "lucide-react";
import type { AttendanceLog } from "@/lib/api/types";
import { AttendanceBadge, Modal } from "@/components/ui";
import { formatDate, formatMinutes, formatTime } from "@/lib/format";

type Props = {
  open: boolean;
  onClose: () => void;
  date: Date | null;
  log: AttendanceLog | undefined;
};

export function DayDetailModal({ open, onClose, date, log }: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={date ? formatDate(date) : "Day"}
      description={
        log ? (
          <span className="inline-flex items-center gap-2">
            <AttendanceBadge status={log.status} />
            {log.is_live ? (
              <span className="text-xs text-foreground-subtle">In progress</span>
            ) : null}
          </span>
        ) : (
          "No record for this day."
        )
      }
    >
      {!log ? (
        <p className="text-sm text-foreground-muted">
          Nothing was logged on this date.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Metric label="Work" value={formatMinutes(log.total_work_minutes)} />
            <Metric label="Overtime" value={formatMinutes(log.overtime_minutes)} />
            <Metric label="Sessions" value={String(log.sessions.length)} />
          </div>

          {log.sessions.length === 0 ? (
            <p className="rounded border border-dashed border-border bg-surface-muted/40 px-3 py-3 text-xs text-foreground-muted">
              No check-in sessions for this day.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {log.sessions.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between rounded-md border border-border bg-surface-muted/40 px-3 py-2 text-sm"
                >
                  <div className="tabular-nums">
                    <span className="font-medium">
                      {formatTime(s.check_in_at)}
                    </span>
                    <span className="mx-2 text-foreground-subtle">→</span>
                    <span className="font-medium">
                      {s.check_out_at ? formatTime(s.check_out_at) : "Ongoing"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {(s.check_in_lat || s.check_in_lng) ? (
                      <span
                        className="inline-flex items-center gap-1 text-xs text-foreground-subtle"
                        title={`${s.check_in_lat?.toFixed(4)}, ${s.check_in_lng?.toFixed(4)}`}
                      >
                        <MapPin className="h-3 w-3" />
                        GPS
                      </span>
                    ) : null}
                    <span className="text-xs font-medium tabular-nums">
                      {s.formatted_duration ??
                        (s.duration_minutes
                          ? formatMinutes(s.duration_minutes)
                          : "—")}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Modal>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-surface-muted/30 px-3 py-2.5">
      <p className="text-[11px] uppercase tracking-wider text-foreground-subtle">
        {label}
      </p>
      <p className="mt-0.5 text-base font-semibold tabular-nums">{value}</p>
    </div>
  );
}
