# Task 07.5 — Configurable Weekend Days (Migration) [Done]

## Context

Tasks 01–07 are already implemented. This task retrofits weekend day configurability into the already-built code. The DB needs a new column, the company endpoints need to accept the field, and the `getWorkingDays` helper in task 07 needs to stop hardcoding Sat+Sun.

Tasks 08+ are not yet built and already have the correct specs — no changes needed there.

---

## 1. DB Migration

Add `weekend_days` to the `companies` table:

```prisma
model Company {
  // ... existing fields ...
  weekend_days  Int[]  @default([5, 6])
  // ...
}
```

**Day encoding** (JS `Date.getDay()` convention):
| Value | Day |
|-------|-----|
| 0 | Sunday |
| 1 | Monday |
| 2 | Tuesday |
| 3 | Wednesday |
| 4 | Thursday |
| 5 | Friday ← default weekend |
| 6 | Saturday ← default weekend |

```bash
pnpm --filter @repo/db db:migrate
# Migration name: "add_weekend_days_to_company"
pnpm --filter @repo/db db:generate
```

No data migration needed — `@default([5, 6])` backfills existing rows automatically.

---

## 2. Update Company Endpoints (`apps/api/src/modules/companies/`)

### `companies.schema.ts` — add Zod validation

```typescript
const weekendDaysSchema = z
  .array(z.number().int().min(0).max(6))
  .max(6, "Cannot have more than 6 weekend days")
  .refine(
    (days) => new Set(days).size === days.length,
    "Duplicate days not allowed",
  )
  .default([5, 6]);
```

### `POST /api/companies` — accept `weekend_days` in body

- Add `weekend_days` to the create schema (optional, defaults to `[5, 6]`)

### `PATCH /api/companies/:id` — accept `weekend_days` in body

- Add `weekend_days` to the list of updatable fields in the patch schema

### `companies.service.ts`

- Pass `weekend_days` through to the Prisma `create` and `update` calls

---

## 3. Update `getWorkingDays` Helper (`apps/api/src/modules/attendance/attendance.helpers.ts`)

This helper was implemented in task 07 without the `weekendDays` parameter. Update its signature and logic:

```typescript
// BEFORE
export function getWorkingDays(from: Date, to: Date): number {
  // hardcoded Sat+Sun exclusion
}

// AFTER
export function getWorkingDays(
  from: Date,
  to: Date,
  weekendDays: number[], // e.g. [5, 6] for Fri+Sat
): number {
  let count = 0;
  let cursor = DateTime.fromJSDate(from).startOf("day");
  const end = DateTime.fromJSDate(to).startOf("day");

  while (cursor <= end) {
    // Luxon: 1=Mon...7=Sun → convert to JS: 0=Sun...6=Sat via % 7
    if (!weekendDays.includes(cursor.weekday % 7)) {
      count++;
    }
    cursor = cursor.plus({ days: 1 });
  }

  return count;
}
```

### Update the one caller already built — `attendance.service.ts`

The monthly summary in task 07 calls `getWorkingDays`. Update that call to pass `company.weekend_days`:

```typescript
// BEFORE
const workingDays = getWorkingDays(from, to);

// AFTER
const workingDays = getWorkingDays(from, to, company.weekend_days);
```

The `company` object should already be loaded earlier in the request — just add `weekend_days` to the select if it isn't there.

---

## 4. Update Seed

Explicitly set `weekend_days` on the Acme Corp seed so it's unambiguous:

```typescript
await db.company.create({
  data: {
    name: "Acme Corp",
    slug: "acme",
    timezone: "Africa/Cairo",
    daily_hours_threshold: 8,
    weekend_days: [5, 6],
  },
});
```

---

## Acceptance Criteria

- [ ] Migration runs without errors, existing company rows get `weekend_days = [5, 6]`
- [ ] `POST /api/companies` without `weekend_days` creates company with `[5, 6]`
- [ ] `POST /api/companies` with `weekend_days: [6, 0]` stores `[6, 0]` correctly
- [ ] `weekend_days: [5, 5, 6]` (duplicate) returns `422`
- [ ] `weekend_days: [0,1,2,3,4,5,6]` (all 7 days) returns `422`
- [ ] `PATCH /api/companies/:id` with `weekend_days: [6, 0]` updates the value
- [ ] `getWorkingDays([5,6])` excludes Fridays and Saturdays from count
- [ ] `getWorkingDays([6,0])` excludes Saturdays and Sundays from count
- [ ] Monthly attendance summary working days count uses `company.weekend_days`
