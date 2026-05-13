import { Request, Response } from "express";
import * as authService from "./auth.service";
import { AuthError } from "./auth.service";
import type { AuthenticatedRequest } from "../../middleware/authenticate";
import type { LoginBody, RefreshBody } from "./auth.types";

const isProduction = process.env.NODE_ENV === "production";

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: isProduction,
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const CLEAR_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: isProduction,
  path: "/",
};

export async function loginHandler(req: Request, res: Response) {
  try {
    const { email, password, company_slug } = req.body as LoginBody;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const result = await authService.login(email, password, company_slug);

    res.cookie("refresh_token", result.refresh_token, COOKIE_OPTIONS);

    return res.json({
      access_token: result.access_token,
      user: result.user,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error("Login error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function refreshHandler(req: Request, res: Response) {
  try {
    const rawToken =
      req.cookies?.refresh_token ||
      (req.body as RefreshBody)?.refresh_token;

    if (!rawToken) {
      return res.status(400).json({ error: "Refresh token required" });
    }

    const result = await authService.refresh(rawToken);

    res.cookie("refresh_token", result.refresh_token, COOKIE_OPTIONS);

    return res.json({ access_token: result.access_token });
  } catch (err) {
    if (err instanceof AuthError) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error("Refresh error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function logoutHandler(req: Request, res: Response) {
  try {
    const rawToken =
      req.cookies?.refresh_token ||
      (req.body as RefreshBody)?.refresh_token;

    if (rawToken) {
      await authService.logout(rawToken);
    }

    res.clearCookie("refresh_token", CLEAR_COOKIE_OPTIONS);

    return res.json({ message: "Logged out" });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function meHandler(req: Request, res: Response) {
  try {
    const user = (req as AuthenticatedRequest).user;
    const fullUser = await authService.getMe(user.id);
    return res.json({ user: fullUser });
  } catch (err) {
    if (err instanceof AuthError) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error("Me error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
