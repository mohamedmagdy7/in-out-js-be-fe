import { z } from "zod";

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
    new_password: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .max(200),
  })
  .strict();

export type ChangePasswordBody = z.infer<typeof changePasswordSchema>;
