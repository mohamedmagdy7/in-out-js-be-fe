import { Request, Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "./authenticate";

export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    if (!roles.includes(user.role)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    next();
  };
}

export function requireCompany(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const user = (req as AuthenticatedRequest).user;
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  if (!user.company_id) {
    res.status(403).json({ error: "Company context required" });
    return;
  }

  next();
}
