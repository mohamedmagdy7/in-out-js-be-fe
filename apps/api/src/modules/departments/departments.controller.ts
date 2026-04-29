import { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/authenticate";
import * as departmentsService from "./departments.service";
import { DepartmentError } from "./departments.service";

function handleError(err: unknown, res: Response) {
  if (err instanceof DepartmentError) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error("Department error:", err);
  return res.status(500).json({ error: "Internal server error" });
}

export async function listHandler(req: Request, res: Response) {
  try {
    const { company_id } = (req as AuthenticatedRequest).user;
    const departments = await departmentsService.listDepartments(company_id!);
    return res.json(departments);
  } catch (err) {
    return handleError(err, res);
  }
}

export async function createHandler(req: Request, res: Response) {
  try {
    const { company_id } = (req as AuthenticatedRequest).user;
    const department = await departmentsService.createDepartment(company_id!, req.body.name);
    return res.status(201).json(department);
  } catch (err) {
    return handleError(err, res);
  }
}

export async function updateHandler(req: Request, res: Response) {
  try {
    const { company_id } = (req as AuthenticatedRequest).user;
    const department = await departmentsService.updateDepartment(company_id!, req.params.id, req.body.name);
    return res.json(department);
  } catch (err) {
    return handleError(err, res);
  }
}

export async function deleteHandler(req: Request, res: Response) {
  try {
    const { company_id } = (req as AuthenticatedRequest).user;
    await departmentsService.deleteDepartment(company_id!, req.params.id);
    return res.json({ message: "Department deleted" });
  } catch (err) {
    return handleError(err, res);
  }
}
