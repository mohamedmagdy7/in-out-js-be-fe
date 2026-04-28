import { z } from "zod";

export const createCompanySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens only"),
  timezone: z.string().min(1).default("UTC"),
  daily_hours_threshold: z.number().positive().default(8),
});

export const updateCompanySchema = z.object({
  name: z.string().min(1).optional(),
  timezone: z.string().min(1).optional(),
  daily_hours_threshold: z.number().positive().optional(),
  logo_url: z.string().url().nullable().optional(),
  is_active: z.boolean().optional(),
});

export const inviteAdminSchema = z.object({
  email: z.string().email("Invalid email"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type CreateCompanyBody = z.infer<typeof createCompanySchema>;
export type UpdateCompanyBody = z.infer<typeof updateCompanySchema>;
export type InviteAdminBody = z.infer<typeof inviteAdminSchema>;
