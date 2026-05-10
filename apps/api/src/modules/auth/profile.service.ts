import { db } from "@repo/db";
import { hashPassword, comparePassword } from "../../utils/password";
import { AuthError } from "./auth.service";
import type { UpdateProfileBody, ChangePasswordBody } from "./profile.schema";

const profileSelect = {
  id: true,
  email: true,
  first_name: true,
  last_name: true,
  phone: true,
  avatar_url: true,
  role: true,
  is_active: true,
  created_at: true,
  company: {
    select: {
      id: true,
      name: true,
      slug: true,
      timezone: true,
      daily_hours_threshold: true,
      weekend_days: true,
    },
  },
  department: { select: { id: true, name: true } },
  shift: { select: { id: true, name: true, start_time: true, end_time: true } },
  manager: { select: { id: true, first_name: true, last_name: true } },
} as const;

export async function getProfile(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: profileSelect,
  });
  if (!user) throw new AuthError("User not found", 404);
  return user;
}

export async function updateProfile(userId: string, body: UpdateProfileBody) {
  const data: Record<string, unknown> = {};
  if (body.first_name !== undefined) data.first_name = body.first_name;
  if (body.last_name !== undefined) data.last_name = body.last_name;
  if (body.phone !== undefined) data.phone = body.phone;

  if (Object.keys(data).length === 0) {
    return getProfile(userId);
  }

  const user = await db.user.update({
    where: { id: userId },
    data,
    select: profileSelect,
  });
  return user;
}

export async function changePassword(
  userId: string,
  body: ChangePasswordBody,
) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, password: true },
  });
  if (!user) throw new AuthError("User not found", 404);

  const valid = await comparePassword(body.current_password, user.password);
  if (!valid) throw new AuthError("Current password is incorrect", 401);

  if (body.current_password === body.new_password) {
    throw new AuthError(
      "New password must be different from current password",
      400,
    );
  }

  const hashed = await hashPassword(body.new_password);

  await db.$transaction([
    db.user.update({
      where: { id: userId },
      data: { password: hashed },
    }),
    db.refreshToken.deleteMany({
      where: { user_id: userId },
    }),
  ]);

  return { message: "Password changed successfully" };
}
