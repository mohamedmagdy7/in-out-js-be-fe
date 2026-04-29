import { db } from "@repo/db";

export class DepartmentError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "DepartmentError";
  }
}

export async function listDepartments(companyId: string) {
  return db.department.findMany({
    where: { company_id: companyId },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { users: true } },
    },
  });
}

export async function createDepartment(companyId: string, name: string) {
  const existing = await db.department.findUnique({
    where: { company_id_name: { company_id: companyId, name } },
  });
  if (existing) {
    throw new DepartmentError("Department name already exists", 409);
  }

  return db.department.create({
    data: { company_id: companyId, name },
  });
}

export async function updateDepartment(companyId: string, id: string, name: string) {
  const dept = await db.department.findFirst({
    where: { id, company_id: companyId },
  });
  if (!dept) {
    throw new DepartmentError("Department not found", 404);
  }

  const duplicate = await db.department.findUnique({
    where: { company_id_name: { company_id: companyId, name } },
  });
  if (duplicate && duplicate.id !== id) {
    throw new DepartmentError("Department name already exists", 409);
  }

  return db.department.update({
    where: { id },
    data: { name },
  });
}

export async function deleteDepartment(companyId: string, id: string) {
  const dept = await db.department.findFirst({
    where: { id, company_id: companyId },
  });
  if (!dept) {
    throw new DepartmentError("Department not found", 404);
  }

  const employeeCount = await db.user.count({
    where: { department_id: id, company_id: companyId },
  });
  if (employeeCount > 0) {
    throw new DepartmentError(
      "Cannot delete department with assigned employees",
      409,
    );
  }

  return db.department.delete({ where: { id } });
}
