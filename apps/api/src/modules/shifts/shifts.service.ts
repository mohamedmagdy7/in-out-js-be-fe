import { db } from "@repo/db";

export class ShiftError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ShiftError";
  }
}

export async function listShifts(companyId: string) {
  return db.shift.findMany({
    where: { company_id: companyId },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { users: true } },
    },
  });
}

export async function createShift(
  companyId: string,
  body: { name: string; start_time: string; end_time: string; is_default?: boolean },
) {
  const existing = await db.shift.findUnique({
    where: { company_id_name: { company_id: companyId, name: body.name } },
  });
  if (existing) {
    throw new ShiftError("Shift name already exists", 409);
  }

  return db.shift.create({
    data: {
      company_id: companyId,
      name: body.name,
      start_time: body.start_time,
      end_time: body.end_time,
      is_default: body.is_default ?? false,
    },
  });
}

export async function updateShift(
  companyId: string,
  id: string,
  body: { name?: string; start_time?: string; end_time?: string; is_default?: boolean },
) {
  const shift = await db.shift.findFirst({
    where: { id, company_id: companyId },
  });
  if (!shift) {
    throw new ShiftError("Shift not found", 404);
  }

  if (body.name && body.name !== shift.name) {
    const duplicate = await db.shift.findUnique({
      where: { company_id_name: { company_id: companyId, name: body.name } },
    });
    if (duplicate) {
      throw new ShiftError("Shift name already exists", 409);
    }
  }

  return db.shift.update({
    where: { id },
    data: body,
  });
}

export async function deleteShift(companyId: string, id: string) {
  const shift = await db.shift.findFirst({
    where: { id, company_id: companyId },
  });
  if (!shift) {
    throw new ShiftError("Shift not found", 404);
  }

  const employeeCount = await db.user.count({
    where: { shift_id: id, company_id: companyId },
  });
  if (employeeCount > 0) {
    throw new ShiftError("Cannot delete shift with assigned employees", 409);
  }

  return db.shift.delete({ where: { id } });
}
