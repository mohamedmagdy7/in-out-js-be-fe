# Task 04 — Company Management (Super Admin)

## What Was Built

Company management module for `SUPER_ADMIN` users. Covers CRUD operations on companies, inviting the first HR admin per company, and fetching company stats. All routes are protected behind `authenticate` + `authorize('SUPER_ADMIN')`.

## API Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/companies` | SUPER_ADMIN | List all companies (paginated, searchable) |
| POST | `/api/companies` | SUPER_ADMIN | Create a new company |
| GET | `/api/companies/:id` | SUPER_ADMIN | Get company details |
| PATCH | `/api/companies/:id` | SUPER_ADMIN | Update company fields |
| DELETE | `/api/companies/:id` | SUPER_ADMIN | Soft-delete (sets `is_active = false`) |
| POST | `/api/companies/:id/invite-admin` | SUPER_ADMIN | Create an HR_ADMIN user for the company |
| GET | `/api/companies/:id/stats` | SUPER_ADMIN | Get employee count, check-ins today, etc. |

## Endpoint Details

### `GET /api/companies`
- Pagination: `?page=1&limit=20` (max 100)
- Filter: `?search=acme` (searches name and slug, case-insensitive)
- Filter: `?is_active=true`
- Returns company list with `employee_count` aggregated

### `POST /api/companies`
- Body: `{ name, slug, timezone?, daily_hours_threshold? }`
- Slug must match `/^[a-z0-9-]+$/` and be unique
- Auto-creates default leave types: "Annual Leave" (21 days), "Sick Leave" (10 days)
- Auto-creates default shift: "Standard" (09:00–17:00)

### `PATCH /api/companies/:id`
- Updatable: `name`, `timezone`, `daily_hours_threshold`, `logo_url`, `is_active`
- Slug is NOT updatable after creation

### `DELETE /api/companies/:id`
- Soft-delete only — sets `is_active = false`

### `POST /api/companies/:id/invite-admin`
- Body: `{ email, first_name, last_name, password }`
- Creates a `User` with `role: HR_ADMIN` scoped to the company
- Validates company exists and is active
- Email must be unique within the company

### `GET /api/companies/:id/stats`
- Returns: `{ total_employees, active_employees, checked_in_today, on_leave_today, departments_count }`

## Validation

All request bodies validated with `zod` via a reusable middleware:

```typescript
// middleware/validate.ts
export function validate(schema: ZodSchema) {
  return (req, res, next) => { /* parse body, return 400 with details on failure */ }
}
```

## File Structure

```
apps/api/src/
├── middleware/
│   └── validate.ts                → Zod validation middleware (new)
└── modules/
    └── companies/
        ├── companies.router.ts    → Route definitions with auth guards
        ├── companies.controller.ts → Express handlers
        ├── companies.service.ts   → Business logic + CompanyError class
        └── companies.schema.ts    → Zod schemas + inferred types
```

## Key Decisions

- **Soft-delete over hard-delete** — `DELETE` sets `is_active = false` to preserve referential integrity and audit trail
- **Deactivated company login block** — Added check in `auth.service.ts` login flow: if `company.is_active === false`, return 403
- **Slug immutability** — Slug is excluded from the update schema to prevent URL breakage after creation
- **Auto-provisioning** — Creating a company seeds default leave types and a standard shift so it's immediately usable
- **CompanyError class** — Mirrors `AuthError` pattern for consistent HTTP error handling

## Dependencies Added

- `zod` — Request body validation
