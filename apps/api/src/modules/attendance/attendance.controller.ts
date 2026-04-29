import { Request, Response } from "express";
import { ZodError } from "zod";
import type { AuthenticatedRequest } from "../../middleware/authenticate";
import * as attendanceService from "./attendance.service";
import { AttendanceError } from "./attendance.service";
import {
  type CheckInBody,
  type CheckOutBody,
  type AdminMarkBody,
  type AdminEditLogBody,
  type AdminAddSessionBody,
  type AdminEditSessionBody,
  attendanceQuerySchema,
  summaryQuerySchema,
} from "./attendance.schema";

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
  if (err instanceof AttendanceError) {
    return res.status(err.status).json({ message: err.message });
  }
  console.error("Attendance error:", err);
  return res.status(500).json({ error: "Internal server error" });
}

export async function checkInHandler(req: Request, res: Response) {
  try {
    const { id, company_id } = (req as AuthenticatedRequest).user;
    const result = await attendanceService.checkIn(id, company_id!, req.body as CheckInBody);
    return res.status(201).json(result);
  } catch (err) {
    return handleError(err, res);
  }
}

export async function checkOutHandler(req: Request, res: Response) {
  try {
    const { id, company_id } = (req as AuthenticatedRequest).user;
    const result = await attendanceService.checkOut(id, company_id!, req.body as CheckOutBody);
    return res.json(result);
  } catch (err) {
    return handleError(err, res);
  }
}

export async function getTodayHandler(req: Request, res: Response) {
  try {
    const { id, company_id } = (req as AuthenticatedRequest).user;
    const result = await attendanceService.getToday(id, company_id!);
    return res.json(result);
  } catch (err) {
    return handleError(err, res);
  }
}

export async function getStatusHandler(req: Request, res: Response) {
  try {
    const { id, company_id } = (req as AuthenticatedRequest).user;
    const result = await attendanceService.getStatus(id, company_id!);
    return res.json(result);
  } catch (err) {
    return handleError(err, res);
  }
}

// --- Task 07: Attendance Records ---

export async function getMyAttendanceHandler(req: Request, res: Response) {
  try {
    const { id, company_id } = (req as AuthenticatedRequest).user;
    const query = attendanceQuerySchema.parse(req.query);
    const result = await attendanceService.getMyAttendance(id, company_id!, query);
    return res.json(result);
  } catch (err) {
    return handleError(err, res);
  }
}

export async function getEmployeeAttendanceHandler(req: Request, res: Response) {
  try {
    const { id, role, company_id } = (req as AuthenticatedRequest).user;
    const employeeId = req.params.id;
    const query = attendanceQuerySchema.parse(req.query);
    const result = await attendanceService.getEmployeeAttendance(id, role, company_id!, employeeId, query);
    return res.json(result);
  } catch (err) {
    return handleError(err, res);
  }
}

export async function getTeamAttendanceHandler(req: Request, res: Response) {
  try {
    const { id, company_id } = (req as AuthenticatedRequest).user;
    const query = attendanceQuerySchema.parse(req.query);
    const result = await attendanceService.getTeamAttendance(id, company_id!, query);
    return res.json(result);
  } catch (err) {
    return handleError(err, res);
  }
}

export async function getCompanyAttendanceHandler(req: Request, res: Response) {
  try {
    const { company_id } = (req as AuthenticatedRequest).user;
    const query = attendanceQuerySchema.parse(req.query);
    const result = await attendanceService.getCompanyAttendance(company_id!, query);
    return res.json(result);
  } catch (err) {
    return handleError(err, res);
  }
}

export async function getMySummaryHandler(req: Request, res: Response) {
  try {
    const { id, company_id } = (req as AuthenticatedRequest).user;
    const query = summaryQuerySchema.parse(req.query);
    const result = await attendanceService.getMySummary(id, company_id!, query);
    return res.json(result);
  } catch (err) {
    return handleError(err, res);
  }
}

export async function getEmployeeSummaryHandler(req: Request, res: Response) {
  try {
    const { id, role, company_id } = (req as AuthenticatedRequest).user;
    const employeeId = req.params.id;
    const query = summaryQuerySchema.parse(req.query);
    const result = await attendanceService.getEmployeeSummary(id, role, company_id!, employeeId, query);
    return res.json(result);
  } catch (err) {
    return handleError(err, res);
  }
}

// --- Admin Override Handlers ---

export async function adminMarkHandler(req: Request, res: Response) {
  try {
    const { company_id } = (req as AuthenticatedRequest).user;
    const result = await attendanceService.adminMarkAttendance(company_id!, req.body as AdminMarkBody);
    return res.status(201).json(result);
  } catch (err) {
    return handleError(err, res);
  }
}

export async function adminEditLogHandler(req: Request, res: Response) {
  try {
    const { company_id } = (req as AuthenticatedRequest).user;
    const result = await attendanceService.adminEditLog(company_id!, req.params.id, req.body as AdminEditLogBody);
    return res.json(result);
  } catch (err) {
    return handleError(err, res);
  }
}

export async function adminAddSessionHandler(req: Request, res: Response) {
  try {
    const { company_id } = (req as AuthenticatedRequest).user;
    const result = await attendanceService.adminAddSession(company_id!, req.body as AdminAddSessionBody);
    return res.status(201).json(result);
  } catch (err) {
    return handleError(err, res);
  }
}

export async function adminEditSessionHandler(req: Request, res: Response) {
  try {
    const { company_id } = (req as AuthenticatedRequest).user;
    const result = await attendanceService.adminEditSession(company_id!, req.params.id, req.body as AdminEditSessionBody);
    return res.json(result);
  } catch (err) {
    return handleError(err, res);
  }
}

export async function adminDeleteSessionHandler(req: Request, res: Response) {
  try {
    const { company_id } = (req as AuthenticatedRequest).user;
    const result = await attendanceService.adminDeleteSession(company_id!, req.params.id);
    return res.json(result);
  } catch (err) {
    return handleError(err, res);
  }
}
