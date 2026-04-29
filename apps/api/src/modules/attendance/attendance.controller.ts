import { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/authenticate";
import * as attendanceService from "./attendance.service";
import { AttendanceError } from "./attendance.service";
import type { CheckInBody, CheckOutBody } from "./attendance.schema";

function handleError(err: unknown, res: Response) {
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
