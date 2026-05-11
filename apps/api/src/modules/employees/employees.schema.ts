import { z } from "zod";
import { validatePassword } from "@repo/shared";

const passwordField = z.string().superRefine((value, ctx) => {
  const error = validatePassword(value);
  if (error) ctx.addIssue({ code: z.ZodIssueCode.custom, message: error });
});

export const createEmployeeSchema = z.object({
  email: z.string().email("Invalid email"),
  password: passwordField,
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  role: z.enum(["EMPLOYEE", "MANAGER"], {
    message: "Role must be EMPLOYEE or MANAGER",
  }),
  department_id: z.string().uuid().optional(),
  shift_id: z.string().uuid().optional(),
  manager_id: z.string().uuid().optional(),
  phone: z.string().optional(),
});

export const updateEmployeeSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  phone: z.string().nullable().optional(),
  department_id: z.string().uuid().nullable().optional(),
  shift_id: z.string().uuid().nullable().optional(),
  manager_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean().optional(),
});

export const resetPasswordSchema = z.object({
  new_password: passwordField,
});

export type CreateEmployeeBody = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeBody = z.infer<typeof updateEmployeeSchema>;
export type ResetPasswordBody = z.infer<typeof resetPasswordSchema>;
