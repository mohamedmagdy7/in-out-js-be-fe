# Task 05 — Employee Management (HR Admin) [Done]

## Goal

Build employee, department, and shift management. HR Admins manage their own company. Managers can view (not create/delete) employees in their department.

## Endpoints

### Employees

```
GET    /api/employees                    → list employees (HR_ADMIN, MANAGER)
POST   /api/employees                    → create employee (HR_ADMIN)
GET    /api/employees/:id                → get employee detail (HR_ADMIN, MANAGER)
PATCH  /api/employees/:id                → update employee (HR_ADMIN)
DELETE /api/employees/:id                → deactivate employee (HR_ADMIN)
PATCH  /api/employees/:id/reset-password → HR_ADMIN resets an employee's password
```

### Departments

```
GET    /api/departments                  → list (HR_ADMIN, MANAGER)
POST   /api/departments                  → create (HR_ADMIN)
PATCH  /api/departments/:id              → rename (HR_ADMIN)
DELETE /api/departments/:id              → delete if no employees (HR_ADMIN)
```

### Shifts

```
GET    /api/shifts                       → list (HR_ADMIN, MANAGER)
POST   /api/shifts                       → create (HR_ADMIN)
PATCH  /api/shifts/:id                   → update (HR_ADMIN)
DELETE /api/shifts/:id                   → delete if no employees (HR_ADMIN)
```

All routes are **company-scoped**: the `company_id` comes from `req.user.company_id`, never from the URL.

---

## Endpoint Specs

### `GET /api/employees`

- Pagination: `?page=1&limit=20`
- Filters: `?department_id=...&shift_id=...&role=EMPLOYEE&search=john&is_active=true`
- For `MANAGER` role: only return employees where `manager_id = req.user.id`
- Response includes: `id, email, first_name, last_name, role, department, shift, is_active, created_at`

### `POST /api/employees`

**Body**:

```json
{
  "email": "john@acme.com",
  "password": "Temp1234!",
  "first_name": "John",
  "last_name": "Doe",
  "role": "EMPLOYEE",
  "department_id": "uuid",
  "shift_id": "uuid",
  "manager_id": "uuid",
  "phone": "+201001234567"
}
```

- Password hashed with bcrypt
- Role can only be `EMPLOYEE` or `MANAGER` (HR_ADMIN cannot create another HR_ADMIN)
- Email unique within company

### `PATCH /api/employees/:id`

- Updatable: `first_name`, `last_name`, `phone`, `department_id`, `shift_id`, `manager_id`, `is_active`
- Cannot update `email` or `role` through this endpoint

### `PATCH /api/employees/:id/reset-password`

**Body**: `{ new_password }`

- HR_ADMIN only
- Hash and update password
- Invalidate all existing refresh tokens for that user

### `DELETE /api/employees/:id`

- Soft delete only: `is_active = false`
- Cannot delete yourself

---

## Data Scoping Rules

- Every query MUST include `WHERE company_id = req.user.company_id`
- Managers can only READ employees with `manager_id = req.user.id`
- Never expose users from other companies

---

## File Structure

```
apps/api/src/modules/
├── employees/
│   ├── employees.router.ts
│   ├── employees.controller.ts
│   ├── employees.service.ts
│   └── employees.schema.ts
├── departments/
│   ├── departments.router.ts
│   ├── departments.controller.ts
│   └── departments.service.ts
└── shifts/
    ├── shifts.router.ts
    ├── shifts.controller.ts
    └── shifts.service.ts
```

---

## Acceptance Criteria

- [ ] Manager cannot see employees from other departments
- [ ] Creating an employee in Company A is not visible from Company B
- [ ] Deleting a department with assigned employees returns a `409` conflict error
- [ ] Password reset invalidates existing refresh tokens for that user
- [ ] `GET /api/employees` with `search=john` matches first_name OR last_name OR email
- [ ] Documentation added to `docs/` folder covering what was built, API routes, and key decisions
