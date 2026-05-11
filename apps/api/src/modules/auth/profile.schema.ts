import { z } from "zod";
import { validatePassword } from "@repo/shared";

const passwordField = z.string().superRefine((value, ctx) => {
  const error = validatePassword(value);
  if (error) ctx.addIssue({ code: z.ZodIssueCode.custom, message: error });
});

export const updateProfileSchema = z
  .object({
    first_name: z.string().trim().min(1).max(80).optional(),
    last_name: z.string().trim().min(1).max(80).optional(),
    phone: z.string().trim().max(40).nullable().optional(),
  })
  .strict();

export type UpdateProfileBody = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: passwordField,
  })
  .strict();

export type ChangePasswordBody = z.infer<typeof changePasswordSchema>;
