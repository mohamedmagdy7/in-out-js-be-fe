# Task 08 — Leave Management

## What Was Built

Leave request lifecycle: employees submit leave requests, managers/HR admins review (approve/reject), and leave balances are tracked per employee per year. Approving a request marks attendance logs as `ON_LEAVE` for each working day in the range. Rejecting or cancelling reverts those logs.

## API Routes

### Employee-facing

| Method | Path                          | Auth             | Description                        |
| ------ | ----------------------------- | ---------------- | ---------------------------------- |
| GET    | `/api/leave/types`            | Any authenticated | List company's leave types         |
| GET    | `/api/leave/balance`          | Any authenticated | My leave balance for current year  |
| GET    | `/api/leave/requests`         | Any authenticated | My leave requests (paginated)      |
| POST   | `/api/leave/requests`         | Any authenticated | Submit a leave request             |
| DELETE | `/api/leave/requests/:id`     | Any authenticated | Cancel a pending request           |

### Manager / HR Admin

| Method | Path                                    | Auth               | Description                              |
| ------ | --------------------------------------- | ------------------- | ---------------------------------------- |
| GET    | `/api/leave/requests/pending`           | HR_ADMIN, MANAGER   | Pending requests to review               |
| PATCH  | `/api/leave/requests/:id/approve`       | HR_ADMIN, MANAGER   | Approve a request                        |
| PATCH  | `/api/leave/requests/:id/reject`        | HR_ADMIN, MANAGER   | Reject a request with reason             |
| GET    | `/api/leave/requests/all`               | HR_ADMIN            | All requests with filters                |

## Endpoint Details

### POST /api/leave/requests

**Body**: `{ leave_type_id, start_date, end_date, reason? }`

Validation steps:
1. `start_date <= end_date`
2. Compute `total_days` using `getWorkingDays()` with company's `weekend_days` — excludes company-configured weekends
3. Check leave balance: `days_per_year - (approved + pending)` must be >= `total_days`, else returns `422` with `{ remaining: N }`
4. Check for overlapping approved/pending requests — returns `409` if conflict
5. Creates `LeaveRequest` with `status = PENDING`

### GET /api/leave/balance

Returns per-type balance for the current year:

```json
{
  "year": 2025,
  "balances": [
    {
      "leave_type": { "id": "uuid", "name": "Annual Leave", "is_paid": true },
      "days_per_year": 21,
      "days_used": 5,
      "days_pending": 3,
      "days_remaining": 13
    }
  ]
}
```

`days_remaining = days_per_year - days_used - days_pending` (both approved and pending count against balance).

### PATCH /api/leave/requests/:id/approve

- Sets `status = APPROVED`, `reviewed_by`, `reviewed_at`
- Upserts `AttendanceLog` for each working day in the range with `status = ON_LEAVE`
- Manager can only approve direct reports (verified via `manager_id`)

### PATCH /api/leave/requests/:id/reject

**Body**: `{ reason: "Project deadline" }`

- Sets `status = REJECTED`
- Reverts any `ON_LEAVE` attendance logs back to `ABSENT`
- Manager can only reject direct reports

### DELETE /api/leave/requests/:id

- Employee can only cancel `PENDING` requests
- HR_ADMIN can cancel any non-rejected request
- If an approved request is cancelled (HR_ADMIN), reverts `ON_LEAVE` attendance logs

### GET /api/leave/requests/pending

- Manager: shows only pending requests from their direct reports
- HR_ADMIN: shows all pending requests company-wide

### GET /api/leave/requests/all

HR_ADMIN only. Filters: `?status=APPROVED&from=2025-01-01&to=2025-12-31&employee_id=uuid&page=1&limit=30`

## File Structure

```
apps/api/src/modules/leave/
├── leave.router.ts      → Route definitions with auth/role middleware
├── leave.controller.ts  → Request handlers for all leave endpoints
├── leave.service.ts     → Business logic: CRUD, approval flow, balance checks
├── leave.schema.ts      → Zod schemas for request validation
└── leave.helpers.ts     → computeWorkingDays, getWorkingDatesList, checkOverlap, getRemainingBalance
```

## Key Decisions

1. **Reuses `getWorkingDays` from attendance helpers**: `computeWorkingDays` in `leave.helpers.ts` is a thin wrapper around the existing attendance helper, passing through the company's `weekend_days` configuration.

2. **Balance includes pending days**: `days_remaining = days_per_year - approved - pending`. This prevents employees from submitting multiple overlapping requests that exceed their balance.

3. **Attendance log upsert on approval**: When a request is approved, each working day in the range gets an `AttendanceLog` with `status = ON_LEAVE`. Uses `upsert` to handle cases where a log already exists for that date.

4. **Revert on rejection**: Rejecting a request sets any `ON_LEAVE` attendance logs in the date range back to `ABSENT`. This only affects logs that were created/updated by the approval flow.

5. **Manager scoping via `manager_id`**: Managers can only approve/reject requests from employees whose `manager_id` matches their user ID. HR_ADMIN has company-wide access.

6. **HR_ADMIN extended cancel**: HR admins can cancel approved requests (not just pending), triggering attendance log reversion. Regular employees can only cancel pending requests.

7. **Overlap detection**: Checks for any existing `APPROVED` or `PENDING` request whose date range intersects with the new request. Returns `409` if found.

## Business Rules

- Leave balance is per-employee, per-leave-type, per-year
- Both approved and pending days count against the balance
- Overlapping leave requests (same employee, overlapping dates) are rejected
- Approving marks attendance logs as `ON_LEAVE` for each working day
- Rejecting/cancelling reverts `ON_LEAVE` logs to `ABSENT`
- Managers can only manage leave for their direct reports
- HR_ADMIN has full access to all leave operations within their company
- All queries are scoped to `company_id` — no cross-company data access
- Weekend days are configurable per company (not hardcoded to Sat/Sun)
