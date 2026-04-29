import { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/authenticate";
import * as shiftsService from "./shifts.service";
import { ShiftError } from "./shifts.service";

function handleError(err: unknown, res: Response) {
  if (err instanceof ShiftError) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error("Shift error:", err);
  return res.status(500).json({ error: "Internal server error" });
}

export async function listHandler(req: Request, res: Response) {
  try {
    const { company_id } = (req as AuthenticatedRequest).user;
    const shifts = await shiftsService.listShifts(company_id!);
    return res.json(shifts);
  } catch (err) {
    return handleError(err, res);
  }
}

export async function createHandler(req: Request, res: Response) {
  try {
    const { company_id } = (req as AuthenticatedRequest).user;
    const shift = await shiftsService.createShift(company_id!, req.body);
    return res.status(201).json(shift);
  } catch (err) {
    return handleError(err, res);
  }
}

export async function updateHandler(req: Request, res: Response) {
  try {
    const { company_id } = (req as AuthenticatedRequest).user;
    const shift = await shiftsService.updateShift(company_id!, req.params.id, req.body);
    return res.json(shift);
  } catch (err) {
    return handleError(err, res);
  }
}

export async function deleteHandler(req: Request, res: Response) {
  try {
    const { company_id } = (req as AuthenticatedRequest).user;
    await shiftsService.deleteShift(company_id!, req.params.id);
    return res.json({ message: "Shift deleted" });
  } catch (err) {
    return handleError(err, res);
  }
}
