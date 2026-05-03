# Task 09 — Reports & Export

## What Was Built

Aggregated reporting endpoints for attendance, overtime, leave usage, and a live dashboard summary, plus CSV and PDF exporters for attendance. All report endpoints honor scope (HR_ADMIN: company-wide, MANAGER: direct reports only) and apply the live-enrichment rule: when a date range includes today (in company timezone), open sessions contribute their elapsed minutes to the totals on the fly without persisting.

## API Routes

All routes require `HR_ADMIN` or `MANAGER` and a valid company context.

| Method | Path                          | Auth                | Description                                       |
| ------ | ----------------------------- | ------------------- | ------------------------------------------------- |
| GET    | `/api/reports/attendance`     | HR_ADMIN, MANAGER   | Per-employee attendance stats for a date range    |
| GET    | `/api/reports/overtime`       | HR_ADMIN, MANAGER   | Employees ranked by overtime (descending)         |
| GET    | `/api/reports/leave`          | HR_ADMIN, MANAGER   | Per-employee leave balances by type for a year    |
| GET    | `/api/reports/summary`        | HR_ADMIN, MANAGER   | Live dashboard counts for today + this month      |
| POST   | `/api/reports/export/csv`     | HR_ADMIN, MANAGER   | Stream attendance report as CSV download          |
| POST   | `/api/reports/export/pdf`     | HR_ADMIN, MANAGER   | Stream attendance report as PDF download          |

## Endpoint Details

### GET /api/reports/attendance

**Params**: `from=YYYY-MM-DD&to=YYYY-MM-DD&department_id=&employee_id=&status=`

- `from`/`to` are required.
- `status` filters individual logs; per-employee aggregates only count logs that match.
- Working-day denominator for `attendance_rate` uses the company's `weekend_days`.
- If the range includes today, each employee's today log is enriched with elapsed minutes from any open session before contributing to totals — stored values are not modified.
- `includes_live_data` is `true` when the range covers today.
- `has_active_session` is `true` for an employee row when their today log has an open session.

### GET /api/reports/overtime

**Params**: `from=YYYY-MM-DD&to=YYYY-MM-DD&department_id=&min_hours=1`

- Returns employees sorted by `total_overtime_minutes` descending.
- Live enrichment applies to today's overtime contribution.
- `min_hours` filters out employees below that overtime threshold (default 0).
- `overtime_days` = number of logs in the range with positive overtime.

### GET /api/reports/leave

**Params**: `year=2025&department_id=&leave_type_id=`

- Defaults to current year.
- Returns each employee with their balances (used / pending / remaining) per leave type.
- Reuses `getRemainingBalance` from the leave module so balance numbers match `/api/leave/balance`.

### GET /api/reports/summary

No params — always reflects the requester's scope.

- `today.checked_in` = employees with an open session right now.
- `today.not_checked_in` = scoped employees minus checked_in minus on_leave.
- `today.total_live_work_minutes` = sum of enriched work minutes for today across all scoped employees.
- `this_month.avg_attendance_rate` = average attendance rate over the calendar month, using working days from `weekend_days`.
- `this_month.total_overtime_hours` = month-to-date overtime, with today's logs live-enriched.
- `this_month.pending_leave_requests` = count of `PENDING` requests for scoped employees.

### POST /api/reports/export/csv

**Body**: same shape as the attendance report query (`from`, `to`, optional filters).

- Streams as `text/csv` with `Content-Disposition: attachment`.
- Filename: `attendance-{from}-to-{to}.csv`.
- Columns: `Employee Name, Department, Date, Sessions Count, Total Work Hours, Overtime, Status, Live`.
- One row per employee per log in the range.
- The `Live` column is `"yes"` when that day's log has an active session today, empty otherwise.
- Dates rendered in the company timezone.

### POST /api/reports/export/pdf

**Body**: same shape as the attendance report query.

- Streams as `application/pdf` with `Content-Disposition: attachment`.
- Filename: `attendance-{from}-to-{to}.pdf`.
- Includes: company name header, period, summary block (total employees, avg rate, total work hours, total overtime), per-employee table (name, department, present/absent/late/leave counts, work hours, overtime, attendance rate).
- Names with an active today-session are marked with a trailing `*`.
- Pagination: header redrawn on each page when the table overflows.

## File Structure

```
apps/api/src/modules/reports/
├── reports.router.ts            → Mount + auth/role middleware
├── reports.controller.ts        → Request handlers
├── reports.service.ts           → Aggregation + live enrichment
├── reports.schema.ts            → Zod schemas for queries / export bodies
└── exporters/
    ├── csv.exporter.ts          → fast-csv stream writer
    └── pdf.exporter.ts          → pdfkit document builder
```

## Key Decisions

1. **Live enrichment via existing helper**: Reuses `enrichWithActiveSession` from `attendance.helpers.ts`. The service computes a `todayInTimezone` once per request and only enriches logs whose `date` matches today and that contain an open session. Stored `total_work_minutes` / `overtime_minutes` are never written.

2. **`includes_live_data` flag**: Simple boolean derived from `today >= from && today <= to`. The frontend uses this to decide whether to poll/refresh the report.

3. **Scoping in one helper**: `getScopedEmployees` builds the user `where` filter with role logic — `MANAGER` adds `manager_id = requesterId`, `HR_ADMIN` gets the whole company. Department / employee filters layer on top.

4. **Working-day attendance rate**: Uses the same `getWorkingDays` helper that powers the attendance summary so weekend configuration is honored consistently.

5. **Two service entrypoints for attendance**: `getAttendanceReport` returns the lean response (no per-day rows) for the JSON endpoint. `getAttendanceReportFull` returns the same data plus `daily_logs` and the `company` object — used by the CSV/PDF exporters so they don't have to refetch.

6. **CSV via `fast-csv` streaming**: Headers are inferred from the first row's keys. The stream pipes directly to `res`, so memory usage stays flat for large companies.

7. **PDF via `pdfkit` with manual columns**: No third-party table library. The exporter draws fixed-width columns, redrawing the header when `doc.y` crosses the page bottom.

8. **Summary scoped to requester**: The dashboard summary respects the same `MANAGER`/`HR_ADMIN` scope as other reports — managers see numbers for their team, HR admins see company-wide. Pending leave count is filtered by the same scoped user IDs.

## Business Rules

- Live enrichment never persists — stored log values remain authoritative.
- A range is "live" when today (in company timezone) falls between `from` and `to` inclusive.
- Managers can only access stats for employees with `manager_id = manager.id`.
- HR_ADMIN sees all active employees in their company.
- Pending leave count in summary reflects only the requester's scope.
- All queries are scoped to `company_id` — no cross-company leakage.
- Weekend days come from `company.weekend_days`, not hardcoded.

## Dependencies Added

```
pnpm --filter api add pdfkit fast-csv
pnpm --filter api add -D @types/pdfkit
```
