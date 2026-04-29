# Task 08 — Leave Management

## Goal
Employees request leave. Managers or HR Admins approve/reject. Track leave balances per employee per year.

## Endpoints

### Employee-facing
```
GET    /api/leave/types                  → list available leave types for company
GET    /api/leave/balance                → my leave balance for current year
GET    /api/leave/requests               → my leave requests
POST   /api/leave/requests               → submit leave request
DELETE /api/leave/requests/:id           → cancel pending request
```

### Manager / HR Admin
```
GET    /api/leave/requests/pending       → pending requests to review (own team for MANAGER, all for HR_ADMIN)
PATCH  /api/leave/requests/:id/approve   → approve request
PATCH  /api/leave/requests/:id/reject    → reject request with reason
GET    /api/leave/requests/all           → all requests with filters (HR_ADMIN)
```

---

## Endpoint Specs

### `POST /api/leave/requests`
**Body**:
```json
{
  "leave_type_id": "uuid",
  "start_date": "2025-04-01",
  "end_date": "2025-04-03",
  "reason": "Family trip"
}
```

**Logic**:
1. Validate `start_date <= end_date`
2. Fetch the employee's company to get `company.weekend_days`
3. Compute `total_days` = number of working days in range using `getWorkingDays(start_date, end_date, company.weekend_days)` — excludes the company's weekend days, not a hardcoded Mon–Fri
4. Check leave balance: get employee's `days_per_year` for this type, subtract already-approved days this year
5. If `total_days > remaining_balance`, return `422` with `{ message: "Insufficient leave balance", remaining: N }`
6. Check for overlapping approved/pending requests in the same date range — return `409` if conflict
7. Create `LeaveRequest` with `status = PENDING`
8. Create or update `AttendanceLog` records for each **working day** in range (skip weekend days) with `status = ON_LEAVE` (only for already-existing logs that haven't been checked in)

### `GET /api/leave/balance`
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

### `PATCH /api/leave/requests/:id/approve`
- `HR_ADMIN` or `MANAGER` (only for their direct report)
- Sets `status = APPROVED`, `reviewed_by = req.user.id`, `reviewed_at = now()`
- Updates `AttendanceLog` for each day in range to `status = ON_LEAVE`

### `PATCH /api/leave/requests/:id/reject`
**Body**: `{ reason: "Project deadline" }`
- Sets `status = REJECTED`
- Reverts any `AttendanceLog` entries that were set to `ON_LEAVE` back to their original status

### `DELETE /api/leave/requests/:id`
- Employee can only cancel `PENDING` requests
- Cannot cancel `APPROVED` request (must ask HR Admin)
- HR Admin can cancel any non-rejected request

---

## Leave Balance Calculation
```typescript
function getRemainingBalance(
  userId: string,
  leaveTypeId: string,
  year: number
): Promise<number> {
  // 1. Get leave_type.days_per_year
  // 2. Sum total_days of APPROVED requests for this user+type in given year
  // 3. Return days_per_year - approved_days
}
```

---

## File Structure
```
apps/api/src/modules/leave/
├── leave.router.ts
├── leave.controller.ts
├── leave.service.ts
└── leave.helpers.ts     → computeWorkingDays, checkOverlap, getRemainingBalance
```

> `computeWorkingDays` is a thin wrapper around `getWorkingDays` from `attendance.helpers.ts` — import and reuse it, do not reimplement. Always pass `company.weekend_days`.

---

## Acceptance Criteria
- [ ] Requesting 5 days when only 3 remain returns `422` with remaining balance
- [ ] Overlapping leave request returns `409`
- [ ] Approving a request marks attendance logs for those days as `ON_LEAVE`
- [ ] Rejecting a request reverts the `ON_LEAVE` attendance status
- [ ] Manager can only approve/reject leave for their direct reports
- [ ] Cancelled pending request restores the leave balance
- [ ] `GET /api/leave/balance` correctly subtracts both approved and pending days