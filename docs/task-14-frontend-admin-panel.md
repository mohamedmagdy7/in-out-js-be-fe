# Task 14 — HR Admin Panel

What shipped, where to find it, and the backend changes the panel depends on.

## Routes

All routes are gated by `AuthGuard` → `RoleGuard(roles=["hr_admin"])` → `AdminShell` (declared once in `apps/web/src/app/admin/layout.tsx`).

| Path                          | File                                                  | Purpose                                                |
| ----------------------------- | ----------------------------------------------------- | ------------------------------------------------------ |
| `/admin`                      | `app/admin/page.tsx`                                  | KPI overview, live check-in feed, pending leave alert |
| `/admin/employees`            | `app/admin/employees/page.tsx`                        | List + filters + search, deactivate, reset password   |
| `/admin/employees/new`        | `app/admin/employees/new/page.tsx`                    | Create form (welcome email is sent server-side)        |
| `/admin/employees/:id`        | `app/admin/employees/[id]/page.tsx`                   | Tabs: Profile, Attendance, Leave, Reset Password       |
| `/admin/departments`          | `app/admin/departments/page.tsx`                      | Inline rename, add modal, delete blocked when in use   |
| `/admin/shifts`               | `app/admin/shifts/page.tsx`                           | Time pickers, default toggle, delete blocked when in use |
| `/admin/leave-types`          | `app/admin/leave-types/page.tsx`                      | Days/year, paid toggle, delete blocked when requests exist |
| `/admin/attendance`           | `app/admin/attendance/page.tsx`                       | Company-wide records, override modal, manual mark     |
| `/admin/leave`                | `app/admin/leave/page.tsx`                            | Pending / All tabs, approve, reject, cancel approved   |
| `/admin/reports`              | `app/admin/reports/page.tsx`                          | Attendance (department-grouped) / Overtime / Leave    |
| `/admin/settings`             | `app/admin/settings/page.tsx`                         | Name, timezone, daily hours threshold, weekend days   |

## Shell

`apps/web/src/components/admin/AdminShell.tsx` mirrors `ManagerShell.tsx` — same sticky header, theme toggle, sign-out, primary-soft avatar — but the nav array has nine entries. The nav uses `overflow-x-auto`, so it stays usable on narrow viewports. When you add more admin routes, append to the `NAV` constant and keep the same `icon: <LucideIcon>` shape.

## Reusable admin components

Under `apps/web/src/components/admin/`:

- **`KpiCard`** — dashboard summary tile. Props: `label`, `value`, optional `icon`, `tone`, `hint`. Tones map to the soft surface tokens (`primary-soft`, `success-soft`, `warning-soft`, `danger-soft`).
- **`LiveCheckInFeed`** — most recent check-in sessions (today). Driven by `fetchCompanyAttendance({ from: today, to: today })` with `refetchInterval: 120_000`.
- **`PendingLeaveAlert`** — warning-toned link banner to `/admin/leave` when there's outstanding work; hides itself at zero.
- **`EmployeeTable`** — pageable table with avatar + status badge and per-row icon actions (edit, reset password, deactivate). The deactivate button auto-disables when `is_active` is already false.
- **`EmployeeForm`** — handles both create and edit. In create mode it asks for email/password/role and shows a hint that a welcome email will be sent; in edit mode those fields are hidden and the submit is disabled until the form is dirty.
- **`AttendanceOverrideModal`** — opens for a single `TeamAttendanceLog` row. Lets HR edit the status, and for each session edit times (`<Input type="datetime-local">`) or delete it. All mutations call the existing `/api/attendance/admin/*` endpoints and invalidate `["admin", "attendance"]`.
- **`ManualMarkModal`** — picks an employee, date, status, and optional note, then `POST /api/attendance/admin/mark`.
- **`WeekendDaysField`** — 7-day checkbox grid with preset buttons (Fri+Sat, Sat+Sun, Sat only). Blocks save when all 7 days are checked, and shows a soft warning when fewer than 2 working days remain.

## API client and types

- All HR-admin calls live in `apps/web/src/lib/api/admin.ts`.
- New shared types in `apps/web/src/lib/api/types.ts`: `Department`, `Shift`, `LeaveTypeFull`, `CompanyConfig`, `CompanyStats`.
- New `queryKeys.admin.*` namespace in `apps/web/src/lib/query/keys.ts` for cache invalidation.
- Where the manager already had a useful endpoint, the admin page reuses it directly (e.g. `fetchAttendanceReport`, `approveLeaveRequest`, `rejectLeaveRequest`, `exportAttendanceCsv/Pdf`). The admin role gives the same endpoints company-wide scope on the server.

## Backend additions

| Endpoint                          | Method | Auth        | Notes                                                |
| --------------------------------- | ------ | ----------- | ---------------------------------------------------- |
| `/api/leave/types`                | POST   | `HR_ADMIN`  | Create a leave type                                  |
| `/api/leave/types/:id`            | PATCH  | `HR_ADMIN`  | Rename / change days / change paid flag              |
| `/api/leave/types/:id`            | DELETE | `HR_ADMIN`  | Blocked when leave requests exist                    |
| `/api/companies/me`               | GET    | `HR_ADMIN`  | Read own company config                              |
| `/api/companies/me`               | PATCH  | `HR_ADMIN`  | Update name / timezone / threshold / weekend days    |
| `/api/companies/me/stats`         | GET    | `HR_ADMIN`  | KPI numbers used on `/admin`                         |

The leave types service now also returns `_count.leave_requests` from `GET /api/leave/types` so the leave-types table can show how many requests exist before allowing deletion. The companies update flow (controller + service) was reused for the new HR routes — they're scoped by the authenticated user's `company_id`, so HR admins can only touch their own company.

## Notable UI patterns introduced

These were added to `docs/ui-theme.md` so future pages share them:

1. **KPI cards** — `components/admin/KpiCard.tsx` for dashboard tiles.
2. **Filter bar** — `grid gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4`, used by every admin list/table page.
3. **Pill tab toggle** — used on `/admin/leave` (Pending / All) and `/admin/reports` (Attendance / Overtime / Leave). Active pill: `bg-primary text-primary-foreground shadow-sm`.
4. **Inline rename in tables** — the row's name cell swaps for an `Input` plus check/cancel `IconButton`s; Enter submits, Escape cancels (`/admin/departments`).
5. **Empty state** — `rounded-lg border border-dashed border-border bg-surface px-6 py-10 text-center text-sm text-foreground-muted` is now the standard for "no records yet" placeholders across tables and tabs.

## Acceptance criteria coverage

- [x] Creating an employee shows them in the table immediately — `createEmployee` invalidates `["admin", "employees"]` and `companyStats`.
- [x] Resetting password from employee detail sends the email — the existing `PATCH /api/employees/:id/reset-password` already calls `emailService.sendPasswordReset`.
- [x] Deactivating an employee marks them inactive — `DELETE /api/employees/:id` flips `is_active`; the table refreshes via cache invalidation.
- [x] Attendance override updates the row without page refresh — every mutation in `AttendanceOverrideModal` invalidates `["admin", "attendance"]`.
- [x] Leave type deletion blocked when active requests exist — enforced on the server (`leave.service.deleteLeaveType`), and the UI also disables the delete button when `_count.leave_requests > 0`.
- [x] Company timezone change reflected everywhere — settings call `PATCH /api/companies/me` and the company record is the single source consumed by the reports/attendance services.
- [x] Weekend days selector pre-fills with company's `weekend_days` — `WeekendDaysField` is seeded from the query data.
- [x] Selecting all 7 days blocked with inline validation — the field shows `FieldError` and disables the submit button.
- [x] Quick-select preset buttons set the checkboxes — Fri+Sat / Sat+Sun / Sat only.
- [x] Saving weekend days calls `PATCH /api/companies/me` and shows a success toast.

## Personal check-in on the overview

`/admin` (and `/manager`) now embed the same `CheckInButton` that the employee dashboard uses. The check-in/out endpoints were never role-gated — only `authenticate + requireCompany` — and attendance reports already scoped by `is_active: true` (not by role), so managers and HR admins were appearing in reports while having no way to log sessions. Surfacing the button here closes that gap without changing any backend logic. The component reuses `queryKeys.attendance.status` and invalidates the same cache keys as the employee version, so the existing employee dashboard stays in sync if the same user opens both views.

## Known not-shipped

- Logo upload to S3 is not in scope yet — the API accepts `logo_url`, but the UI does not surface it. Add an upload primitive before wiring it up.
- The Leave tab inside the employee detail page links the user to `/admin/leave` filtered by them; we did not embed the full leave-history table there to keep the detail page tight.
