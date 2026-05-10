"use client";

import { useEffect, useState } from "react";
import {
  Button,
  FieldError,
  Label,
  Modal,
  Textarea,
} from "@/components/ui";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isSubmitting?: boolean;
  employeeName?: string;
};

export function RejectModal({
  open,
  onClose,
  onConfirm,
  isSubmitting,
  employeeName,
}: Props) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setReason("");
      setError(null);
    }
  }, [open]);

  const submit = () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      setError("A rejection reason is required.");
      return;
    }
    setError(null);
    onConfirm(trimmed);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reject leave request"
      description={
        employeeName
          ? `Let ${employeeName} know why this request can't be approved.`
          : "Provide a reason so the requester knows why this was rejected."
      }
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={submit}
            loading={isSubmitting}
          >
            Reject request
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reject-reason">Reason</Label>
        <Textarea
          id="reject-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Conflicts with sprint deadline"
          autoFocus
        />
        {error ? <FieldError>{error}</FieldError> : null}
      </div>
    </Modal>
  );
}
