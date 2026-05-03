import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createLeaveRequestSchema = z.object({
  leave_type_id: z.string().uuid(),
  start_date: z.string().regex(dateRegex, "Must be YYYY-MM-DD"),
  end_date: z.string().regex(dateRegex, "Must be YYYY-MM-DD"),
  reason: z.string().optional(),
});

export type CreateLeaveRequestBody = z.infer<typeof createLeaveRequestSchema>;

export const rejectLeaveRequestSchema = z.object({
  reason: z.string().min(1, "Rejection reason is required"),
});

export type RejectLeaveRequestBody = z.infer<typeof rejectLeaveRequestSchema>;

export const leaveRequestQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  from: z.string().regex(dateRegex).optional(),
  to: z.string().regex(dateRegex).optional(),
  employee_id: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

export type LeaveRequestQuery = z.infer<typeof leaveRequestQuerySchema>;
