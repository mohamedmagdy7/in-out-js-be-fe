import jwt, { type SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import type { JwtPayload } from "@repo/shared";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "access-secret-change-me";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh-secret-change-me";
const ACCESS_EXPIRES_IN = (process.env.JWT_ACCESS_EXPIRES_IN || "15m") as SignOptions["expiresIn"];
const REFRESH_EXPIRES_IN = (process.env.JWT_REFRESH_EXPIRES_IN || "7d") as SignOptions["expiresIn"];

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
}

export function signRefreshToken(payload: { sub: string }): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): { sub: string } {
  return jwt.verify(token, REFRESH_SECRET) as { sub: string };
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

const REFRESH_EXPIRES_IN_RAW = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

export function getRefreshExpiresAt(): Date {
  const match = REFRESH_EXPIRES_IN_RAW.match(/^(\d+)([smhd])$/);
  if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const value = parseInt(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return new Date(Date.now() + value * multipliers[unit]);
}
