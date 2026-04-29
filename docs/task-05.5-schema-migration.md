# Task 05.5 — Schema Migration: AttendanceLog + AttendanceSession

## What Was Built

Refactored the attendance data model from a single check-in/out per day to a flexible multi-session model. This is a database-only change — no new API endpoints were added.

## Schema Changes

### AttendanceLog (modified)

**Removed fields:**
- `check_in_at`, `check_out_at`
- `check_in_lat`, `check_in_lng`, `check_out_lat`, `check_out_lng`
- `work_minutes`

**Added fields:**
- `total_work_minutes Int @default(0)` — aggregated total from all sessions
- `overtime_minutes Int @default(0)` — changed from nullable to required with default

**Unchanged:** `id`, `company_id`, `user_id`, `date`, `status`, `notes`, `created_at`, `updated_at`, `@@unique([user_id, date])`

### AttendanceSession (new model)

| Column           | Type       | Notes                              |
| ---------------- | ---------- | ---------------------------------- |
| `id`             | String     | UUID, primary key                  |
| `log_id`         | String     | FK → AttendanceLog (CASCADE delete)|
| `user_id`        | String     | FK → User                          |
| `company_id`     | String     | FK → Company                       |
| `check_in_at`    | DateTime   | Required                           |
| `check_out_at`   | DateTime?  | Nullable (open session)            |
| `check_in_lat`   | Float?     | GPS latitude at check-in           |
| `check_in_lng`   | Float?     | GPS longitude at check-in          |
| `check_out_lat`  | Float?     | GPS latitude at check-out          |
| `check_out_lng`  | Float?     | GPS longitude at check-out         |
| `duration_minutes`| Int?      | Computed on check-out              |
| `notes`          | String?    | Optional session note              |
| `created_at`     | DateTime   | Auto                               |
| `updated_at`     | DateTime   | Auto                               |

### Updated Relations

- `AttendanceLog.sessions → AttendanceSession[]`
- `User.attendance_sessions → AttendanceSession[]`
- `Company.attendance_sessions → AttendanceSession[]`

## Code Changes

- **`packages/db/prisma/schema.prisma`** — Updated `AttendanceLog`, added `AttendanceSession`, added relations to `User` and `Company`
- **`apps/api/src/modules/companies/companies.service.ts`** — Updated "checked in today" query to use `AttendanceSession` instead of removed `AttendanceLog.check_in_at` field

## Migration

Migration file: `packages/db/prisma/migrations/20260429122711_refactor_attendance_sessions/migration.sql`

No data migration was needed — no attendance data existed at the time of this change.

## Data Model (conceptual)

```
AttendanceLog (one per user per day)
  └── AttendanceSession[] (multiple check-in/out pairs per day)
```

Each session tracks a single check-in/check-out pair with GPS coordinates. The parent `AttendanceLog` holds the aggregated `total_work_minutes` and `overtime_minutes` for the day.
