"use client";

import { useEffect, useState } from "react";
import {
  Button,
  FieldError,
  Input,
  Label,
  Modal,
} from "@/components/ui";
import { PasswordStrength } from "./PasswordStrength";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (body: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
  }) => void;
  isSubmitting?: boolean;
};

export function AddHRAdminModal({ open, onClose, onSubmit, isSubmitting }: Props) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  useEffect(() => {
    if (!open) {
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setErrors({});
    }
  }, [open]);

  const submit = () => {
    const next: Record<string, string> = {};
    if (!firstName.trim()) next.first_name = "First name is required";
    if (!lastName.trim()) next.last_name = "Last name is required";
    if (!email.trim()) next.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = "Invalid email";
    if (password.length < 8) next.password = "Must be at least 8 characters";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onSubmit({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      password,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add HR admin"
      description="Create another administrator for this company."
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={submit} loading={isSubmitting}>
            Create HR admin
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ha-fn">First name</Label>
            <Input
              id="ha-fn"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              invalid={!!errors.first_name}
              autoFocus
            />
            {errors.first_name ? (
              <FieldError>{errors.first_name}</FieldError>
            ) : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ha-ln">Last name</Label>
            <Input
              id="ha-ln"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              invalid={!!errors.last_name}
            />
            {errors.last_name ? (
              <FieldError>{errors.last_name}</FieldError>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ha-email">Email</Label>
          <Input
            id="ha-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            invalid={!!errors.email}
          />
          {errors.email ? <FieldError>{errors.email}</FieldError> : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ha-pw">Password</Label>
          <Input
            id="ha-pw"
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            invalid={!!errors.password}
            placeholder="At least 8 characters"
          />
          <PasswordStrength password={password} />
          {errors.password ? (
            <FieldError>{errors.password}</FieldError>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
