import { Request, Response } from "express";
import * as profileService from "./profile.service";
import { AuthError } from "./auth.service";
import type { AuthenticatedRequest } from "../../middleware/authenticate";
import type {
  UpdateProfileBody,
  ChangePasswordBody,
} from "./profile.schema";

function handleError(err: unknown, res: Response) {
  if (err instanceof AuthError) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error("Profile error:", err);
  return res.status(500).json({ error: "Internal server error" });
}

export async function getProfileHandler(req: Request, res: Response) {
  try {
    const user = (req as AuthenticatedRequest).user;
    const profile = await profileService.getProfile(user.id);
    return res.json({ profile });
  } catch (err) {
    return handleError(err, res);
  }
}

export async function updateProfileHandler(req: Request, res: Response) {
  try {
    const user = (req as AuthenticatedRequest).user;
    const profile = await profileService.updateProfile(
      user.id,
      req.body as UpdateProfileBody,
    );
    return res.json({ profile });
  } catch (err) {
    return handleError(err, res);
  }
}

export async function changePasswordHandler(req: Request, res: Response) {
  try {
    const user = (req as AuthenticatedRequest).user;
    const result = await profileService.changePassword(
      user.id,
      req.body as ChangePasswordBody,
    );
    res.clearCookie("refresh_token", { path: "/" });
    return res.json(result);
  } catch (err) {
    return handleError(err, res);
  }
}
