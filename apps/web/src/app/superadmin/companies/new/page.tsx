"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Copy,
  ExternalLink,
} from "lucide-react";
import { PASSWORD_REQUIREMENTS, validatePassword } from "@repo/shared";
import {
  createCompany,
  inviteCompanyAdmin,
  type CreateCompanyBody,
  type InviteAdminBody,
} from "@/lib/api/superadmin";
import { queryKeys } from "@/lib/query/keys";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  FieldError,
  Input,
  Label,
  Select,
  toast,
} from "@/components/ui";
import { PasswordStrength } from "@/components/superadmin/PasswordStrength";
import type { CompanyRow } from "@/lib/api/types";

const TIMEZONES = [
  "UTC",
  "Africa/Cairo",
  "Africa/Lagos",
  "Africa/Nairobi",
  "Africa/Johannesburg",
  "Asia/Dubai",
  "Asia/Riyadh",
  "Asia/Tehran",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Istanbul",
  "Europe/Moscow",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
];

const SLUG_RE = /^[a-z0-9-]+$/;

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

type Step1 = {
  name: string;
  slug: string;
  timezone: string;
  daily_hours_threshold: string;
};

type Step2 = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
};

type Success = {
  company: CompanyRow;
  admin: { email: string; first_name: string; last_name: string };
  password: string;
};

export default function NewCompanyPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const [step, setStep] = useState<1 | 2>(1);
  const [success, setSuccess] = useState<Success | null>(null);

  const [step1, setStep1] = useState<Step1>({
    name: "",
    slug: "",
    timezone: "UTC",
    daily_hours_threshold: "8",
  });
  const [step1Errors, setStep1Errors] = useState<
    Partial<Record<keyof Step1, string>>
  >({});
  const [slugTouched, setSlugTouched] = useState(false);

  const [step2, setStep2] = useState<Step2>({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
  });
  const [step2Errors, setStep2Errors] = useState<
    Partial<Record<keyof Step2, string>>
  >({});

  // Auto-generate slug from name until user edits it.
  useEffect(() => {
    if (!slugTouched) {
      setStep1((s) => ({ ...s, slug: slugify(s.name) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step1.name]);

  const createMutation = useMutation({
    mutationFn: async ({
      company,
      admin,
    }: {
      company: CreateCompanyBody;
      admin: InviteAdminBody;
    }) => {
      const created = await createCompany(company);
      const adminUser = await inviteCompanyAdmin(created.id, admin);
      return { company: created, admin: adminUser };
    },
    onSuccess: ({ company, admin }) => {
      qc.invalidateQueries({ queryKey: ["superadmin", "companies"] });
      qc.invalidateQueries({ queryKey: queryKeys.superadmin.platform });
      setSuccess({
        company,
        admin: {
          email: admin.email,
          first_name: admin.first_name,
          last_name: admin.last_name,
        },
        password: step2.password,
      });
      toast.success("Company created");
    },
    onError: (err) => {
      const axiosErr = err as AxiosError<{ error?: string; message?: string }>;
      const msg =
        axiosErr.response?.data?.error ??
        axiosErr.response?.data?.message ??
        "Please try again.";
      if (msg.toLowerCase().includes("slug")) {
        setStep1Errors((e) => ({ ...e, slug: msg }));
        setStep(1);
      } else if (msg.toLowerCase().includes("email")) {
        setStep2Errors((e) => ({ ...e, email: msg }));
        setStep(2);
      } else {
        toast.error("Could not create company", msg);
      }
    },
  });

  const validateStep1 = (): boolean => {
    const errs: Partial<Record<keyof Step1, string>> = {};
    if (!step1.name.trim()) errs.name = "Company name is required";
    if (!step1.slug.trim()) errs.slug = "Slug is required";
    else if (!SLUG_RE.test(step1.slug))
      errs.slug = "Use lowercase letters, numbers, and hyphens only";
    const t = Number(step1.daily_hours_threshold);
    if (!Number.isFinite(t) || t <= 0)
      errs.daily_hours_threshold = "Must be a positive number";
    setStep1Errors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = (): boolean => {
    const errs: Partial<Record<keyof Step2, string>> = {};
    if (!step2.first_name.trim()) errs.first_name = "First name is required";
    if (!step2.last_name.trim()) errs.last_name = "Last name is required";
    if (!step2.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(step2.email))
      errs.email = "Invalid email";
    const pwErr = validatePassword(step2.password);
    if (pwErr) errs.password = pwErr;
    setStep2Errors(errs);
    return Object.keys(errs).length === 0;
  };

  const onSubmit = () => {
    if (!validateStep2()) return;
    if (!validateStep1()) {
      setStep(1);
      return;
    }
    createMutation.mutate({
      company: {
        name: step1.name.trim(),
        slug: step1.slug.trim(),
        timezone: step1.timezone,
        daily_hours_threshold: Number(step1.daily_hours_threshold),
      },
      admin: {
        first_name: step2.first_name.trim(),
        last_name: step2.last_name.trim(),
        email: step2.email.trim(),
        password: step2.password,
      },
    });
  };

  if (success) {
    return <SuccessScreen success={success} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/superadmin/companies"
          className="inline-flex items-center gap-1 text-foreground-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Companies
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Create company
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Provision a new tenant and its first HR admin.
        </p>
      </div>

      <Stepper current={step} />

      {step === 1 ? (
        <Card>
          <CardHeader>
            <CardTitle>Company info</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="name">Company name</Label>
                <Input
                  id="name"
                  value={step1.name}
                  onChange={(e) =>
                    setStep1({ ...step1, name: e.target.value })
                  }
                  invalid={!!step1Errors.name}
                  placeholder="Acme Inc."
                />
                {step1Errors.name ? (
                  <FieldError>{step1Errors.name}</FieldError>
                ) : null}
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={step1.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setStep1({ ...step1, slug: e.target.value });
                  }}
                  invalid={!!step1Errors.slug}
                  placeholder="acme"
                />
                {step1Errors.slug ? (
                  <FieldError>{step1Errors.slug}</FieldError>
                ) : (
                  <span className="text-xs text-foreground-muted">
                    Lowercase letters, numbers, hyphens. Used in URLs and must
                    be unique.
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tz">Timezone</Label>
                <Select
                  id="tz"
                  value={step1.timezone}
                  onChange={(e) =>
                    setStep1({ ...step1, timezone: e.target.value })
                  }
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="threshold">Daily hours threshold</Label>
                <Input
                  id="threshold"
                  type="number"
                  step="0.25"
                  min="0.25"
                  value={step1.daily_hours_threshold}
                  onChange={(e) =>
                    setStep1({
                      ...step1,
                      daily_hours_threshold: e.target.value,
                    })
                  }
                  invalid={!!step1Errors.daily_hours_threshold}
                />
                {step1Errors.daily_hours_threshold ? (
                  <FieldError>{step1Errors.daily_hours_threshold}</FieldError>
                ) : (
                  <span className="text-xs text-foreground-muted">
                    Hours worked beyond this count as overtime.
                  </span>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>First HR admin</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fn">First name</Label>
                <Input
                  id="fn"
                  value={step2.first_name}
                  onChange={(e) =>
                    setStep2({ ...step2, first_name: e.target.value })
                  }
                  invalid={!!step2Errors.first_name}
                />
                {step2Errors.first_name ? (
                  <FieldError>{step2Errors.first_name}</FieldError>
                ) : null}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ln">Last name</Label>
                <Input
                  id="ln"
                  value={step2.last_name}
                  onChange={(e) =>
                    setStep2({ ...step2, last_name: e.target.value })
                  }
                  invalid={!!step2Errors.last_name}
                />
                {step2Errors.last_name ? (
                  <FieldError>{step2Errors.last_name}</FieldError>
                ) : null}
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={step2.email}
                  onChange={(e) =>
                    setStep2({ ...step2, email: e.target.value })
                  }
                  invalid={!!step2Errors.email}
                />
                {step2Errors.email ? (
                  <FieldError>{step2Errors.email}</FieldError>
                ) : null}
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="pw">Password</Label>
                <Input
                  id="pw"
                  type="text"
                  value={step2.password}
                  onChange={(e) =>
                    setStep2({ ...step2, password: e.target.value })
                  }
                  invalid={!!step2Errors.password}
                  placeholder="Password"
                />
                <PasswordStrength password={step2.password} />
                {step2Errors.password ? (
                  <FieldError>{step2Errors.password}</FieldError>
                ) : (
                  <span className="text-xs text-foreground-muted">
                    {PASSWORD_REQUIREMENTS} Shared once on the success
                    screen — copy or save it.
                  </span>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          onClick={() => {
            if (step === 2) setStep(1);
            else router.push("/superadmin/companies");
          }}
          disabled={createMutation.isPending}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          {step === 2 ? "Back" : "Cancel"}
        </Button>
        {step === 1 ? (
          <Button
            onClick={() => {
              if (validateStep1()) setStep(2);
            }}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Continue
          </Button>
        ) : (
          <Button onClick={onSubmit} loading={createMutation.isPending}>
            Create company
          </Button>
        )}
      </div>
    </div>
  );
}

function Stepper({ current }: { current: 1 | 2 }) {
  const items = [
    { n: 1, label: "Company info" },
    { n: 2, label: "First HR admin" },
  ] as const;
  return (
    <div className="flex items-center gap-3 text-sm">
      {items.map((it, i) => {
        const active = it.n === current;
        const done = it.n < current;
        return (
          <div key={it.n} className="flex items-center gap-3">
            <div
              className={[
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                active
                  ? "bg-primary text-primary-foreground"
                  : done
                    ? "bg-success text-white"
                    : "bg-surface-muted text-foreground-muted",
              ].join(" ")}
            >
              {done ? "✓" : it.n}
            </div>
            <span
              className={
                active ? "font-medium text-foreground" : "text-foreground-muted"
              }
            >
              {it.label}
            </span>
            {i < items.length - 1 ? (
              <span className="mx-1 h-px w-8 bg-border" />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function SuccessScreen({ success }: { success: Success }) {
  const fullCreds = `Company: ${success.company.name}\nSlug: ${success.company.slug}\nLogin email: ${success.admin.email}\nPassword: ${success.password}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(fullCreds);
      toast.success("Credentials copied");
    } catch {
      toast.error(
        "Could not copy",
        "Clipboard access denied. Copy manually.",
      );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-success-soft text-success-soft-foreground">
          <CheckCircle2 className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Company created
          </h1>
          <p className="text-sm text-foreground-muted">
            Save these credentials — the password won&apos;t be shown again.
          </p>
        </div>
      </div>

      <Alert tone="warning" title="Share the credentials securely">
        The HR admin has been created with this password. Send it through a
        trusted channel; they can change it after logging in.
      </Alert>

      <div className="rounded-lg border border-border bg-surface shadow-sm">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold">{success.company.name}</h2>
          <p className="font-mono text-xs text-foreground-muted">
            {success.company.slug}
          </p>
        </div>
        <dl className="divide-y divide-border">
          <Row label="Login email" value={success.admin.email} mono />
          <Row label="Password" value={success.password} mono />
          <Row
            label="Admin name"
            value={`${success.admin.first_name} ${success.admin.last_name}`}
          />
          <Row label="Timezone" value={success.company.timezone} />
        </dl>
        <div className="flex items-center justify-end gap-2 border-t border-border bg-surface-muted/40 px-5 py-3">
          <Button
            variant="outline"
            leftIcon={<Copy className="h-4 w-4" />}
            onClick={copy}
          >
            Copy credentials
          </Button>
          <Link href={`/superadmin/companies/${success.company.id}`}>
            <Button rightIcon={<ExternalLink className="h-4 w-4" />}>
              Go to company
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-3 px-5 py-3 text-sm">
      <dt className="col-span-1 text-foreground-muted">{label}</dt>
      <dd
        className={[
          "col-span-2 break-all",
          mono ? "font-mono text-xs" : "",
        ].join(" ")}
      >
        {value}
      </dd>
    </div>
  );
}
