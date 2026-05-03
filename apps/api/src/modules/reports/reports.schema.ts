import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const attendanceReportQuerySchema = z.object({
  from: z.string().regex(dateRegex, "Must be YYYY-MM-DD"),
  to: z.string().regex(dateRegex, "Must be YYYY-MM-DD"),
  department_id: z.string().uuid().optional(),
  employee_id: z.string().uuid().optional(),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "HALF_DAY", "ON_LEAVE"]).optional(),
});

export type AttendanceReportQuery = z.infer<typeof attendanceReportQuerySchema>;

export const overtimeReportQuerySchema = z.object({
  from: z.string().regex(dateRegex, "Must be YYYY-MM-DD"),
  to: z.string().regex(dateRegex, "Must be YYYY-MM-DD"),
  department_id: z.string().uuid().optional(),
  min_hours: z.coerce.number().min(0).default(0),
});

export type OvertimeReportQuery = z.infer<typeof overtimeReportQuerySchema>;

export const leaveReportQuerySchema = z.object({
  year: z.coerce.number().int().default(new Date().getFullYear()),
  department_id: z.string().uuid().optional(),
  leave_type_id: z.string().uuid().optional(),
});

export type LeaveReportQuery = z.infer<typeof leaveReportQuerySchema>;

export const exportCsvSchema = attendanceReportQuerySchema;
export type ExportCsvBody = z.infer<typeof exportCsvSchema>;

export const exportPdfSchema = attendanceReportQuerySchema;
export type ExportPdfBody = z.infer<typeof exportPdfSchema>;
