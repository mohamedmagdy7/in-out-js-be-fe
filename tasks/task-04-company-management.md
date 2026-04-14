# Task 04 — Company Management (Super Admin)

## Goal
Build the company management module. Only `SUPER_ADMIN` can access these routes. Covers creating companies, inviting the first HR admin, and managing company status.

## Endpoints

```
GET    /api/companies                    → list all companies
POST   /api/companies                    → create company
GET    /api/companies/:id                → get company details
PATCH  /api/companies/:id                → update company
DELETE /api/companies/:id                → soft-delete (set is_active = false)
POST   /api/companies/:id/invite-admin   → create HR_ADMIN user for a company
GET    /api/companies/:id/stats          → employee count, check-ins today, etc.
```

All routes require: `authenticate` + `authorize('SUPER_ADMIN')`

---

## Endpoint Specs

### `GET /api/companies`
- Pagination: `?page=1&limit=20`
- Filter: `?search=acme&is_active=true`
- Returns: company list with `employee_count` aggregated

### `POST /api/companies`
**Body**:
```json
{
  "name": "Acme Corp",
  "slug": "acme",
  "timezone": "Africa/Cairo",
  "daily_hours_threshold": 8
}
```
- Validate slug is URL-safe (`/^[a-z0-9-]+$/`)
- Slug must be unique
- Auto-create default `LeaveType` records for the company: "Annual Leave" (21 days), "Sick Leave" (10 days)
- Auto-create default `Shift`: "Standard" (09:00–17:00)

### `PATCH /api/companies/:id`
- Updatable fields: `name`, `timezone`, `daily_hours_threshold`, `logo_url`, `is_active`
- Slug is NOT updatable after creation

### `POST /api/companies/:id/invite-admin`
**Body**: `{ email, first_name, last_name, password }`
- Creates a `User` with `role: HR_ADMIN` in the given company
- Validates company exists and `is_active`
- Email must be unique within the company

### `GET /api/companies/:id/stats`
**Response**:
```json
{
  "total_employees": 42,
  "active_employees": 40,
  "checked_in_today": 35,
  "on_leave_today": 2,
  "departments_count": 5
}
```

---

## Validation
Use `zod` for all request body validation. Create a validation middleware:
```typescript
// middleware/validate.ts
export const validate = (schema: ZodSchema) => (req, res, next) => { ... }
```

---

## File Structure
```
apps/api/src/modules/companies/
├── companies.router.ts
├── companies.controller.ts
├── companies.service.ts
└── companies.schema.ts    → zod schemas
```

---

## Acceptance Criteria
- [ ] `EMPLOYEE` or `MANAGER` token gets `403` on all company routes
- [ ] Creating a company auto-creates default leave types and shift
- [ ] Slug validation rejects `"Acme Corp"` (has space and uppercase)
- [ ] `GET /api/companies/:id/stats` returns correct today's counts
- [ ] Deactivated company (`is_active: false`) users cannot log in
- [ ] Documentation added to `docs/` folder covering what was built, API routes, and key decisions
