# Task 06 — Check-In/Out Engine

## What Was Built

The core attendance engine allowing employees to check in and check out multiple times per day. Each check-in/out pair is stored as an `AttendanceSession`. A daily `AttendanceLog` accumulates total work minutes across all sessions and computes overtime on every check-out.

## API Routes

All routes require authentication (`authenticate` + `requireCompany`). Any authenticated user acts on themselves.

| Method | Path                      | Description                              |
| ------ | ------------------------- | ---------------------------------------- |
| POST   | `/api/attendance/check-in`  | Start a new session                     |
| POST   | `/api/attendance/check-out` | Close the current open session          |
| GET    | `/api/attendance/today`     | Today's log + all sessions              |
| GET    | `/api/attendance/status`    | Lightweight current state (for polling) |

### POST /api/attendance/check-in

**Body** (all optional):
```json
{ "lat": 31.2001, "lng": 29.9187, "notes": "optional note" }
```

- Finds or creates today's `AttendanceLog` for the user (date computed in company timezone)
- Returns `409` if an open session already exists
- First session of the day: checks shift start time + 15 min grace period to determine `LATE` status
- Subsequent sessions do not overwrite the log status

### POST /api/attendance/check-out

**Body** (all optional):
```json
{ "lat": 31.2001, "lng": 29.9187 }
```

- Closes the open session and computes `duration_minutes`
- Returns `404` if no open session exists
- Returns `422` if session is shorter than 1 minute
- Recomputes `total_work_minutes` and `overtime_minutes` on the daily log

### GET /api/attendance/today

Returns the full daily picture: log summary + all sessions, with `is_checked_in` and `active_session_id`.

### GET /api/attendance/status

Lightweight poll endpoint for the frontend. Returns `is_checked_in`, active session elapsed time, daily totals, threshold info, and `remaining_to_threshold`.

## File Structure

```
apps/api/src/modules/attendance/
├── attendance.router.ts      → Route definitions with middleware
├── attendance.controller.ts  → Request handlers
├── attendance.service.ts     → Business logic (checkIn, checkOut, getToday, getStatus)
├── attendance.schema.ts      → Zod validation schemas
└── attendance.helpers.ts     → todayInTimezone, formatDuration, isLate, recomputeLogTotals
```

## Dependencies Added

- `luxon` — timezone-aware date handling
- `@types/luxon` — TypeScript types (dev)

## Key Decisions

1. **Timezone handling via Luxon**: Today's date is computed using the company's configured timezone (`company.timezone`), so "today" is always correct for the employee's local calendar day, not UTC midnight.

2. **Multiple sessions per day**: Employees can check in/out any number of times (e.g. lunch breaks). Each pair is a separate `AttendanceSession` linked to a single daily `AttendanceLog`.

3. **One open session at a time**: Checking in while already checked in returns `409`. Must check out before checking in again.

4. **Late detection on first session only**: `LATE` status is set only when the first session of the day starts more than 15 minutes after the shift's `start_time`. Subsequent sessions never change the status.

5. **Live totals include active session**: The `today` and `status` endpoints add the active session's elapsed minutes to the stored `total_work_minutes`, so the employee sees real-time progress even before checking out. Stored log totals are persisted on each check-out. `overtime_minutes = max(0, live_total - daily_hours_threshold * 60)`.

6. **GPS always optional**: Coordinates are captured if provided but never block check-in/out.

7. **Minimum 1-minute session**: Check-out within 1 minute of check-in returns `422` to prevent accidental taps.

8. **No role restriction on routes**: All authenticated users with a company context can use these endpoints — every employee checks in for themselves.

## Business Rules

- An employee can check in and out any number of times per day
- Only one open session (`check_out_at = null`) allowed at a time
- `LATE` status determined only on the first session of the day
- `total_work_minutes` on the stored log = sum of all completed session durations, updated on check-out
- Read endpoints (`today`, `status`) return **live totals** = stored total + active session elapsed minutes
- `overtime_minutes` = `max(0, live_total_work_minutes - daily_hours_threshold * 60)`
- Minimum 1-minute session enforced
- All timestamps stored in UTC; dates computed in company timezone
