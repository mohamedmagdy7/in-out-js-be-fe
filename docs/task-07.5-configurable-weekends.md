# Task 07.5 — Configurable Weekend Days

## What Was Built

Added a `weekend_days` column to the `Company` model so each company can configure which days of the week are weekends. Previously, Saturday and Sunday were hardcoded. Now the attendance summary helper uses the company's configured weekend days when computing working days.

## DB Migration

**Migration:** `add_weekend_days_to_company`

Added `weekend_days Int[] @default([5, 6])` to the `Company` model. Existing rows automatically get `[5, 6]` (Friday + Saturday) via the default.

**Day encoding** (JS `Date.getDay()` convention):

| Value | Day       |
| ----- | --------- |
| 0     | Sunday    |
| 1     | Monday    |
| 2     | Tuesday   |
| 3     | Wednesday |
| 4     | Thursday  |
| 5     | Friday    |
| 6     | Saturday  |

## API Changes

### POST /api/companies

Now accepts an optional `weekend_days` field in the body. Defaults to `[5, 6]` if omitted.

```json
{
  "name": "My Company",
  "slug": "my-company",
  "weekend_days": [6, 0]
}
```

### PATCH /api/companies/:id

Now accepts `weekend_days` as an updatable field.

```json
{
  "weekend_days": [6, 0]
}
```

### Validation Rules

- Array of integers, each between 0–6
- Maximum 6 entries (at least one working day required)
- No duplicate values (e.g. `[5, 5, 6]` returns 422)

## Files Changed

| File | Change |
| ---- | ------ |
| `packages/db/prisma/schema.prisma` | Added `weekend_days Int[] @default([5, 6])` to Company |
| `apps/api/src/modules/companies/companies.schema.ts` | Added `weekendDaysSchema` + included in create/update schemas |
| `apps/api/src/modules/companies/companies.service.ts` | Passes `weekend_days` through in `createCompany` |
| `apps/api/src/modules/attendance/attendance.helpers.ts` | `getWorkingDays` now accepts `weekendDays` param, uses Luxon weekday % 7 conversion |
| `apps/api/src/modules/attendance/attendance.service.ts` | Summary caller passes `company.weekend_days` to `getWorkingDays` |
| `packages/db/prisma/seed.ts` | Acme Corp seed explicitly sets `weekend_days: [5, 6]` |

## Key Decisions

1. **JS `Date.getDay()` convention**: Days encoded as 0=Sun through 6=Sat, matching the JavaScript standard. Luxon uses 1=Mon through 7=Sun internally, so the helper converts via `weekday % 7`.

2. **Default `[5, 6]` (Fri+Sat)**: The task spec chose Fri+Sat as the default, accommodating Middle Eastern work weeks. Existing companies are backfilled automatically.

3. **Max 6 weekend days**: Prevents a company from having zero working days (all 7 days as weekend).

4. **Update service passthrough**: `updateCompany` already passes the full validated body to Prisma, so `weekend_days` flows through without additional code.
