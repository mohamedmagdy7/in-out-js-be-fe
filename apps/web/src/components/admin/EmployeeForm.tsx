"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Button,
  FieldError,
  Input,
  Label,
  Select,
} from "@/components/ui";
import type { Department, Shift, TeamMember } from "@/lib/api/types";

const createSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required"),
  last_name: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().email("Invalid email"),
  password: z.string().min(8, "Must be at least 8 characters"),
  role: z.enum(["EMPLOYEE", "MANAGER"]),
  department_id: z.string().optional(),
  shift_id: z.string().optional(),
  manager_id: z.string().optional(),
  phone: z.string().trim().optional().or(z.literal("")),
});

const editSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required"),
  last_name: z.string().trim().min(1, "Last name is required"),
  department_id: z.string().optional(),
  shift_id: z.string().optional(),
  manager_id: z.string().optional(),
  phone: z.string().trim().optional().or(z.literal("")),
});

export type CreateFormValues = z.infer<typeof createSchema>;
export type EditFormValues = z.infer<typeof editSchema>;

type CreateProps = {
  mode: "create";
  departments: Department[];
  shifts: Shift[];
  managers: TeamMember[];
  isSubmitting?: boolean;
  onSubmit: (values: CreateFormValues) => void;
  onCancel?: () => void;
};

type EditProps = {
  mode: "edit";
  employee: TeamMember;
  departments: Department[];
  shifts: Shift[];
  managers: TeamMember[];
  isSubmitting?: boolean;
  onSubmit: (values: EditFormValues) => void;
  onCancel?: () => void;
};

type Props = CreateProps | EditProps;

export function EmployeeForm(props: Props) {
  if (props.mode === "create") {
    return <CreateForm {...props} />;
  }
  return <EditForm {...props} />;
}

function CreateForm({
  departments,
  shifts,
  managers,
  isSubmitting,
  onSubmit,
  onCancel,
}: CreateProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { role: "EMPLOYEE" },
  });

  return (
    <form
      onSubmit={handleSubmit((values) =>
        onSubmit({
          ...values,
          phone: values.phone?.trim() ? values.phone.trim() : undefined,
          department_id: values.department_id || undefined,
          shift_id: values.shift_id || undefined,
          manager_id: values.manager_id || undefined,
        }),
      )}
      className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-5 shadow-sm"
    >
      <Fields
        register={register}
        errors={errors}
        showEmailAndPassword
        departments={departments}
        shifts={shifts}
        managers={managers}
      />
      <FormActions onCancel={onCancel} isSubmitting={isSubmitting} submitLabel="Create employee" />
    </form>
  );
}

function EditForm({
  employee,
  departments,
  shifts,
  managers,
  isSubmitting,
  onSubmit,
  onCancel,
}: EditProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      first_name: employee.first_name,
      last_name: employee.last_name,
      department_id: employee.department?.id ?? "",
      shift_id: employee.shift?.id ?? "",
      manager_id: employee.manager?.id ?? "",
      phone: employee.phone ?? "",
    },
  });

  return (
    <form
      onSubmit={handleSubmit((values) =>
        onSubmit({
          ...values,
          phone: values.phone?.trim() ? values.phone.trim() : "",
          department_id: values.department_id ?? "",
          shift_id: values.shift_id ?? "",
          manager_id: values.manager_id ?? "",
        }),
      )}
      className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-5 shadow-sm"
    >
      <Fields
        register={register}
        errors={errors}
        showEmailAndPassword={false}
        departments={departments}
        shifts={shifts}
        managers={managers}
      />
      <FormActions
        onCancel={onCancel}
        isSubmitting={isSubmitting}
        submitDisabled={!isDirty}
        submitLabel="Save changes"
      />
    </form>
  );
}

type FieldsRegister = ReturnType<typeof useForm<CreateFormValues>>["register"] |
  ReturnType<typeof useForm<EditFormValues>>["register"];
type FieldsErrors =
  | ReturnType<typeof useForm<CreateFormValues>>["formState"]["errors"]
  | ReturnType<typeof useForm<EditFormValues>>["formState"]["errors"];

function Fields({
  register,
  errors,
  showEmailAndPassword,
  departments,
  shifts,
  managers,
}: {
  register: FieldsRegister;
  errors: FieldsErrors;
  showEmailAndPassword: boolean;
  departments: Department[];
  shifts: Shift[];
  managers: TeamMember[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="First name" error={errors.first_name?.message}>
        <Input
          {...(register as any)("first_name")}
          invalid={!!errors.first_name}
        />
      </Field>
      <Field label="Last name" error={errors.last_name?.message}>
        <Input
          {...(register as any)("last_name")}
          invalid={!!errors.last_name}
        />
      </Field>
      {showEmailAndPassword ? (
        <>
          <Field label="Email" error={(errors as any).email?.message}>
            <Input
              type="email"
              {...(register as any)("email")}
              invalid={!!(errors as any).email}
            />
          </Field>
          <Field
            label="Password"
            error={(errors as any).password?.message}
            hint="At least 8 characters. The employee will be emailed their welcome credentials."
          >
            <Input
              type="password"
              {...(register as any)("password")}
              invalid={!!(errors as any).password}
            />
          </Field>
          <Field label="Role">
            <Select {...(register as any)("role")}>
              <option value="EMPLOYEE">Employee</option>
              <option value="MANAGER">Manager</option>
            </Select>
          </Field>
        </>
      ) : null}
      <Field label="Department">
        <Select {...(register as any)("department_id")}>
          <option value="">No department</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Shift">
        <Select {...(register as any)("shift_id")}>
          <option value="">No shift</option>
          {shifts.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.start_time}–{s.end_time})
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Manager">
        <Select {...(register as any)("manager_id")}>
          <option value="">No manager</option>
          {managers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.first_name} {m.last_name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Phone (optional)">
        <Input type="tel" {...(register as any)("phone")} />
      </Field>
    </div>
  );
}

function Field({
  label,
  children,
  error,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
      {error ? <FieldError>{error}</FieldError> : null}
      {!error && hint ? (
        <span className="text-xs text-foreground-muted">{hint}</span>
      ) : null}
    </div>
  );
}

function FormActions({
  onCancel,
  isSubmitting,
  submitLabel,
  submitDisabled,
}: {
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel: string;
  submitDisabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
      {onCancel ? (
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      ) : null}
      <Button type="submit" loading={isSubmitting} disabled={submitDisabled}>
        {submitLabel}
      </Button>
    </div>
  );
}
