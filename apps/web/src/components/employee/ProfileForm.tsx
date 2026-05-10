"use client";

import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AxiosError } from "axios";
import {
  Button,
  FieldError,
  Input,
  Label,
  toast,
} from "@/components/ui";
import { useAuthStore } from "@/lib/auth/auth-store";
import { updateProfile } from "@/lib/api/profile";
import { queryKeys } from "@/lib/query/keys";
import type { Profile } from "@/lib/api/types";

const schema = z.object({
  first_name: z.string().trim().min(1, "First name is required").max(80),
  last_name: z.string().trim().min(1, "Last name is required").max(80),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

export function ProfileForm({ profile }: { profile: Profile }) {
  const qc = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: profile.first_name,
      last_name: profile.last_name,
      phone: profile.phone ?? "",
    },
  });

  useEffect(() => {
    reset({
      first_name: profile.first_name,
      last_name: profile.last_name,
      phone: profile.phone ?? "",
    });
  }, [profile, reset]);

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (next) => {
      toast.success("Profile updated");
      qc.setQueryData(queryKeys.profile, next);
      // Keep AuthStore in sync (header avatar uses these names).
      if (user && accessToken) {
        setAuth(
          {
            ...user,
            first_name: next.first_name,
            last_name: next.last_name,
          },
          accessToken,
        );
      }
      reset({
        first_name: next.first_name,
        last_name: next.last_name,
        phone: next.phone ?? "",
      });
    },
    onError: (err) => {
      const axiosErr = err as AxiosError<{ error?: string }>;
      toast.error(
        "Could not update",
        axiosErr.response?.data?.error ?? "Please try again.",
      );
    },
  });

  const onSubmit = (values: FormValues) => {
    mutation.mutate({
      first_name: values.first_name.trim(),
      last_name: values.last_name.trim(),
      phone: values.phone?.trim() ? values.phone.trim() : null,
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-5 shadow-sm"
    >
      <div>
        <h3 className="text-sm font-semibold">Personal info</h3>
        <p className="text-xs text-foreground-muted">
          Update your name and contact details.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="first_name">First name</Label>
          <Input
            id="first_name"
            invalid={!!errors.first_name}
            {...register("first_name")}
          />
          {errors.first_name ? (
            <FieldError>{errors.first_name.message}</FieldError>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="last_name">Last name</Label>
          <Input
            id="last_name"
            invalid={!!errors.last_name}
            {...register("last_name")}
          />
          {errors.last_name ? (
            <FieldError>{errors.last_name.message}</FieldError>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="phone">Phone number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+1 555 0100"
            invalid={!!errors.phone}
            {...register("phone")}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={!isDirty}
          loading={isSubmitting || mutation.isPending}
        >
          Save changes
        </Button>
      </div>
    </form>
  );
}
