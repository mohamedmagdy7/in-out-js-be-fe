import { Request, Response } from "express";
import { ZodError } from "zod";
import type { AuthenticatedRequest } from "../../middleware/authenticate";
import * as reportsService from "./reports.service";
import { ReportError } from "./reports.service";
import {
  attendanceReportQuerySchema,
  overtimeReportQuerySchema,
  leaveReportQuerySchema,
  exportCsvSchema,
  exportPdfSchema,
} from "./reports.schema";
import { streamAttendanceCsv } from "./exporters/csv.exporter";
import { streamAttendancePdf } from "./exporters/pdf.exporter";

function handleError(err: unknown, res: Response) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation failed",
      details: err.issues.map((e) => ({
        path: (e.path as (string | number)[]).join("."),
        message: e.message,
      })),
    });
  }
  if (err instanceof ReportError) {
    return res.status(err.status).json({ message: err.message });
  }
  console.error("Reports error:", err);
  return res.status(500).json({ error: "Internal server error" });
}

export async function attendanceReportHandler(req: Request, res: Response) {
  try {
    const { id, role, company_id } = (req as AuthenticatedRequest).user;
    const query = attendanceReportQuerySchema.parse(req.query);
    const result = await reportsService.getAttendanceReport(id, role, company_id!, query);
    return res.json(result);
  } catch (err) {
    return handleError(err, res);
  }
}

export async function overtimeReportHandler(req: Request, res: Response) {
  try {
    const { id, role, company_id } = (req as AuthenticatedRequest).user;
    const query = overtimeReportQuerySchema.parse(req.query);
    const result = await reportsService.getOvertimeReport(id, role, company_id!, query);
    return res.json(result);
  } catch (err) {
    return handleError(err, res);
  }
}

export async function leaveReportHandler(req: Request, res: Response) {
  try {
    const { id, role, company_id } = (req as AuthenticatedRequest).user;
    const query = leaveReportQuerySchema.parse(req.query);
    const result = await reportsService.getLeaveReport(id, role, company_id!, query);
    return res.json(result);
  } catch (err) {
    return handleError(err, res);
  }
}

export async function summaryHandler(req: Request, res: Response) {
  try {
    const { id, role, company_id } = (req as AuthenticatedRequest).user;
    const result = await reportsService.getSummary(id, role, company_id!);
    return res.json(result);
  } catch (err) {
    return handleError(err, res);
  }
}

export async function exportCsvHandler(req: Request, res: Response) {
  try {
    const { id, role, company_id } = (req as AuthenticatedRequest).user;
    const body = exportCsvSchema.parse(req.body);
    const data = await reportsService.getAttendanceReportFull(id, role, company_id!, body);
    const filename = `attendance-${body.from}-to-${body.to}.csv`;
    streamAttendanceCsv(res, {
      filename,
      timezone: data.company.timezone,
      employees: data.employees,
    });
  } catch (err) {
    return handleError(err, res);
  }
}

export async function exportPdfHandler(req: Request, res: Response) {
  try {
    const { id, role, company_id } = (req as AuthenticatedRequest).user;
    const body = exportPdfSchema.parse(req.body);
    const data = await reportsService.getAttendanceReportFull(id, role, company_id!, body);

    const total_work_minutes = data.employees.reduce((s, e) => s + e.total_work_minutes, 0);
    const total_overtime_minutes = data.employees.reduce((s, e) => s + e.total_overtime_minutes, 0);
    const avg_rate =
      data.employees.length > 0
        ? data.employees.reduce((s, e) => s + parseFloat(e.attendance_rate), 0) /
          data.employees.length
        : 0;

    const filename = `attendance-${body.from}-to-${body.to}.pdf`;
    streamAttendancePdf(res, {
      filename,
      company: { name: data.company.name, logo_url: data.company.logo_url },
      period: data.period,
      summary: {
        total_employees: data.employees.length,
        avg_attendance_rate: `${avg_rate.toFixed(1)}%`,
        total_work_hours: `${Math.round(total_work_minutes / 60)}h`,
        total_overtime_hours: `${Math.round(total_overtime_minutes / 60)}h`,
      },
      employees: data.employees,
    });
  } catch (err) {
    return handleError(err, res);
  }
}
