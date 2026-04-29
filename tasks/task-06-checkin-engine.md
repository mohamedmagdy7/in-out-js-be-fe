# Task 06 — Check-In/Out Engine (Flexible Sessions)

## Goal
The core feature. Employees can check in and check out multiple times per day (e.g. to accommodate lunch breaks or leaving and returning). Each check-in/out pair is stored as an `AttendanceSession`. The daily `AttendanceLog` accumulates total work minutes across all sessions and computes overtime at the end of each session.

## Data Model Recap (from Task 02)
```
AttendanceLog     → one record per employee per day (daily summary)
AttendanceSession → one record per check-in/out pair (N per day)
```

The employee is considered **currently checked in** when there is an open session (`check_out_at = null`) for today.

---

## Endpoints

```
POST   /api/attendance/check-in          → start a new session
POST   /api/attendance/check-out         → close the current open session
GET    /api/attendance/today             → today's log + all sessions
GET    /api/attendance/status            → lightweight current state
```

All routes: `authenticate` (any authenticated user acts on themselves)

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
1. Get today's date in the company's timezone (`todayInTimezone(company.timezone)`)
2. Check for an open session today (`check_out_at = null`) — if one exists, return `409`:
   ```json
   { "message": "Already checked in. Please check out before checking in again." }
   ```
3. Find or create today's `AttendanceLog` for `(user_id, date)`:
   - If creating: set `status = PRESENT`
   - Determine if first session of the day is late: if user has a shift and `now() > shift.start_time + 15 min grace`, and this is session #1, set `log.status = LATE`
   - If log already exists (subsequent session): keep existing status
4. Create a new `AttendanceSession`:
   - `check_in_at = now()`
   - `check_in_lat`, `check_in_lng` from body (null if not provided)
   - `check_out_at = null` (open session)
5. Return the session + updated log

**Response**:
```json
{
  "session": {
    "id": "uuid",
    "check_in_at": "2025-03-15T09:02:00Z",
    "check_in_lat": 31.2001,
    "check_in_lng": 29.9187
  },
  "log": {
    "id": "uuid",
    "date": "2025-03-15",
    "status": "PRESENT",
    "total_work_minutes": 240,
    "overtime_minutes": 0,
    "sessions_count": 2
  }
}
```

---

### `POST /api/attendance/check-out`
**Body**:
```json
{
  "lat": 31.2001,
  "lng": 29.9187
}
```

**Logic**:
1. Find today's open session (`check_out_at = null`) for the user — return `404` if none:
   ```json
   { "message": "No active check-in found. Please check in first." }
   ```
2. Validate minimum session duration: if `now() - check_in_at < 1 minute`, return `422`:
   ```json
   { "message": "Session too short. Please wait at least 1 minute before checking out." }
   ```
3. Compute `duration_minutes = diff(now(), session.check_in_at)` in minutes
4. Update the session: `check_out_at`, `check_out_lat/lng`, `duration_minutes`
5. Recompute the daily log totals:
   ```typescript
   // Sum duration_minutes of ALL completed sessions for this log
   const completedSessions = await db.attendanceSession.findMany({
     where: { log_id: log.id, check_out_at: { not: null } }
   })
   const total_work_minutes = completedSessions.reduce((sum, s) => sum + s.duration_minutes, 0)
   const threshold_minutes = company.daily_hours_threshold * 60
   const overtime_minutes = Math.max(0, total_work_minutes - threshold_minutes)
   ```
6. Update `AttendanceLog`: `total_work_minutes`, `overtime_minutes`
7. Return the closed session + updated log

**Response**:
```json
{
  "session": {
    "id": "uuid",
    "check_in_at": "2025-03-15T09:02:00Z",
    "check_out_at": "2025-03-15T13:00:00Z",
    "duration_minutes": 238,
    "formatted_duration": "3h 58m"
  },
  "log": {
    "id": "uuid",
    "date": "2025-03-15",
    "status": "PRESENT",
    "total_work_minutes": 478,
    "overtime_minutes": 0,
    "sessions_count": 2,
    "formatted": {
      "total_work_hours": "7h 58m",
      "overtime": "0h 0m",
      "remaining_to_threshold": "0h 2m"
    }
  }
}
```

`remaining_to_threshold` = how many more minutes the employee needs to reach the daily threshold. Returns `"0h 0m"` once threshold is met.

---

### `GET /api/attendance/today`
Returns today's full picture: the log summary + all sessions.

**Response**:
```json
{
  "log": {
    "id": "uuid",
    "date": "2025-03-15",
    "status": "PRESENT",
    "total_work_minutes": 478,
    "overtime_minutes": 0,
    "formatted": {
      "total_work_hours": "7h 58m",
      "overtime": "0h 0m"
    }
  },
  "sessions": [
    {
      "id": "uuid",
      "check_in_at": "2025-03-15T09:02:00Z",
      "check_out_at": "2025-03-15T13:00:00Z",
      "duration_minutes": 238,
      "formatted_duration": "3h 58m",
      "check_in_lat": 31.2001,
      "check_in_lng": 29.9187
    },
    {
      "id": "uuid",
      "check_in_at": "2025-03-15T14:00:00Z",
      "check_out_at": null,
      "duration_minutes": null,
      "formatted_duration": null
    }
  ],
  "is_checked_in": true,
  "active_session_id": "uuid"
}
```

Returns `null` for `log` if no activity today yet.

---

### `GET /api/attendance/status`
Lightweight poll endpoint — used by frontend to decide which button to show.

**Response**:
```json
{
  "is_checked_in": true,
  "active_session": {
    "id": "uuid",
    "check_in_at": "2025-03-15T14:00:00Z",
    "elapsed_minutes": 62
  },
  "today_total_minutes": 478,
  "today_overtime_minutes": 0,
  "threshold_minutes": 480,
  "threshold_met": false,
  "remaining_to_threshold": 2
}
```

---

## Helper Functions (`attendance.helpers.ts`)

```typescript
// Today's date in a given timezone (date only, no time)
export function todayInTimezone(timezone: string): Date

// Format minutes → "Xh Ym"
export function formatDuration(minutes: number): string

// Is the first check-in of the day late?
export function isLate(shiftStartTime: string, checkInAt: Date, timezone: string): boolean
// shiftStartTime = "09:00", grace period = 15 minutes

// Recompute log totals from all completed sessions
export async function recomputeLogTotals(
  logId: string,
  thresholdMinutes: number
): Promise<{ total_work_minutes: number; overtime_minutes: number }>
```

---

## Business Rules
- An employee can check in and out **any number of times per day**
- Only one open session (no `check_out_at`) is allowed at a time — must check out before checking in again
- `LATE` status is determined only on the **first session** of the day
- `total_work_minutes` = sum of all completed session durations (open session not counted until closed)
- `overtime_minutes` = `max(0, total_work_minutes - daily_hours_threshold * 60)`, recalculated on every check-out
- GPS coordinates are always optional — never block check-in/out due to missing location
- Employees on approved leave today: check-in is still allowed

---

## File Structure
```
apps/api/src/modules/attendance/
├── attendance.router.ts
├── attendance.controller.ts
├── attendance.service.ts
└── attendance.helpers.ts    → todayInTimezone, formatDuration, isLate, recomputeLogTotals
```

---

## Dependencies
```bash
pnpm --filter api add luxon
pnpm --filter api add -D @types/luxon
```

---

## Acceptance Criteria
- [ ] Check-in creates a new `AttendanceSession` and a new `AttendanceLog` (if first session of the day)
- [ ] Checking in while already checked in (open session) returns `409`
- [ ] Checking in after checking out creates a second session on the same `AttendanceLog`
- [ ] Check-out closes the open session and recomputes `total_work_minutes` on the log
- [ ] `total_work_minutes` correctly sums across multiple sessions (e.g. 4h + 4h = 8h)
- [ ] `overtime_minutes` correctly computed: 9h total with 8h threshold → 60 min overtime
- [ ] `LATE` status only set on first session check-in of the day
- [ ] Second and third check-ins do not overwrite `LATE` status with `PRESENT`
- [ ] `GET /api/attendance/status` returns `is_checked_in: true` when open session exists
- [ ] `remaining_to_threshold` counts down correctly as more sessions are completed
- [ ] Timezone respected: "Africa/Cairo" employee midnight UTC = next calendar day locally
- [ ] Minimum 1-minute session enforced — check-out within 1 min returns `422`
