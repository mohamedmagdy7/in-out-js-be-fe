# Task 02 — Database Schema

## What Was Built

Full PostgreSQL database schema using Prisma ORM in `packages/db/prisma/schema.prisma`.

## Models

| Model | Purpose |
|-------|---------|
| `Company` | Multi-tenant root entity. Stores timezone, daily hours threshold, logo. |
| `User` | All users (super_admin, hr_admin, manager, employee). Scoped to a company. |
| `Department` | Organizational unit within a company. |
| `Shift` | Work schedule (start/end time). Optional per user. |
| `AttendanceLog` | Daily check-in/out records with GPS coordinates and computed work/overtime minutes. |
| `LeaveType` | Company-specific leave categories (Annual, Sick, etc.) with yearly allowance. |
| `LeaveRequest` | Employee leave requests with approval workflow (pending → approved/rejected). |
| `RefreshToken` | JWT refresh tokens for auth sessions. |

## Enums

- **Role**: `SUPER_ADMIN`, `HR_ADMIN`, `MANAGER`, `EMPLOYEE`
- **AttendanceStatus**: `PRESENT`, `ABSENT`, `LATE`, `HALF_DAY`, `ON_LEAVE`
- **LeaveStatus**: `PENDING`, `APPROVED`, `REJECTED`

## Key Design Decisions

- **UUIDs** for all primary keys (`@default(uuid())`)
- **Multi-tenancy** via `company_id` on all business models. Enforced at service layer, not Prisma middleware.
- **Email uniqueness** is per-company (`@@unique([email, company_id])`) — same email can exist in different companies.
- **Self-referential User relation** for manager-employee hierarchy (`ManagerEmployee` relation).
- **Date-only fields** on `AttendanceLog.date`, `LeaveRequest.start_date/end_date` using `@db.Date`.
- **Computed fields** `work_minutes` and `overtime_minutes` are calculated on check-out, not via DB triggers.
- **Logging middleware** in `src/index.ts` logs query timing in development mode.

## Seed Data

Run `pnpm --filter @repo/db db:seed` to populate:

| Entity | Details |
|--------|---------|
| Company | Acme Corp (`slug: acme`, timezone: Africa/Cairo) |
| Users | super@admin.com (SUPER_ADMIN), hr@acme.com (HR_ADMIN), manager@acme.com (MANAGER), alice@acme.com & bob@acme.com (EMPLOYEE) |
| Departments | Engineering, Operations |
| Shift | Standard (09:00–17:00, default) |
| Leave Types | Annual Leave (21 days), Sick Leave (10 days) |

All seed user passwords: `Admin123!`

## Commands

```bash
pnpm --filter @repo/db db:generate   # Generate Prisma client
pnpm --filter @repo/db db:migrate    # Run migrations
pnpm --filter @repo/db db:seed       # Seed database
```
