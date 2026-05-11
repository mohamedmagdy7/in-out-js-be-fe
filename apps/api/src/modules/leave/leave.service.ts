import { db } from "@repo/db";
import {
  computeWorkingDays,
  getWorkingDatesList,
  checkOverlap,
  getRemainingBalance,
} from "./leave.helpers";
import { emailService } from "../../services/email.service";
import type { CreateLeaveRequestBody, LeaveRequestQuery } from "./leave.schema";

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export class LeaveError extends Error {
  status: number;
  extra?: Record<string, unknown>;
  constructor(message: string, status: number, extra?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.extra = extra;
    this.name = "LeaveError";
  }
}

async function getCompany(companyId: string) {
  const company = await db.company.findUnique({ where: { id: companyId } });
  if (!company) throw new LeaveError("Company not found", 404);
  return company;
}

// ─── Leave Types ─────────────────────────────────────────

export async function getLeaveTypes(companyId: string) {
  return db.leaveType.findMany({
    where: { company_id: companyId },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { leave_requests: true } },
    },
  });
}

export async function createLeaveType(
  companyId: string,
  body: { name: string; days_per_year: number; is_paid: boolean },
) {
  const existing = await db.leaveType.findUnique({
    where: { company_id_name: { company_id: companyId, name: body.name } },
  });
  if (existing) {
    throw new LeaveError("Leave type with this name already exists", 409);
  }
  return db.leaveType.create({
    data: {
      company_id: companyId,
      name: body.name,
      days_per_year: body.days_per_year,
      is_paid: body.is_paid,
    },
  });
}

export async function updateLeaveType(
  companyId: string,
  id: string,
  body: { name?: string; days_per_year?: number; is_paid?: boolean },
) {
  const leaveType = await db.leaveType.findFirst({
    where: { id, company_id: companyId },
  });
  if (!leaveType) {
    throw new LeaveError("Leave type not found", 404);
  }
  if (body.name && body.name !== leaveType.name) {
    const dup = await db.leaveType.findUnique({
      where: { company_id_name: { company_id: companyId, name: body.name } },
    });
    if (dup) {
      throw new LeaveError("Leave type with this name already exists", 409);
    }
  }
  return db.leaveType.update({
    where: { id },
    data: body,
  });
}

export async function deleteLeaveType(companyId: string, id: string) {
  const leaveType = await db.leaveType.findFirst({
    where: { id, company_id: companyId },
  });
  if (!leaveType) {
    throw new LeaveError("Leave type not found", 404);
  }
  const inUse = await db.leaveRequest.count({
    where: { leave_type_id: id, company_id: companyId },
  });
  if (inUse > 0) {
    throw new LeaveError(
      "Cannot delete a leave type that has existing requests",
      409,
    );
  }
  return db.leaveType.delete({ where: { id } });
}

// ─── Leave Balance ───────────────────────────────────────

export async function getMyBalance(userId: string, companyId: string) {
  const leaveTypes = await db.leaveType.findMany({
    where: { company_id: companyId },
  });

  const year = new Date().getFullYear();

  const balances = await Promise.all(
    leaveTypes.map(async (lt) => {
      const balance = await getRemainingBalance(userId, companyId, lt.id, year);
      return {
        leave_type: { id: lt.id, name: lt.name, is_paid: lt.is_paid },
        ...balance,
      };
    }),
  );

  return { year, balances };
}

// ─── Employee: My Leave Requests ─────────────────────────

export async function getMyRequests(
  userId: string,
  companyId: string,
  query: LeaveRequestQuery,
) {
  const where: any = { user_id: userId, company_id: companyId };
  if (query.status) where.status = query.status;
  if (query.from || query.to) {
    where.start_date = {};
    if (query.from) where.start_date.gte = new Date(`${query.from}T00:00:00.000Z`);
    if (query.to) where.start_date.lte = new Date(`${query.to}T00:00:00.000Z`);
  }

  const [requests, total] = await Promise.all([
    db.leaveRequest.findMany({
      where,
      include: {
        leave_type: { select: { id: true, name: true, is_paid: true } },
        reviewer: { select: { id: true, first_name: true, last_name: true } },
      },
      orderBy: { created_at: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    db.leaveRequest.count({ where }),
  ]);

  return {
    data: requests,
    pagination: { page: query.page, limit: query.limit, total },
  };
}

// ─── Employee: Create Leave Request ──────────────────────

export async function createLeaveRequest(
  userId: string,
  companyId: string,
  body: CreateLeaveRequestBody,
) {
  const company = await getCompany(companyId);

  // Validate dates
  if (body.start_date > body.end_date) {
    throw new LeaveError("start_date must be before or equal to end_date", 400);
  }

  // Compute working days
  const totalDays = computeWorkingDays(body.start_date, body.end_date, company.weekend_days);
  if (totalDays === 0) {
    throw new LeaveError("No working days in the selected range", 400);
  }

  // Verify leave type exists for this company
  const leaveType = await db.leaveType.findFirst({
    where: { id: body.leave_type_id, company_id: companyId },
  });
  if (!leaveType) {
    throw new LeaveError("Leave type not found", 404);
  }

  // Check balance
  const year = new Date(body.start_date).getFullYear();
  const balance = await getRemainingBalance(userId, companyId, body.leave_type_id, year);

  if (totalDays > balance.days_remaining) {
    throw new LeaveError("Insufficient leave balance", 422, {
      remaining: balance.days_remaining,
    });
  }

  // Check overlap
  const hasOverlap = await checkOverlap(userId, companyId, body.start_date, body.end_date);
  if (hasOverlap) {
    throw new LeaveError("Overlapping leave request exists for the selected dates", 409);
  }

  // Create the leave request
  const request = await db.leaveRequest.create({
    data: {
      company_id: companyId,
      user_id: userId,
      leave_type_id: body.leave_type_id,
      start_date: new Date(`${body.start_date}T00:00:00.000Z`),
      end_date: new Date(`${body.end_date}T00:00:00.000Z`),
      total_days: totalDays,
      reason: body.reason,
      status: "PENDING",
    },
    include: {
      leave_type: { select: { id: true, name: true, is_paid: true } },
    },
  });

  // Notify reviewers (manager + HR admins)
  const employee = await db.user.findUnique({
    where: { id: userId },
    select: { first_name: true, last_name: true, email: true, manager_id: true },
  });

  if (employee) {
    const reviewers = await db.user.findMany({
      where: {
        company_id: companyId,
        is_active: true,
        OR: [
          { role: "HR_ADMIN" },
          ...(employee.manager_id ? [{ id: employee.manager_id }] : []),
        ],
      },
      select: { id: true, email: true, first_name: true },
    });

    if (reviewers.length > 0) {
      await emailService.sendLeaveSubmitted(
        { name: company.name },
        { email: employee.email, first_name: employee.first_name, last_name: employee.last_name },
        reviewers.map((r) => ({ email: r.email, first_name: r.first_name })),
        {
          leave_type_name: leaveType.name,
          start_date: body.start_date,
          end_date: body.end_date,
          total_days: totalDays,
          reason: body.reason ?? null,
        },
      );
    }
  }

  return request;
}

// ─── Employee: Cancel Leave Request ──────────────────────

export async function cancelLeaveRequest(
  userId: string,
  companyId: string,
  requestId: string,
  userRole: string,
) {
  const request = await db.leaveRequest.findFirst({
    where: { id: requestId, company_id: companyId },
  });

  if (!request) {
    throw new LeaveError("Leave request not found", 404);
  }

  // HR_ADMIN can cancel any non-rejected request
  if (userRole === "HR_ADMIN") {
    if (request.status === "REJECTED") {
      throw new LeaveError("Cannot cancel a rejected request", 400);
    }
  } else {
    // Employee can only cancel their own pending requests
    if (request.user_id !== userId) {
      throw new LeaveError("Access denied", 403);
    }
    if (request.status !== "PENDING") {
      throw new LeaveError("Only pending requests can be cancelled", 400);
    }
  }

  // If the request was approved, revert attendance logs
  if (request.status === "APPROVED") {
    const workingDates = getWorkingDatesList(
      request.start_date.toISOString().slice(0, 10),
      request.end_date.toISOString().slice(0, 10),
      (await getCompany(companyId)).weekend_days,
    );

    await db.attendanceLog.updateMany({
      where: {
        user_id: request.user_id,
        company_id: companyId,
        status: "ON_LEAVE",
        date: {
          in: workingDates.map((d) => new Date(`${d}T00:00:00.000Z`)),
        },
      },
      data: { status: "ABSENT" },
    });
  }

  // Delete the request
  await db.leaveRequest.delete({ where: { id: requestId } });

  return { message: "Leave request cancelled" };
}

// ─── Manager/HR: Pending Requests ────────────────────────

export async function getPendingRequests(
  userId: string,
  companyId: string,
  userRole: string,
  query: LeaveRequestQuery,
) {
  const where: any = {
    company_id: companyId,
    status: query.status ?? "PENDING",
  };

  // Manager can only see their direct reports
  if (userRole === "MANAGER") {
    const directReports = await db.user.findMany({
      where: { manager_id: userId, company_id: companyId, is_active: true },
      select: { id: true },
    });
    where.user_id = { in: directReports.map((u) => u.id) };
  }

  const orderBy = where.status === "PENDING"
    ? ({ created_at: "asc" } as const)
    : ({ reviewed_at: "desc" } as const);

  const [requests, total] = await Promise.all([
    db.leaveRequest.findMany({
      where,
      include: {
        user: { select: { id: true, first_name: true, last_name: true, department: { select: { name: true } } } },
        leave_type: { select: { id: true, name: true, is_paid: true } },
        reviewer: { select: { id: true, first_name: true, last_name: true } },
      },
      orderBy,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    db.leaveRequest.count({ where }),
  ]);

  return {
    data: requests,
    pagination: { page: query.page, limit: query.limit, total },
  };
}

// ─── Manager/HR: Approve Request ─────────────────────────

export async function approveRequest(
  reviewerId: string,
  companyId: string,
  requestId: string,
  reviewerRole: string,
) {
  const request = await db.leaveRequest.findFirst({
    where: { id: requestId, company_id: companyId },
  });

  if (!request) {
    throw new LeaveError("Leave request not found", 404);
  }

  if (request.status !== "PENDING") {
    throw new LeaveError(`Cannot approve a ${request.status.toLowerCase()} request`, 400);
  }

  // Manager can only approve their direct reports
  if (reviewerRole === "MANAGER") {
    const employee = await db.user.findUnique({ where: { id: request.user_id } });
    if (!employee || employee.manager_id !== reviewerId) {
      throw new LeaveError("Access denied. Employee is not your direct report.", 403);
    }
  }

  const company = await getCompany(companyId);

  // Update request status
  const updated = await db.leaveRequest.update({
    where: { id: requestId },
    data: {
      status: "APPROVED",
      reviewed_by: reviewerId,
      reviewed_at: new Date(),
    },
    include: {
      user: { select: { id: true, first_name: true, last_name: true } },
      leave_type: { select: { id: true, name: true } },
    },
  });

  // Mark attendance logs as ON_LEAVE for each working day
  const workingDates = getWorkingDatesList(
    request.start_date.toISOString().slice(0, 10),
    request.end_date.toISOString().slice(0, 10),
    company.weekend_days,
  );

  for (const dateStr of workingDates) {
    const date = new Date(`${dateStr}T00:00:00.000Z`);

    await db.attendanceLog.upsert({
      where: { user_id_date: { user_id: request.user_id, date } },
      update: { status: "ON_LEAVE" },
      create: {
        company_id: companyId,
        user_id: request.user_id,
        date,
        status: "ON_LEAVE",
        total_work_minutes: 0,
        overtime_minutes: 0,
      },
    });
  }

  // Notify employee
  const employee = await db.user.findUnique({
    where: { id: request.user_id },
    select: { email: true, first_name: true },
  });
  const reviewer = await db.user.findUnique({
    where: { id: reviewerId },
    select: { first_name: true, last_name: true },
  });
  if (employee && reviewer) {
    await emailService.sendLeaveDecision(
      { name: company.name },
      { email: employee.email, first_name: employee.first_name },
      `${reviewer.first_name} ${reviewer.last_name}`,
      "APPROVED",
      {
        leave_type_name: updated.leave_type.name,
        start_date: isoDate(request.start_date),
        end_date: isoDate(request.end_date),
        total_days: request.total_days,
        reason: request.reason ?? null,
      },
    );
  }

  return updated;
}

// ─── Manager/HR: Reject Request ──────────────────────────

export async function rejectRequest(
  reviewerId: string,
  companyId: string,
  requestId: string,
  reviewerRole: string,
  reason: string,
) {
  const request = await db.leaveRequest.findFirst({
    where: { id: requestId, company_id: companyId },
  });

  if (!request) {
    throw new LeaveError("Leave request not found", 404);
  }

  if (request.status !== "PENDING") {
    throw new LeaveError(`Cannot reject a ${request.status.toLowerCase()} request`, 400);
  }

  // Manager can only reject their direct reports
  if (reviewerRole === "MANAGER") {
    const employee = await db.user.findUnique({ where: { id: request.user_id } });
    if (!employee || employee.manager_id !== reviewerId) {
      throw new LeaveError("Access denied. Employee is not your direct report.", 403);
    }
  }

  const company = await getCompany(companyId);

  // Revert any ON_LEAVE attendance logs back to ABSENT
  const workingDates = getWorkingDatesList(
    request.start_date.toISOString().slice(0, 10),
    request.end_date.toISOString().slice(0, 10),
    company.weekend_days,
  );

  await db.attendanceLog.updateMany({
    where: {
      user_id: request.user_id,
      company_id: companyId,
      status: "ON_LEAVE",
      date: {
        in: workingDates.map((d) => new Date(`${d}T00:00:00.000Z`)),
      },
    },
    data: { status: "ABSENT" },
  });

  const updated = await db.leaveRequest.update({
    where: { id: requestId },
    data: {
      status: "REJECTED",
      reviewed_by: reviewerId,
      reviewed_at: new Date(),
      reason,
    },
    include: {
      user: { select: { id: true, first_name: true, last_name: true } },
      leave_type: { select: { id: true, name: true } },
    },
  });

  // Notify employee
  const employee = await db.user.findUnique({
    where: { id: request.user_id },
    select: { email: true, first_name: true },
  });
  const reviewer = await db.user.findUnique({
    where: { id: reviewerId },
    select: { first_name: true, last_name: true },
  });
  if (employee && reviewer) {
    await emailService.sendLeaveDecision(
      { name: company.name },
      { email: employee.email, first_name: employee.first_name },
      `${reviewer.first_name} ${reviewer.last_name}`,
      "REJECTED",
      {
        leave_type_name: updated.leave_type.name,
        start_date: isoDate(request.start_date),
        end_date: isoDate(request.end_date),
        total_days: request.total_days,
        reason,
      },
    );
  }

  return updated;
}

// ─── HR Admin: All Requests ──────────────────────────────

export async function getAllRequests(companyId: string, query: LeaveRequestQuery) {
  const where: any = { company_id: companyId };

  if (query.status) where.status = query.status;
  if (query.employee_id) where.user_id = query.employee_id;
  if (query.from || query.to) {
    where.start_date = {};
    if (query.from) where.start_date.gte = new Date(`${query.from}T00:00:00.000Z`);
    if (query.to) where.start_date.lte = new Date(`${query.to}T00:00:00.000Z`);
  }

  const [requests, total] = await Promise.all([
    db.leaveRequest.findMany({
      where,
      include: {
        user: { select: { id: true, first_name: true, last_name: true, department: { select: { name: true } } } },
        leave_type: { select: { id: true, name: true, is_paid: true } },
        reviewer: { select: { id: true, first_name: true, last_name: true } },
      },
      orderBy: { created_at: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    db.leaveRequest.count({ where }),
  ]);

  return {
    data: requests,
    pagination: { page: query.page, limit: query.limit, total },
  };
}
