import { Request, Response } from "express";
import { ZodError } from "zod";
import type { AuthenticatedRequest } from "../../middleware/authenticate";
import * as leaveService from "./leave.service";
import { LeaveError } from "./leave.service";
import {
  type CreateLeaveRequestBody,
  type RejectLeaveRequestBody,
  type CreateLeaveTypeBody,
  type UpdateLeaveTypeBody,
  leaveRequestQuerySchema,
} from "./leave.schema";

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
  if (err instanceof LeaveError) {
    return res.status(err.status).json({
      message: err.message,
      ...err.extra,
    });
  }
  console.error("Leave error:", err);
  return res.status(500).json({ error: "Internal server error" });
}

// ─── Leave Types ─────────────────────────────────────────

export async function getLeaveTypesHandler(req: Request, res: Response) {
  try {
    const { company_id } = (req as AuthenticatedRequest).user;
    const result = await leaveService.getLeaveTypes(company_id!);
    return res.json(result);
  } catch (err) {
    return handleError(err, res);
  }
}

// ─── Leave Balance ───────────────────────────────────────

export async function getBalanceHandler(req: Request, res: Response) {
  try {
    const { id, company_id } = (req as AuthenticatedRequest).user;
    const result = await leaveService.getMyBalance(id, company_id!);
    return res.json(result);
  } catch (err) {
    return handleError(err, res);
  }
}

// ─── My Leave Requests ───────────────────────────────────

export async function getMyRequestsHandler(req: Request, res: Response) {
  try {
    const { id, company_id } = (req as AuthenticatedRequest).user;
    const query = leaveRequestQuerySchema.parse(req.query);
    const result = await leaveService.getMyRequests(id, company_id!, query);
    return res.json(result);
  } catch (err) {
    return handleError(err, res);
  }
}

// ─── Create Leave Request ────────────────────────────────

export async function createLeaveRequestHandler(req: Request, res: Response) {
  try {
    const { id, company_id } = (req as AuthenticatedRequest).user;
    const result = await leaveService.createLeaveRequest(id, company_id!, req.body as CreateLeaveRequestBody);
    return res.status(201).json(result);
  } catch (err) {
    return handleError(err, res);
  }
}

// ─── Cancel Leave Request ────────────────────────────────

export async function cancelLeaveRequestHandler(req: Request, res: Response) {
  try {
    const { id, role, company_id } = (req as AuthenticatedRequest).user;
    const result = await leaveService.cancelLeaveRequest(id, company_id!, req.params.id, role);
    return res.json(result);
  } catch (err) {
    return handleError(err, res);
  }
}

// ─── Pending Requests ────────────────────────────────────

export async function getPendingRequestsHandler(req: Request, res: Response) {
  try {
    const { id, role, company_id } = (req as AuthenticatedRequest).user;
    const query = leaveRequestQuerySchema.parse(req.query);
    const result = await leaveService.getPendingRequests(id, company_id!, role, query);
    return res.json(result);
  } catch (err) {
    return handleError(err, res);
  }
}

// ─── Approve Request ─────────────────────────────────────

export async function approveRequestHandler(req: Request, res: Response) {
  try {
    const { id, role, company_id } = (req as AuthenticatedRequest).user;
    const result = await leaveService.approveRequest(id, company_id!, req.params.id, role);
    return res.json(result);
  } catch (err) {
    return handleError(err, res);
  }
}

// ─── Reject Request ──────────────────────────────────────

export async function rejectRequestHandler(req: Request, res: Response) {
  try {
    const { id, role, company_id } = (req as AuthenticatedRequest).user;
    const body = req.body as RejectLeaveRequestBody;
    const result = await leaveService.rejectRequest(id, company_id!, req.params.id, role, body.reason);
    return res.json(result);
  } catch (err) {
    return handleError(err, res);
  }
}

// ─── All Requests (HR Admin) ─────────────────────────────

export async function getAllRequestsHandler(req: Request, res: Response) {
  try {
    const { company_id } = (req as AuthenticatedRequest).user;
    const query = leaveRequestQuerySchema.parse(req.query);
    const result = await leaveService.getAllRequests(company_id!, query);
    return res.json(result);
  } catch (err) {
    return handleError(err, res);
  }
}

// ─── Leave Type CRUD (HR_ADMIN) ──────────────────────────

export async function createLeaveTypeHandler(req: Request, res: Response) {
  try {
    const { company_id } = (req as AuthenticatedRequest).user;
    const result = await leaveService.createLeaveType(
      company_id!,
      req.body as CreateLeaveTypeBody,
    );
    return res.status(201).json(result);
  } catch (err) {
    return handleError(err, res);
  }
}

export async function updateLeaveTypeHandler(req: Request, res: Response) {
  try {
    const { company_id } = (req as AuthenticatedRequest).user;
    const result = await leaveService.updateLeaveType(
      company_id!,
      req.params.id,
      req.body as UpdateLeaveTypeBody,
    );
    return res.json(result);
  } catch (err) {
    return handleError(err, res);
  }
}

export async function deleteLeaveTypeHandler(req: Request, res: Response) {
  try {
    const { company_id } = (req as AuthenticatedRequest).user;
    await leaveService.deleteLeaveType(company_id!, req.params.id);
    return res.json({ message: "Leave type deleted" });
  } catch (err) {
    return handleError(err, res);
  }
}
