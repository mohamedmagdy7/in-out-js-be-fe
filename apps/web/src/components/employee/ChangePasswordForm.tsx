"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AxiosError } from "axios";
import { Eye, EyeOff } from "lucide-react";
import { PASSWORD_REQUIREMENTS, validatePassword } from "@repo/shared";
import {
  Alert,
  Button,
  FieldError,
  IconButton,
  Input,
  Label,
  toast,
} from "@/components/ui";
import { changePassword } from "@/lib/api/profile";
import { logout } from "@/lib/auth/auth-provider";

const schema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z.string().superRefine((value, ctx) => {
      const error = validatePassword(value);
      if (error) ctx.addIssue({ code: z.ZodIssueCode.custom, message: error });
    }),
    confirm_password: z.string(),
  })
  .refine((v) => v.new_password === v.confirm_password, {
    path: ["confirm_password"],
    message: "Passwords do not match",
  })
  .refine((v) => v.new_password !== v.current_password, {
    path: ["new_password"],
    message: "New password must differ from the current one",
  });

type FormValues = z.infer<typeof schema>;

export function ChangePasswordForm() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  const mutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast.success(
        "Password changed",
        "You'll need to sign in again with the new password.",
      );
      reset();
      // Backend revoked all refresh tokens — sign out cleanly.
      setTimeout(() => {
        void logout();
      }, 800);
    },
    onError: (err) => {
      const axiosErr = err as AxiosError<{ error?: string }>;
      setServerError(
        axiosErr.response?.data?.error ?? "Could not change password.",
      );
    },
  });

  const onSubmit = (values: FormValues) => {
    setServerError(null);
    mutation.mutate({
      current_password: values.current_password,
      new_password: values.new_password,
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5 shadow-sm"
    >
      <div>
        <h3 className="text-sm font-semibold">Change password</h3>
        <p className="text-xs text-foreground-muted">
          You&apos;ll be signed out of all devices after changing.
        </p>
      </div>

      {serverError ? <Alert tone="danger">{serverError}</Alert> : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="current_password">Current password</Label>
        <Input
          id="current_password"
          type={showCurrent ? "text" : "password"}
          autoComplete="current-password"
          invalid={!!errors.current_password}
          rightSlot={
            <IconButton
              tabIndex={-1}
              aria-label={
                showCurrent ? "Hide current password" : "Show current password"
              }
              onClick={() => setShowCurrent((v) => !v)}
              className="h-8 w-8"
            >
              {showCurrent ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </IconButton>
          }
          {...register("current_password")}
        />
        {errors.current_password ? (
          <FieldError>{errors.current_password.message}</FieldError>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new_password">New password</Label>
          <Input
            id="new_password"
            type={showNew ? "text" : "password"}
            autoComplete="new-password"
            invalid={!!errors.new_password}
            rightSlot={
              <IconButton
                tabIndex={-1}
                aria-label={showNew ? "Hide new password" : "Show new password"}
                onClick={() => setShowNew((v) => !v)}
                className="h-8 w-8"
              >
                {showNew ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </IconButton>
            }
            {...register("new_password")}
          />
          {errors.new_password ? (
            <FieldError>{errors.new_password.message}</FieldError>
          ) : (
            <span className="text-xs text-foreground-muted">
              {PASSWORD_REQUIREMENTS}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirm_password">Confirm new password</Label>
          <Input
            id="confirm_password"
            type={showNew ? "text" : "password"}
            autoComplete="new-password"
            invalid={!!errors.confirm_password}
            {...register("confirm_password")}
          />
          {errors.confirm_password ? (
            <FieldError>{errors.confirm_password.message}</FieldError>
          ) : null}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          loading={isSubmitting || mutation.isPending}
        >
          Change password
        </Button>
      </div>
    </form>
  );
}
