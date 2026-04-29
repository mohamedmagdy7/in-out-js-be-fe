# Task 05.5 — Schema Migration: AttendanceLog + AttendanceSession

## Context
Tasks 01–05 are already implemented. The original `AttendanceLog` model was designed for a single check-in/out per day. We are now switching to a flexible multi-session model before any attendance data exists.

This task is **purely a database change** — no API logic, no frontend. It only touches `packages/db`.

---

## What Needs to Change

### 1. Modify `AttendanceLog`
Remove the raw check-in/out fields and replace them with aggregated totals.

**Remove these fields:**
- `check_in_at`
- `check_out_at`
- `check_in_lat`
- `check_in_lng`
- `check_out_lat`
- `check_out_lng`
- `work_minutes`

**Add these fields:**
- `total_work_minutes  Int  @default(0)`
- `overtime_minutes    Int  @default(0)`

**Keep everything else unchanged:**
- `id`, `company_id`, `user_id`, `date`, `status`, `notes`, `created_at`, `updated_at`
- `@@unique([user_id, date])` constraint stays

### 2. Add `AttendanceSession` model (new)
```prisma
model AttendanceSession {
  id               String    @id @default(uuid())
  log_id           String
  user_id          String
  company_id       String
  check_in_at      DateTime
  check_out_at     DateTime?
  check_in_lat     Float?
  check_in_lng     Float?
  check_out_lat    Float?
  check_out_lng    Float?
  duration_minutes Int?
  notes            String?
  created_at       DateTime  @default(now())
  updated_at       DateTime  @updatedAt

  log     AttendanceLog @relation(fields: [log_id], references: [id], onDelete: Cascade)
  user    User          @relation(fields: [user_id], references: [id])
  company Company       @relation(fields: [company_id], references: [id])
}
```

### 3. Update `AttendanceLog` relations
Add the sessions relation to `AttendanceLog`:
```prisma
sessions AttendanceSession[]
```

### 4. Update `User` model
Add the new relation:
```prisma
attendance_sessions AttendanceSession[]
```

### 5. Update `Company` model
Add the new relation:
```prisma
attendance_sessions AttendanceSession[]
```

---

## Updated `AttendanceLog` (full model for reference)
```prisma
model AttendanceLog {
  id                   String           @id @default(uuid())
  company_id           String
  user_id              String
  date                 DateTime         @db.Date
  total_work_minutes   Int              @default(0)
  overtime_minutes     Int              @default(0)
  status               AttendanceStatus @default(PRESENT)
  notes                String?
  created_at           DateTime         @default(now())
  updated_at           DateTime         @updatedAt

  company  Company             @relation(fields: [company_id], references: [id])
  user     User                @relation(fields: [user_id], references: [id])
  sessions AttendanceSession[]

  @@unique([user_id, date])
}
```

---

## Steps

### 1. Update the Prisma schema
Edit `packages/db/prisma/schema.prisma` with all the changes above.

### 2. Create and run the migration
```bash
pnpm --filter @repo/db db:migrate
# Migration name suggestion: "refactor_attendance_sessions"
```

This will:
- Drop the old columns from `attendance_logs`
- Create the new `attendance_sessions` table
- Add the foreign key from `attendance_sessions.log_id → attendance_logs.id`

> ⚠️ Since no attendance data exists yet (tasks 06+ not implemented), there is no data to migrate. The migration is purely structural.

### 3. Regenerate the Prisma client
```bash
pnpm --filter @repo/db db:generate
```

### 4. Verify the updated seed still runs cleanly
The existing seed in `packages/db/prisma/seed.ts` does not insert any `AttendanceLog` or `AttendanceSession` records, so it should pass without changes. Run it to confirm:
```bash
pnpm --filter @repo/db db:seed
```

If the seed does reference any attendance fields, update it to use `total_work_minutes` instead of `work_minutes` and remove any `check_in_at` / `check_out_at` fields from the log.

---

## Acceptance Criteria
- [ ] `pnpm --filter @repo/db db:migrate` runs without errors
- [ ] `attendance_logs` table no longer has `check_in_at`, `check_out_at`, `check_in_lat/lng`, `check_out_lat/lng`, `work_minutes` columns
- [ ] `attendance_logs` table has `total_work_minutes` and `overtime_minutes` columns
- [ ] `attendance_sessions` table exists with all specified columns
- [ ] Foreign key `attendance_sessions.log_id → attendance_logs.id` with `CASCADE` delete is in place
- [ ] `pnpm --filter @repo/db db:generate` completes and the Prisma client reflects the new models
- [ ] `pnpm --filter @repo/db db:seed` runs without errors
- [ ] TypeScript compiles across all packages with no errors after the client regeneration
