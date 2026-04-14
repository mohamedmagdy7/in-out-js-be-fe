# Task 14 — Frontend: HR Admin Panel

## Goal
Full company management for HR Admins. Manage employees, departments, shifts, leave types, company-wide attendance, and reports.

## Pages

```
/admin                          → overview dashboard
/admin/employees                → employee list + CRUD
/admin/employees/new            → create employee form
/admin/employees/:id            → employee detail + edit
/admin/departments              → department management
/admin/shifts                   → shift management
/admin/leave-types              → leave type config
/admin/attendance               → company-wide attendance
/admin/leave                    → all leave requests
/admin/reports                  → full company reports
/admin/settings                 → company settings
```

---

## Admin Overview (`/admin`)

### KPI Cards Row
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Total Staff  │ │ Present Today│ │ On Leave     │ │ Pending Leave│
│     42       │ │   38 (90%)   │ │      2       │ │      5       │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

### Live Check-In Feed
Most recent check-ins today, auto-refreshing every 2 minutes.
`"John Doe checked in at 09:02 AM — Engineering"`

### Pending Leave Requests Alert
If pending requests > 0, show a prominent card with quick approve/reject actions.

---

## Employee Management (`/admin/employees`)

### Employee Table
Columns: Avatar | Name | Email | Department | Shift | Role | Status | Actions
- Search bar (name, email)
- Filters: Department, Role, Status (active/inactive)
- "Add Employee" button → `/admin/employees/new`
- Actions per row: Edit, Deactivate, Reset Password

### Create/Edit Employee Form
Fields:
- First Name, Last Name
- Email (required, validated)
- Password (required for create, hidden for edit)
- Role (EMPLOYEE or MANAGER)
- Department (dropdown, populated from API)
- Shift (dropdown)
- Manager (dropdown, shows only MANAGER-role users)
- Phone (optional)

### Employee Detail Page (`/admin/employees/:id`)
Tabs:
- **Profile**: all employee info (editable)
- **Attendance**: their attendance history table + monthly summary
- **Leave**: their leave balance + request history
- **Reset Password**: form with new password field

---

## Departments (`/admin/departments`)
- Table: Name | Employee Count | Actions (Rename, Delete)
- Inline rename (click to edit)
- Delete blocked if employees are assigned (show count)
- "Add Department" → inline form or modal

## Shifts (`/admin/shifts`)
- Table: Name | Start Time | End Time | Assigned Employees | Default | Actions
- Create/edit modal with time pickers
- Toggle default shift

## Leave Types (`/admin/leave-types`)
- Table: Name | Days/Year | Paid? | Actions
- Create/edit modal
- Cannot delete if employees have requests for this type

---

## Attendance (`/admin/attendance`)
Same as manager view but company-wide:
- All employees, all departments
- Admin override: click a row to edit check-in/out times or status
- Manual mark: button to add absent/present record for any employee for any date

---

## Leave Requests (`/admin/leave`)
- Tabs: Pending | All
- Filter by employee, type, date range, status
- Approve/reject with reason
- Can cancel any approved request (opens modal with confirmation)

---

## Reports (`/admin/reports`)
Full company reporting — same as manager but with all employees:
- Attendance report with department grouping option
- Overtime report (top overtime earners)
- Leave usage report (leave balance overview)
- All exports: CSV + PDF

---

## Company Settings (`/admin/settings`)
Editable:
- Company name
- Timezone selector (dropdown of IANA timezones)
- Daily hours threshold (number input, in hours)
- Company logo upload (upload to S3 via `PUT /api/companies/:id`)

---

## Component Structure
```
apps/web/src/app/(admin)/
├── admin/
│   ├── page.tsx
│   ├── employees/
│   │   ├── page.tsx
│   │   ├── new/page.tsx
│   │   └── [id]/page.tsx
│   ├── departments/page.tsx
│   ├── shifts/page.tsx
│   ├── leave-types/page.tsx
│   ├── attendance/page.tsx
│   ├── leave/page.tsx
│   ├── reports/page.tsx
│   └── settings/page.tsx
└── layout.tsx

apps/web/src/components/admin/
├── EmployeeTable.tsx
├── EmployeeForm.tsx
├── DepartmentManager.tsx
├── ShiftManager.tsx
├── AttendanceOverrideModal.tsx
└── CompanySettingsForm.tsx
```

---

## Acceptance Criteria
- [ ] Creating an employee shows them in the table immediately (optimistic or refetch)
- [ ] Resetting password from employee detail sends the welcome/reset email
- [ ] Deactivating an employee marks them inactive and they can no longer log in
- [ ] Attendance override updates the row in the table without full page refresh
- [ ] Leave type deletion blocked when active requests exist
- [ ] Company timezone change reflected in all time displays across the app
- [ ] Documentation added to `docs/` folder covering what was built, API routes, and key decisions
