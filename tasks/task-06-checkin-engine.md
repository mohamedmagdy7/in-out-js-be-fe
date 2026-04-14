# Task 06 — Check-In/Out Engine

## Goal
The core feature. Employees check in and check out. The system captures GPS coordinates, prevents duplicate check-ins on the same day, and validates business rules.

## Endpoints

```
POST   /api/attendance/check-in          → employee checks in
POST   /api/attendance/check-out         → employee checks out
GET    /api/attendance/today             → get own today's status
GET    /api/attendance/status            → { is_checked_in, checked_in_at }
```

All routes: `authenticate` (any role can call check-in/check-out for themselves)

---

## Endpoint Specs

### `POST /api/attendance/check-in`
**Body**:
```json
{
  "lat": 31.2001,
  "lng": 29.9187,
  "notes": "optional note"
}
```

**Logic**:
1. Get today's date in the company's timezone (use `company.timezone`)
2. Check if an `AttendanceLog` already exists for `(user_id, date)` — if yes, return `409 Already checked in today`
3. Create `AttendanceLog`:
   - `check_in_at = now()`
   - `check_in_lat`, `check_in_lng` from body (both optional — store null if not provided)
   - `date` = today in company timezone
   - `status = PRESENT`
   - Determine if late: if user has a shift and current time > `shift.start_time + 15min grace`, set `status = LATE`
4. Return the created log

**Response**:
```json
{
  "id": "uuid",
  "date": "2025-03-15",
  "check_in_at": "2025-03-15T08:02:00Z",
  "status": "PRESENT",
  "shift": { "name": "Standard", "start_time": "09:00" }
}
```

### `POST /api/attendance/check-out`
**Body**:
```json
{
  "lat": 31.2001,
  "lng": 29.9187
}
```

**Logic**:
1. Find today's `AttendanceLog` for user — return `404` if none
2. Return `409` if already checked out (`check_out_at` is not null)
3. Compute `work_minutes = diff(now(), check_in_at)` in minutes
4. Compute `overtime_minutes`:
   - Get `company.daily_hours_threshold` (default 8h = 480 min)
   - `overtime_minutes = max(0, work_minutes - threshold_in_minutes)`
5. Update log: `check_out_at`, `check_out_lat/lng`, `work_minutes`, `overtime_minutes`
6. Return updated log

**Response**:
```json
{
  "id": "uuid",
  "check_in_at": "2025-03-15T07:00:00Z",
  "check_out_at": "2025-03-15T16:30:00Z",
  "work_minutes": 570,
  "overtime_minutes": 90,
  "formatted": {
    "work_hours": "9h 30m",
    "overtime": "1h 30m"
  }
}
```

### `GET /api/attendance/today`
- Returns today's `AttendanceLog` for the authenticated user
- Returns `null` if not checked in yet

### `GET /api/attendance/status`
- Lightweight status check (used by frontend to show the check-in/out button)
```json
{
  "is_checked_in": true,
  "is_checked_out": false,
  "checked_in_at": "2025-03-15T07:00:00Z",
  "can_check_out": true
}
```

---

## Helper: Timezone-aware Date
```typescript
// utils/date.ts
import { DateTime } from 'luxon'

export function todayInTimezone(timezone: string): Date {
  return DateTime.now().setZone(timezone).startOf('day').toJSDate()
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}
```

Install `luxon` for timezone handling.

---

## Business Rules
- One check-in per employee per calendar day (in their company's timezone)
- Check-out must be after check-in (enforce minimum 1 minute between them)
- GPS coordinates are optional — never block check-in due to missing location
- `LATE` status set automatically based on shift — no manual override needed here
- Employees on approved leave today: check-in is still allowed (they may cancel leave)

---

## File Structure
```
apps/api/src/modules/attendance/
├── attendance.router.ts
├── attendance.controller.ts
├── attendance.service.ts
└── attendance.helpers.ts    → formatDuration, isLate, computeOvertime
```

---

## Acceptance Criteria
- [ ] Checking in twice on the same day returns `409`
- [ ] Checking out without checking in returns `404`
- [ ] `work_minutes` and `overtime_minutes` are computed correctly on check-out
- [ ] Employee with a shift that starts at 09:00 checking in at 09:20 gets `status = LATE`
- [ ] `GET /api/attendance/status` returns correct state at each stage (before check-in, after check-in, after check-out)
- [ ] Timezone is respected: employee in "Africa/Cairo" (UTC+2) checking in at midnight UTC is on the next day locally
- [ ] Documentation added to `docs/` folder covering what was built, API routes, and key decisions
