"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  adminMarkAttendance,
  type AdminMarkBody,
} from "@/lib/api/admin";
import {
  Button,
  FieldError,
  Input,
  Label,
  Modal,
  Select,
  Textarea,
  toast,
} from "@/components/ui";
import type { AttendanceStatus, TeamMember } from "@/lib/api/types";
import { isoToday } from "@/lib/format";

type Props = {
  open: boolean;
  onClose: () => void;
  employees: TeamMember[];
};

const STATUS: AttendanceStatus[] = [
  "PRESENT",
  "ABSENT",
  "LATE",
  "HALF_DAY",
  "ON_LEAVE",
];

export function ManualMarkModal({ open, onClose, employees }: Props) {
  const qc = useQueryClient();
  const [userId, setUserId] = useState("");
  const [date, setDate] = useState(isoToday());
  const [status, setStatus] = useState<AttendanceStatus>("PRESENT");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  useEffect(() => {
    if (open) {
      setUserId("");
      setDate(isoToday());
      setStatus("PRESENT");
      setNotes("");
      setErrors({});
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: (body: AdminMarkBody) => adminMarkAttendance(body),
    onSuccess: () => {
      toast.success("Attendance recorded");
      qc.invalidateQueries({ queryKey: ["admin", "attendance"] });
      qc.invalidateQueries({ queryKey: ["admin", "summary"] });
      onClose();
    },
    onError: (err) => {
      const axiosErr = err as AxiosError<{
        message?: string;
        error?: string;
      }>;
      toast.error(
        "Could not record",
        axiosErr.response?.data?.message ??
          axiosErr.response?.data?.error ??
          "Please try again.",
      );
    },
  });

  const submit = () => {
    const next: Record<string, string> = {};
    if (!userId) next.userId = "Pick an employee";
    if (!date) next.date = "Date required";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    mutation.mutate({
      user_id: userId,
      date,
      status,
      notes: notes.trim() ? notes.trim() : undefined,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Manual attendance"
      description="Record an absent, present, or leave day for an employee."
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button onClick={submit} loading={mutation.isPending}>
            Record
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="mm-user">Employee</Label>
          <Select
            id="mm-user"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            invalid={!!errors.userId}
          >
            <option value="">Select an employee…</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.first_name} {e.last_name}
                {e.department ? ` · ${e.department.name}` : ""}
              </option>
            ))}
          </Select>
          {errors.userId ? <FieldError>{errors.userId}</FieldError> : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mm-date">Date</Label>
            <Input
              id="mm-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              invalid={!!errors.date}
            />
            {errors.date ? <FieldError>{errors.date}</FieldError> : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mm-status">Status</Label>
            <Select
              id="mm-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as AttendanceStatus)}
            >
              {STATUS.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ").toLowerCase()}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="mm-notes">Notes (optional)</Label>
          <Textarea
            id="mm-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Approved by manager via email"
          />
        </div>
      </div>
    </Modal>
  );
}
