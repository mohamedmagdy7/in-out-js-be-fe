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
2. Compute `total_days` = number of weekdays (Mon–Fri) in range
3. Check leave balance: get employee's `days_per_year` for this type, subtract already-approved days this year
4. If `total_days > remaining_balance`, return `422` with `{ message: "Insufficient leave balance", remaining: N }`
5. Check for overlapping approved/pending requests in the same date range — return `409` if conflict
6. Create `LeaveRequest` with `status = PENDING`
7. Create or update `AttendanceLog` records for each day in range with `status = ON_LEAVE` (only for already-existing logs that haven't been checked in)

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
└── leave.helpers.ts     → computeWeekdays, checkOverlap, getRemainingBalance
```

---

## Acceptance Criteria
- [ ] Requesting 5 days when only 3 remain returns `422` with remaining balance
- [ ] Overlapping leave request returns `409`
- [ ] Approving a request marks attendance logs for those days as `ON_LEAVE`
- [ ] Rejecting a request reverts the `ON_LEAVE` attendance status
- [ ] Manager can only approve/reject leave for their direct reports
- [ ] Cancelled pending request restores the leave balance
- [ ] `GET /api/leave/balance` correctly subtracts both approved and pending days
- [ ] Documentation added to `docs/` folder covering what was built, API routes, and key decisions
