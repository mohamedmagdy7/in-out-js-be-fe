import { db } from "@repo/db";
import { hashPassword } from "@repo/shared";
import type { CreateCompanyBody, UpdateCompanyBody, InviteAdminBody } from "./companies.schema";

export class CompanyError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "CompanyError";
  }
}

export async function listCompanies(query: {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: string;
}) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { slug: { contains: query.search, mode: "insensitive" } },
    ];
  }

  if (query.is_active !== undefined) {
    where.is_active = query.is_active === "true";
  }

  const [companies, total] = await Promise.all([
    db.company.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
      include: {
        _count: { select: { users: true } },
      },
    }),
    db.company.count({ where }),
  ]);

  return {
    data: companies.map((c) => ({
      ...c,
      employee_count: c._count.users,
      _count: undefined,
    })),
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  };
}

export async function createCompany(body: CreateCompanyBody) {
  const existing = await db.company.findUnique({ where: { slug: body.slug } });
  if (existing) {
    throw new CompanyError("Slug already taken", 409);
  }

  const company = await db.company.create({
    data: {
      name: body.name,
      slug: body.slug,
      timezone: body.timezone,
      daily_hours_threshold: body.daily_hours_threshold,
      weekend_days: body.weekend_days,
    },
  });

  // Auto-create default leave types
  await db.leaveType.createMany({
    data: [
      { company_id: company.id, name: "Annual Leave", days_per_year: 21, is_paid: true },
      { company_id: company.id, name: "Sick Leave", days_per_year: 10, is_paid: true },
    ],
  });

  // Auto-create default shift
  await db.shift.create({
    data: {
      company_id: company.id,
      name: "Standard",
      start_time: "09:00",
      end_time: "17:00",
      is_default: true,
    },
  });

  return company;
}

export async function getCompany(id: string) {
  const company = await db.company.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  });

  if (!company) {
    throw new CompanyError("Company not found", 404);
  }

  return { ...company, employee_count: company._count.users, _count: undefined };
}

export async function updateCompany(id: string, body: UpdateCompanyBody) {
  const company = await db.company.findUnique({ where: { id } });
  if (!company) {
    throw new CompanyError("Company not found", 404);
  }

  return db.company.update({
    where: { id },
    data: body,
  });
}

export async function deleteCompany(id: string) {
  const company = await db.company.findUnique({ where: { id } });
  if (!company) {
    throw new CompanyError("Company not found", 404);
  }

  return db.company.update({
    where: { id },
    data: { is_active: false },
  });
}

export async function inviteAdmin(companyId: string, body: InviteAdminBody) {
  const company = await db.company.findUnique({ where: { id: companyId } });
  if (!company) {
    throw new CompanyError("Company not found", 404);
  }
  if (!company.is_active) {
    throw new CompanyError("Company is deactivated", 400);
  }

  const existingUser = await db.user.findUnique({
    where: { email_company_id: { email: body.email, company_id: companyId } },
  });
  if (existingUser) {
    throw new CompanyError("Email already exists in this company", 409);
  }

  const hashedPassword = await hashPassword(body.password);

  const user = await db.user.create({
    data: {
      email: body.email,
      first_name: body.first_name,
      last_name: body.last_name,
      password: hashedPassword,
      role: "HR_ADMIN",
      company_id: companyId,
    },
    select: {
      id: true,
      email: true,
      first_name: true,
      last_name: true,
      role: true,
      company_id: true,
      created_at: true,
    },
  });

  return user;
}

export async function getCompanyStats(companyId: string) {
  const company = await db.company.findUnique({ where: { id: companyId } });
  if (!company) {
    throw new CompanyError("Company not found", 404);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalEmployees,
    activeEmployees,
    checkedInToday,
    onLeaveToday,
    departmentsCount,
  ] = await Promise.all([
    db.user.count({ where: { company_id: companyId } }),
    db.user.count({ where: { company_id: companyId, is_active: true } }),
    db.attendanceSession.count({
      where: {
        company_id: companyId,
        check_in_at: { gte: today },
        check_out_at: null,
      },
    }),
    db.leaveRequest.count({
      where: {
        company_id: companyId,
        status: "APPROVED",
        start_date: { lte: today },
        end_date: { gte: today },
      },
    }),
    db.department.count({ where: { company_id: companyId } }),
  ]);

  return {
    total_employees: totalEmployees,
    active_employees: activeEmployees,
    checked_in_today: checkedInToday,
    on_leave_today: onLeaveToday,
    departments_count: departmentsCount,
  };
}
