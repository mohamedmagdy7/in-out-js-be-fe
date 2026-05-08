"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, Building2, Lock, ArrowRight } from "lucide-react";
import { AxiosError } from "axios";
import { loginRequest } from "@/lib/auth/auth-api";
import { useAuthStore } from "@/lib/auth/auth-store";
import { getRoleHome } from "@/lib/auth/roles";
import {
  Alert,
  Button,
  Checkbox,
  FieldError,
  FieldHint,
  IconButton,
  Input,
  Label,
} from "@/components/ui";

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
  company_slug: z.string().optional(),
  remember_me: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      company_slug: "",
      remember_me: false,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    const slug = values.company_slug?.trim();
    try {
      const result = await loginRequest({
        email: values.email.trim(),
        password: values.password,
        company_slug: slug ? slug : undefined,
        remember_me: values.remember_me,
      });

      setAuth(result.user, result.access_token);
      router.replace(getRoleHome(result.user.role));
    } catch (err) {
      const axiosErr = err as AxiosError<{ error?: string }>;
      const msg =
        axiosErr.response?.data?.error ??
        (axiosErr.response?.status === 401
          ? "Invalid email or password"
          : "Something went wrong. Please try again.");
      setServerError(msg);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-5"
      noValidate
    >
      {serverError ? <Alert tone="danger">{serverError}</Alert> : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          invalid={!!errors.email}
          leftSlot={<Mail className="h-4 w-4" />}
          {...register("email")}
        />
        {errors.email ? <FieldError>{errors.email.message}</FieldError> : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          placeholder="••••••••"
          invalid={!!errors.password}
          leftSlot={<Lock className="h-4 w-4" />}
          rightSlot={
            <IconButton
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={-1}
              className="h-8 w-8"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </IconButton>
          }
          {...register("password")}
        />
        {errors.password ? (
          <FieldError>{errors.password.message}</FieldError>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <Label htmlFor="company_slug">Company</Label>
          <span className="text-xs text-foreground-subtle">Optional</span>
        </div>
        <Input
          id="company_slug"
          type="text"
          autoComplete="organization"
          placeholder="acme"
          invalid={!!errors.company_slug}
          leftSlot={<Building2 className="h-4 w-4" />}
          {...register("company_slug")}
        />
        <FieldHint>
          Leave blank if you&apos;re a platform super admin.
        </FieldHint>
      </div>

      <div className="flex items-center justify-between pt-1">
        <Checkbox
          id="remember_me"
          label="Remember me for 30 days"
          {...register("remember_me")}
        />
      </div>

      <Button
        type="submit"
        size="lg"
        fullWidth
        loading={isSubmitting}
        rightIcon={!isSubmitting ? <ArrowRight className="h-4 w-4" /> : null}
      >
        Sign in
      </Button>
    </form>
  );
}
