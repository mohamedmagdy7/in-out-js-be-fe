# Task 07 — Attendance Records & History

## What Was Built

Attendance history, summary, and admin override endpoints. Employees see their own records, managers see their direct reports, HR admins see the whole company. All list endpoints apply **live enrichment** — if a log is for today and has an open session, the active session's elapsed time is added to `total_work_minutes` on the fly (not persisted).

## API Routes

### History & Summary Endpoints

| Method | Path                                 | Auth                 | Description                                      |
| ------ | ------------------------------------ | -------------------- | ------------------------------------------------ |
| GET    | `/api/attendance/my`                 | Any authenticated    | Own attendance history (paginated, filterable)    |
| GET    | `/api/attendance/employees/:id`      | HR_ADMIN, MANAGER    | Specific employee's attendance records            |
| GET    | `/api/attendance/team`               | MANAGER              | Manager's direct reports attendance               |
| GET    | `/api/attendance/company`            | HR_ADMIN             | Company-wide attendance (filterable by dept/user) |
| GET    | `/api/attendance/summary/me`         | Any authenticated    | Own monthly/weekly attendance summary             |
| GET    | `/api/attendance/summary/employee/:id` | HR_ADMIN, MANAGER  | Specific employee's summary                       |

### Admin Override Endpoints (HR_ADMIN only)

| Method | Path                                  | Description                        |
| ------ | ------------------------------------- | ---------------------------------- |
| POST   | `/api/attendance/admin/mark`          | Manually mark a day (e.g. ABSENT)  |
| PATCH  | `/api/attendance/admin/logs/:id`      | Edit log status/notes              |
| POST   | `/api/attendance/admin/sessions`      | Add a manual session to a log      |
| PATCH  | `/api/attendance/admin/sessions/:id`  | Edit a session's times             |
| DELETE | `/api/attendance/admin/sessions/:id`  | Remove a session                   |

## Endpoint Details

### GET /api/attendance/my

Query params: `?from=2025-01-01&to=2025-01-31&status=LATE&page=1&limit=30`

Returns paginated attendance logs for the authenticated user. Each log includes its sessions array. Logs for today with an open session return `is_live: true` and include the active session's elapsed time in `total_work_minutes`.

### GET /api/attendance/company

HR_ADMIN only. Additional filters: `?department_id=&employee_id=`

Same structure as `/my` but for all employees, with a `user` object nested in each entry containing `id`, `full_name`, and `department`.

### GET /api/attendance/team

MANAGER only. Scoped to employees with `manager_id = req.user.id`. Same live enrichment and structure as company endpoint.

### GET /api/attendance/summary/me

Query: `?period=monthly&year=2025&month=3` OR `?period=weekly&week_start=2025-03-10`

Returns aggregate stats: `working_days`, `days_present`, `days_absent`, `days_late`, `days_on_leave`, `total_work_minutes`, `total_overtime_minutes`, and `formatted.attendance_rate`.

### POST /api/attendance/admin/mark

Creates an `AttendanceLog` with `total_work_minutes = 0` and no sessions. Used for marking absences or leave without session data.

### POST /api/attendance/admin/sessions

Adds a manual session to an existing log. Computes `duration_minutes` from the provided times and triggers `recomputeLogTotals` after insertion.

### PATCH /api/attendance/admin/sessions/:id

Edits an existing session's check-in/check-out times. Recomputes `duration_minutes` and triggers `recomputeLogTotals`.

### DELETE /api/attendance/admin/sessions/:id

Removes a session and triggers `recomputeLogTotals` on the parent log.

## File Structure

```
apps/api/src/modules/attendance/
├── attendance.router.ts      → All routes (task 06 + task 07) with role-based middleware
├── attendance.controller.ts  → Request handlers for all endpoints
├── attendance.service.ts     → Business logic: history queries, summaries, admin overrides
├── attendance.schema.ts      → Zod schemas for all request validation
└── attendance.helpers.ts     → todayInTimezone, formatDuration, isLate, recomputeLogTotals,
                                enrichWithActiveSession, getWorkingDays, computeSummary
```

## Key Decisions

1. **Live enrichment via helper**: `enrichWithActiveSession()` is called for any log whose date equals today. It computes elapsed minutes from the active session's check-in time to `now()` and adds them to `total_work_minutes`. The stored log remains unchanged until actual check-out.

2. **`is_live` flag**: Returned on every log entry. `true` means the displayed `total_work_minutes` includes an active session's elapsed time — the frontend can show a pulsing indicator.

3. **Manager scoping**: `GET /team` returns only direct reports (`manager_id = req.user.id`). `GET /employees/:id` for managers additionally verifies the target employee's `manager_id` matches the requester.

4. **Query param validation via Zod**: Since the `validate` middleware only handles `req.body`, attendance query params are parsed inline in each controller handler using `attendanceQuerySchema.parse(req.query)` with coercion for numeric fields.

5. **Working days calculation**: Excludes Saturday (weekday 6) and Sunday (weekday 7). Custom weekend configuration is not yet supported.

6. **`attendance_rate`**: Computed as `days_present / working_days * 100`. Days marked `LATE` or `HALF_DAY` still count as present for this metric.

7. **Admin recompute pattern**: Every admin session mutation (add/edit/delete) calls `recomputeLogTotals()` after the operation to keep the parent log's `total_work_minutes` and `overtime_minutes` consistent.

8. **Admin mark prevents duplicates**: `POST /admin/mark` returns `409` if a log already exists for that user+date combination.

## Business Rules

- All list endpoints apply live enrichment for today's logs with open sessions
- Past logs always return stored values with `is_live: false`
- Managers cannot access `/api/attendance/company` (returns 403)
- Managers can only view attendance for their direct reports
- HR_ADMIN can view and modify attendance for any employee in their company
- Summary `attendance_rate = days_present / working_days * 100`
- Admin mark creates a log with zero work minutes and no sessions
- All admin session mutations trigger log total recomputation
- All queries are scoped to `company_id` — no cross-company data access
