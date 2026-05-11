"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  adminDeleteSession,
  adminEditLog,
  adminEditSession,
} from "@/lib/api/admin";
import {
  Button,
  IconButton,
  Input,
  Label,
  Modal,
  Select,
  toast,
} from "@/components/ui";
import type {
  AttendanceSession,
  AttendanceStatus,
  TeamAttendanceLog,
} from "@/lib/api/types";

type Props = {
  log: TeamAttendanceLog | null;
  onClose: () => void;
};

const STATUS_OPTIONS: AttendanceStatus[] = [
  "PRESENT",
  "ABSENT",
  "LATE",
  "HALF_DAY",
  "ON_LEAVE",
];

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(local: string): string | null {
  if (!local) return null;
  return new Date(local).toISOString();
}

export function AttendanceOverrideModal({ log, onClose }: Props) {
  const open = log !== null;
  const qc = useQueryClient();
  const [status, setStatus] = useState<AttendanceStatus>("PRESENT");

  useEffect(() => {
    if (log) setStatus(log.status);
  }, [log]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "attendance"] });
    qc.invalidateQueries({ queryKey: ["admin", "summary"] });
  };

  const statusMutation = useMutation({
    mutationFn: (next: AttendanceStatus) =>
      adminEditLog(log!.id, { status: next }),
    onSuccess: () => {
      toast.success("Status updated");
      invalidate();
    },
    onError: errorToast("Could not update"),
  });

  const sessionMutation = useMutation({
    mutationFn: ({
      id,
      check_in_at,
      check_out_at,
    }: {
      id: string;
      check_in_at?: string;
      check_out_at?: string;
    }) =>
      adminEditSession(id, {
        check_in_at,
        check_out_at,
      }),
    onSuccess: () => {
      toast.success("Session updated");
      invalidate();
    },
    onError: errorToast("Could not update session"),
  });

  const deleteSessionMutation = useMutation({
    mutationFn: (id: string) => adminDeleteSession(id),
    onSuccess: () => {
      toast.success("Session removed");
      invalidate();
    },
    onError: errorToast("Could not delete session"),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Override attendance"
      description={
        log
          ? `${log.user.full_name} · ${new Date(log.date).toLocaleDateString()}`
          : undefined
      }
      size="lg"
      footer={
        <div className="flex items-center justify-end">
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </div>
      }
    >
      {log ? (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ovr-status">Status</Label>
            <div className="flex items-center gap-2">
              <Select
                id="ovr-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as AttendanceStatus)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ").toLowerCase()}
                  </option>
                ))}
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => statusMutation.mutate(status)}
                loading={statusMutation.isPending}
                disabled={status === log.status}
              >
                Save status
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Sessions</Label>
            {log.sessions.length === 0 ? (
              <p className="rounded border border-dashed border-border bg-surface-muted/40 px-3 py-3 text-xs text-foreground-muted">
                No sessions logged for this day.
              </p>
            ) : (
              <ol className="flex flex-col gap-2">
                {log.sessions.map((s, i) => (
                  <SessionRow
                    key={s.id}
                    index={i + 1}
                    session={s}
                    isSaving={sessionMutation.isPending}
                    isDeleting={
                      deleteSessionMutation.isPending &&
                      deleteSessionMutation.variables === s.id
                    }
                    onSave={(check_in_at, check_out_at) =>
                      sessionMutation.mutate({
                        id: s.id,
                        check_in_at: check_in_at ?? undefined,
                        check_out_at: check_out_at ?? undefined,
                      })
                    }
                    onDelete={() => deleteSessionMutation.mutate(s.id)}
                  />
                ))}
              </ol>
            )}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

function SessionRow({
  index,
  session,
  onSave,
  onDelete,
  isSaving,
  isDeleting,
}: {
  index: number;
  session: AttendanceSession;
  onSave: (checkIn: string | null, checkOut: string | null) => void;
  onDelete: () => void;
  isSaving?: boolean;
  isDeleting?: boolean;
}) {
  const [checkIn, setCheckIn] = useState(() =>
    toLocalInput(session.check_in_at),
  );
  const [checkOut, setCheckOut] = useState(() =>
    toLocalInput(session.check_out_at),
  );

  const dirty =
    checkIn !== toLocalInput(session.check_in_at) ||
    checkOut !== toLocalInput(session.check_out_at);

  return (
    <li className="flex flex-col gap-2 rounded border border-border bg-surface px-3 py-2 sm:flex-row sm:items-center">
      <span className="text-xs font-medium uppercase tracking-wider text-foreground-subtle">
        #{String(index).padStart(2, "0")}
      </span>
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          type="datetime-local"
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          className="sm:max-w-[200px]"
        />
        <span className="text-foreground-subtle">→</span>
        <Input
          type="datetime-local"
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
          className="sm:max-w-[200px]"
        />
      </div>
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onSave(fromLocalInput(checkIn), fromLocalInput(checkOut))}
          disabled={!dirty}
          loading={isSaving}
        >
          Save
        </Button>
        <IconButton
          aria-label="Delete session"
          onClick={onDelete}
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4" />
        </IconButton>
      </div>
    </li>
  );
}

function errorToast(title: string) {
  return (err: unknown) => {
    const axiosErr = err as AxiosError<{ message?: string; error?: string }>;
    toast.error(
      title,
      axiosErr.response?.data?.message ??
        axiosErr.response?.data?.error ??
        "Please try again.",
    );
  };
}
