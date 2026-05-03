import { db } from "@repo/db";
import { hashPassword } from "@repo/shared";
import { emailService } from "../../services/email.service";
import type { CreateEmployeeBody, UpdateEmployeeBody } from "./employees.schema";

export class EmployeeError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "EmployeeError";
  }
}

const employeeSelect = {
  id: true,
  email: true,
  first_name: true,
  last_name: true,
  role: true,
  phone: true,
  is_active: true,
  created_at: true,
  department: { select: { id: true, name: true } },
  shift: { select: { id: true, name: true, start_time: true, end_time: true } },
  manager: { select: { id: true, first_name: true, last_name: true } },
};

export async function listEmployees(
  companyId: string,
  userRole: string,
  userId: string,
  query: Record<string, string>,
) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { company_id: companyId };

  // Managers can only see their direct reports
  if (userRole === "MANAGER") {
    where.manager_id = userId;
  }

  if (query.department_id) {
    where.department_id = query.department_id;
  }
  if (query.shift_id) {
    where.shift_id = query.shift_id;
  }
  if (query.role) {
    where.role = query.role;
  }
  if (query.is_active !== undefined) {
    where.is_active = query.is_active === "true";
  }
  if (query.search) {
    where.OR = [
      { first_name: { contains: query.search, mode: "insensitive" } },
      { last_name: { contains: query.search, mode: "insensitive" } },
      { email: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const [employees, total] = await Promise.all([
    db.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
      select: employeeSelect,
    }),
    db.user.count({ where }),
  ]);

  return {
    data: employees,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  };
}

export async function createEmployee(companyId: string, body: CreateEmployeeBody) {
  const existing = await db.user.findUnique({
    where: { email_company_id: { email: body.email, company_id: companyId } },
  });
  if (existing) {
    throw new EmployeeError("Email already exists in this company", 409);
  }

  if (body.department_id) {
    const dept = await db.department.findFirst({
      where: { id: body.department_id, company_id: companyId },
    });
    if (!dept) throw new EmployeeError("Department not found", 404);
  }

  if (body.shift_id) {
    const shift = await db.shift.findFirst({
      where: { id: body.shift_id, company_id: companyId },
    });
    if (!shift) throw new EmployeeError("Shift not found", 404);
  }

  if (body.manager_id) {
    const manager = await db.user.findFirst({
      where: { id: body.manager_id, company_id: companyId, role: "MANAGER" },
    });
    if (!manager) throw new EmployeeError("Manager not found", 404);
  }

  const hashedPassword = await hashPassword(body.password);

  const employee = await db.user.create({
    data: {
      email: body.email,
      password: hashedPassword,
      first_name: body.first_name,
      last_name: body.last_name,
      role: body.role,
      phone: body.phone,
      company_id: companyId,
      department_id: body.department_id,
      shift_id: body.shift_id,
      manager_id: body.manager_id,
    },
    select: employeeSelect,
  });

  const company = await db.company.findUnique({
    where: { id: companyId },
    select: { name: true },
  });
  if (company) {
    await emailService.sendWelcome(
      { name: company.name },
      { email: employee.email, first_name: employee.first_name },
      body.password,
    );
  }

  return employee;
}

export async function getEmployee(companyId: string, employeeId: string, userRole: string, userId: string) {
  const where: Record<string, unknown> = {
    id: employeeId,
    company_id: companyId,
  };

  if (userRole === "MANAGER") {
    where.manager_id = userId;
  }

  const employee = await db.user.findFirst({
    where,
    select: employeeSelect,
  });

  if (!employee) {
    throw new EmployeeError("Employee not found", 404);
  }

  return employee;
}

export async function updateEmployee(companyId: string, employeeId: string, body: UpdateEmployeeBody) {
  const employee = await db.user.findFirst({
    where: { id: employeeId, company_id: companyId },
  });
  if (!employee) {
    throw new EmployeeError("Employee not found", 404);
  }

  if (body.department_id) {
    const dept = await db.department.findFirst({
      where: { id: body.department_id, company_id: companyId },
    });
    if (!dept) throw new EmployeeError("Department not found", 404);
  }

  if (body.shift_id) {
    const shift = await db.shift.findFirst({
      where: { id: body.shift_id, company_id: companyId },
    });
    if (!shift) throw new EmployeeError("Shift not found", 404);
  }

  if (body.manager_id) {
    const manager = await db.user.findFirst({
      where: { id: body.manager_id, company_id: companyId, role: "MANAGER" },
    });
    if (!manager) throw new EmployeeError("Manager not found", 404);
  }

  return db.user.update({
    where: { id: employeeId },
    data: body,
    select: employeeSelect,
  });
}

export async function deleteEmployee(companyId: string, employeeId: string, requesterId: string) {
  if (employeeId === requesterId) {
    throw new EmployeeError("Cannot deactivate yourself", 400);
  }

  const employee = await db.user.findFirst({
    where: { id: employeeId, company_id: companyId },
  });
  if (!employee) {
    throw new EmployeeError("Employee not found", 404);
  }

  return db.user.update({
    where: { id: employeeId },
    data: { is_active: false },
  });
}

export async function resetPassword(companyId: string, employeeId: string) {
  const employee = await db.user.findFirst({
    where: { id: employeeId, company_id: companyId },
  });
  if (!employee) {
    throw new EmployeeError("Employee not found", 404);
  }

  return employee;
}

export async function resetEmployeePassword(companyId: string, employeeId: string, newPassword: string) {
  const employee = await db.user.findFirst({
    where: { id: employeeId, company_id: companyId },
  });
  if (!employee) {
    throw new EmployeeError("Employee not found", 404);
  }

  const hashedPassword = await hashPassword(newPassword);

  await db.$transaction([
    db.user.update({
      where: { id: employeeId },
      data: { password: hashedPassword },
    }),
    db.refreshToken.deleteMany({
      where: { user_id: employeeId },
    }),
  ]);

  const company = await db.company.findUnique({
    where: { id: companyId },
    select: { name: true },
  });
  if (company) {
    await emailService.sendPasswordReset(
      { name: company.name },
      { email: employee.email, first_name: employee.first_name },
      newPassword,
    );
  }

  return { message: "Password reset successfully" };
}
