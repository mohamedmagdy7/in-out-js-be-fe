import { z } from "zod";

export const checkInSchema = z.object({
  lat: z.number().optional(),
  lng: z.number().optional(),
  notes: z.string().optional(),
});

export type CheckInBody = z.infer<typeof checkInSchema>;

export const checkOutSchema = z.object({
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export type CheckOutBody = z.infer<typeof checkOutSchema>;

// --- Task 07: Attendance Records ---

export const attendanceQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "HALF_DAY", "ON_LEAVE"]).optional(),
  department_id: z.string().uuid().optional(),
  employee_id: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

export type AttendanceQuery = z.infer<typeof attendanceQuerySchema>;

export const summaryQuerySchema = z.object({
  period: z.enum(["monthly", "weekly"]),
  year: z.coerce.number().int().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  week_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type SummaryQuery = z.infer<typeof summaryQuerySchema>;

export const adminMarkSchema = z.object({
  user_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "HALF_DAY", "ON_LEAVE"]),
  notes: z.string().optional(),
});

export type AdminMarkBody = z.infer<typeof adminMarkSchema>;

export const adminEditLogSchema = z.object({
  status: z.enum(["PRESENT", "ABSENT", "LATE", "HALF_DAY", "ON_LEAVE"]).optional(),
  notes: z.string().optional(),
});

export type AdminEditLogBody = z.infer<typeof adminEditLogSchema>;

export const adminAddSessionSchema = z.object({
  log_id: z.string().uuid(),
  check_in_at: z.string().datetime(),
  check_out_at: z.string().datetime(),
  notes: z.string().optional(),
});

export type AdminAddSessionBody = z.infer<typeof adminAddSessionSchema>;

export const adminEditSessionSchema = z.object({
  check_in_at: z.string().datetime().optional(),
  check_out_at: z.string().datetime().optional(),
});

export type AdminEditSessionBody = z.infer<typeof adminEditSessionSchema>;
