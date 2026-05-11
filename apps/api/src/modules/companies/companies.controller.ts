import { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/authenticate";
import * as companiesService from "./companies.service";
import { CompanyError } from "./companies.service";
import type {
  CreateCompanyBody,
  UpdateCompanyBody,
  InviteAdminBody,
  UpdateMyCompanyBody,
} from "./companies.schema";

function handleError(err: unknown, res: Response) {
  if (err instanceof CompanyError) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error("Company error:", err);
  return res.status(500).json({ error: "Internal server error" });
}

export async function listHandler(req: Request, res: Response) {
  try {
    const result = await companiesService.listCompanies(req.query as Record<string, string>);
    return res.json(result);
  } catch (err) {
    return handleError(err, res);
  }
}

export async function createHandler(req: Request, res: Response) {
  try {
    const company = await companiesService.createCompany(req.body as CreateCompanyBody);
    return res.status(201).json(company);
  } catch (err) {
    return handleError(err, res);
  }
}

export async function getHandler(req: Request, res: Response) {
  try {
    const company = await companiesService.getCompany(req.params.id);
    return res.json(company);
  } catch (err) {
    return handleError(err, res);
  }
}

export async function updateHandler(req: Request, res: Response) {
  try {
    const company = await companiesService.updateCompany(req.params.id, req.body as UpdateCompanyBody);
    return res.json(company);
  } catch (err) {
    return handleError(err, res);
  }
}

export async function deleteHandler(req: Request, res: Response) {
  try {
    await companiesService.deleteCompany(req.params.id);
    return res.json({ message: "Company deactivated" });
  } catch (err) {
    return handleError(err, res);
  }
}

export async function inviteAdminHandler(req: Request, res: Response) {
  try {
    const user = await companiesService.inviteAdmin(req.params.id, req.body as InviteAdminBody);
    return res.status(201).json(user);
  } catch (err) {
    return handleError(err, res);
  }
}

export async function statsHandler(req: Request, res: Response) {
  try {
    const stats = await companiesService.getCompanyStats(req.params.id);
    return res.json(stats);
  } catch (err) {
    return handleError(err, res);
  }
}

// HR_ADMIN: their own company
export async function getMyCompanyHandler(req: Request, res: Response) {
  try {
    const { company_id } = (req as AuthenticatedRequest).user;
    const company = await companiesService.getCompany(company_id!);
    return res.json(company);
  } catch (err) {
    return handleError(err, res);
  }
}

export async function updateMyCompanyHandler(req: Request, res: Response) {
  try {
    const { company_id } = (req as AuthenticatedRequest).user;
    const company = await companiesService.updateCompany(
      company_id!,
      req.body as UpdateMyCompanyBody,
    );
    return res.json(company);
  } catch (err) {
    return handleError(err, res);
  }
}

export async function getMyCompanyStatsHandler(req: Request, res: Response) {
  try {
    const { company_id } = (req as AuthenticatedRequest).user;
    const stats = await companiesService.getCompanyStats(company_id!);
    return res.json(stats);
  } catch (err) {
    return handleError(err, res);
  }
}
