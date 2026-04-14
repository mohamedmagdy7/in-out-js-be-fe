# Employee Check-In/Out System — Project Overview

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS
- **Backend**: Node.js + Express (REST API)
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: JWT (access + refresh tokens)
- **Monorepo**: Turborepo
- **Cache/Sessions**: Redis
- **File Storage**: AWS S3 (avatars, exports)
- **Realtime**: Socket.io (optional, for live dashboard)

## Architecture

```
apps/
  web/          → Next.js frontend (employees + managers + admin)
  api/          → Express backend
packages/
  db/           → Prisma schema + migrations
  shared/       → Shared types, constants, utils
```

## User Roles

| Role          | Scope                                                  |
| ------------- | ------------------------------------------------------ |
| `super_admin` | Manages companies (SaaS level)                         |
| `hr_admin`    | Manages employees, settings, reports for their company |
| `manager`     | Views & exports their team's attendance                |
| `employee`    | Check in/out, view own records, request leave          |

## Multi-Tenancy

Every record is scoped to a `company_id`. Row-level isolation is enforced via Prisma middleware. No cross-company data leakage.

## Task Execution Order

Run tasks **in order** — each one builds on the previous.

| #   | File                                     | What it builds                                        |
| --- | ---------------------------------------- | ----------------------------------------------------- |
| 01  | `task-01-monorepo-setup.md`              | Turborepo + packages scaffold                         |
| 02  | `task-02-database-schema.md`             | Full Prisma schema                                    |
| 03  | `task-03-auth.md`                        | JWT auth (register, login, refresh, roles)            |
| 04  | `task-04-company-management.md`          | Super admin: CRUD companies + invite HR admin         |
| 05  | `task-05-employee-management.md`         | HR admin: CRUD employees, departments, shifts         |
| 06  | `task-06-checkin-engine.md`              | Check-in/out API + location capture                   |
| 07  | `task-07-attendance-records.md`          | Work hours calc, overtime, daily/monthly summaries    |
| 08  | `task-08-leave-management.md`            | Leave requests, approvals, balances                   |
| 09  | `task-09-reports.md`                     | Attendance reports + CSV/PDF export                   |
| 10  | `task-10-notifications.md`               | Email notifications (missed check-in, leave approval) |
| 11  | `task-11-frontend-auth.md`               | Login/register UI + role-based routing                |
| 12  | `task-12-frontend-employee-dashboard.md` | Employee: check-in button, history, leave requests    |
| 13  | `task-13-frontend-manager-dashboard.md`  | Manager: team live status, attendance table           |
| 14  | `task-14-frontend-admin-panel.md`        | HR Admin: employee management, reports UI             |
| 15  | `task-15-frontend-superadmin.md`         | Super admin: company management UI                    |

## Key Domain Rules

- Check-in logs GPS coordinates (lat/lng) but does NOT restrict access by location
- Overtime = hours worked beyond `company.daily_hours_threshold` (default: 8h)
- Leave requests flow: `pending → approved | rejected` (manager or hr_admin can approve)
- Shifts are optional — companies can configure fixed shifts or use free check-in
- All timestamps stored in UTC; displayed in company's configured timezone
