# Task 05 — Employee Management

## What Was Built

Employee, department, and shift management APIs for HR Admins and Managers. All endpoints are company-scoped — `company_id` is derived from the authenticated user's JWT, never from the URL.

## API Routes

### Employees (`/api/employees`)

| Method | Path                              | Role(s)          | Description                  |
| ------ | --------------------------------- | ---------------- | ---------------------------- |
| GET    | `/api/employees`                  | HR_ADMIN, MANAGER | List employees (paginated)  |
| POST   | `/api/employees`                  | HR_ADMIN          | Create employee             |
| GET    | `/api/employees/:id`              | HR_ADMIN, MANAGER | Get employee detail         |
| PATCH  | `/api/employees/:id`              | HR_ADMIN          | Update employee             |
| DELETE | `/api/employees/:id`              | HR_ADMIN          | Soft delete (deactivate)    |
| PATCH  | `/api/employees/:id/reset-password` | HR_ADMIN        | Reset employee password     |

**Query params for GET /api/employees:**
- `page`, `limit` — pagination (default: page=1, limit=20)
- `department_id`, `shift_id`, `role`, `is_active` — filters
- `search` — matches first_name, last_name, or email (case-insensitive)

**Manager scoping:** Managers only see employees where `manager_id` matches their own user ID.

### Departments (`/api/departments`)

| Method | Path                    | Role(s)          | Description                        |
| ------ | ----------------------- | ---------------- | ---------------------------------- |
| GET    | `/api/departments`      | HR_ADMIN, MANAGER | List all company departments      |
| POST   | `/api/departments`      | HR_ADMIN          | Create department                 |
| PATCH  | `/api/departments/:id`  | HR_ADMIN          | Rename department                 |
| DELETE | `/api/departments/:id`  | HR_ADMIN          | Delete (fails if employees exist) |

### Shifts (`/api/shifts`)

| Method | Path               | Role(s)          | Description                      |
| ------ | ------------------ | ---------------- | -------------------------------- |
| GET    | `/api/shifts`      | HR_ADMIN, MANAGER | List all company shifts         |
| POST   | `/api/shifts`      | HR_ADMIN          | Create shift (HH:MM format)    |
| PATCH  | `/api/shifts/:id`  | HR_ADMIN          | Update shift                    |
| DELETE | `/api/shifts/:id`  | HR_ADMIN          | Delete (fails if employees exist)|

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

## Key Decisions

1. **Company scoping via JWT**: All queries include `WHERE company_id = req.user.company_id`. The company_id is never passed as a URL parameter — it's extracted from the authenticated user's token.

2. **Manager isolation**: Managers can only list/view employees who have `manager_id` set to their own user ID. They cannot create, update, or delete employees.

3. **Soft delete for employees**: `DELETE /api/employees/:id` sets `is_active = false` rather than removing the record, preserving attendance history and audit trails.

4. **Hard delete for departments/shifts**: These are deleted permanently, but only if no employees are currently assigned (returns 409 Conflict otherwise).

5. **Password reset invalidates tokens**: When an HR Admin resets an employee's password, all existing refresh tokens for that user are deleted in a single transaction, forcing re-authentication.

6. **Role creation restriction**: HR Admins can only create users with role `EMPLOYEE` or `MANAGER` — they cannot create another `HR_ADMIN`.

7. **Self-deletion prevention**: Users cannot deactivate their own account through the delete endpoint.
