import { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/authenticate";
import * as employeesService from "./employees.service";
import { EmployeeError } from "./employees.service";
import type { CreateEmployeeBody, UpdateEmployeeBody, ResetPasswordBody } from "./employees.schema";

function handleError(err: unknown, res: Response) {
  if (err instanceof EmployeeError) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error("Employee error:", err);
  return res.status(500).json({ error: "Internal server error" });
}

export async function listHandler(req: Request, res: Response) {
  try {
    const { company_id, role, id } = (req as AuthenticatedRequest).user;
    const result = await employeesService.listEmployees(
      company_id!,
      role,
      id,
      req.query as Record<string, string>,
    );
    return res.json(result);
  } catch (err) {
    return handleError(err, res);
  }
}

export async function createHandler(req: Request, res: Response) {
  try {
    const { company_id } = (req as AuthenticatedRequest).user;
    const employee = await employeesService.createEmployee(company_id!, req.body as CreateEmployeeBody);
    return res.status(201).json(employee);
  } catch (err) {
    return handleError(err, res);
  }
}

export async function getHandler(req: Request, res: Response) {
  try {
    const { company_id, role, id } = (req as AuthenticatedRequest).user;
    const employee = await employeesService.getEmployee(company_id!, req.params.id, role, id);
    return res.json(employee);
  } catch (err) {
    return handleError(err, res);
  }
}

export async function updateHandler(req: Request, res: Response) {
  try {
    const { company_id } = (req as AuthenticatedRequest).user;
    const employee = await employeesService.updateEmployee(
      company_id!,
      req.params.id,
      req.body as UpdateEmployeeBody,
    );
    return res.json(employee);
  } catch (err) {
    return handleError(err, res);
  }
}

export async function deleteHandler(req: Request, res: Response) {
  try {
    const { company_id, id } = (req as AuthenticatedRequest).user;
    await employeesService.deleteEmployee(company_id!, req.params.id, id);
    return res.json({ message: "Employee deactivated" });
  } catch (err) {
    return handleError(err, res);
  }
}

export async function resetPasswordHandler(req: Request, res: Response) {
  try {
    const { company_id } = (req as AuthenticatedRequest).user;
    const { new_password } = req.body as ResetPasswordBody;
    const result = await employeesService.resetEmployeePassword(company_id!, req.params.id, new_password);
    return res.json(result);
  } catch (err) {
    return handleError(err, res);
  }
}
