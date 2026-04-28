import { db } from "@repo/db";
import { comparePassword } from "../../utils/password";
import {
  signAccessToken,
  signRefreshToken,
  hashToken,
  getRefreshExpiresAt,
} from "../../utils/jwt";
import type { JwtPayload, AuthUser } from "@repo/shared";

export async function login(
  email: string,
  password: string,
  companySlug?: string
): Promise<{
  access_token: string;
  refresh_token: string;
  user: AuthUser;
}> {
  let user;

  if (companySlug) {
    const company = await db.company.findUnique({
      where: { slug: companySlug },
    });
    if (!company) throw new AuthError("Invalid company", 404);

    user = await db.user.findUnique({
      where: { email_company_id: { email, company_id: company.id } },
      include: { company: { select: { slug: true } } },
    });
  } else {
    // No company_slug → only allow SUPER_ADMIN
    user = await db.user.findFirst({
      where: { email, role: "SUPER_ADMIN" },
      include: { company: { select: { slug: true } } },
    });
  }

  if (!user || !user.is_active) {
    throw new AuthError("Invalid credentials", 401);
  }

  const valid = await comparePassword(password, user.password);
  if (!valid) {
    throw new AuthError("Invalid credentials", 401);
  }

  const jwtPayload: JwtPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    company_id: user.company_id,
  };

  const access_token = signAccessToken(jwtPayload);
  const refresh_token = signRefreshToken({ sub: user.id });

  // Store hashed refresh token
  await db.refreshToken.create({
    data: {
      user_id: user.id,
      token: hashToken(refresh_token),
      expires_at: getRefreshExpiresAt(),
    },
  });

  return {
    access_token,
    refresh_token,
    user: {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      company_id: user.company_id,
      company_slug: user.company?.slug ?? null,
    },
  };
}

export async function refresh(rawToken: string): Promise<{
  access_token: string;
  refresh_token: string;
}> {
  const hashed = hashToken(rawToken);

  const stored = await db.refreshToken.findUnique({
    where: { token: hashed },
    include: {
      user: {
        include: { company: { select: { slug: true } } },
      },
    },
  });

  if (!stored || stored.expires_at < new Date()) {
    if (stored) await db.refreshToken.delete({ where: { id: stored.id } });
    throw new AuthError("Invalid or expired refresh token", 401);
  }

  // Delete old token (rotation)
  await db.refreshToken.delete({ where: { id: stored.id } });

  const user = stored.user;
  const jwtPayload: JwtPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    company_id: user.company_id,
  };

  const access_token = signAccessToken(jwtPayload);
  const refresh_token = signRefreshToken({ sub: user.id });

  // Store new hashed refresh token
  await db.refreshToken.create({
    data: {
      user_id: user.id,
      token: hashToken(refresh_token),
      expires_at: getRefreshExpiresAt(),
    },
  });

  return { access_token, refresh_token };
}

export async function logout(rawToken: string): Promise<void> {
  const hashed = hashToken(rawToken);
  await db.refreshToken.deleteMany({ where: { token: hashed } });
}

export async function getMe(userId: string): Promise<AuthUser> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { company: { select: { slug: true } } },
  });

  if (!user) throw new AuthError("User not found", 404);

  return {
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.role,
    company_id: user.company_id,
    company_slug: user.company?.slug ?? null,
  };
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "AuthError";
  }
}
