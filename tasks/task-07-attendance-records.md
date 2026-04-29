# Task 07 — Attendance Records & History

## Goal
Build the attendance history and summary endpoints. Employees see their own records. Managers see their team. HR Admins see the whole company.

## Endpoints

```
GET /api/attendance/my                        → own attendance history
GET /api/attendance/employees/:id             → specific employee's records (HR_ADMIN, MANAGER)
GET /api/attendance/team                      → manager's team summary
GET /api/attendance/company                   → company-wide (HR_ADMIN)
GET /api/attendance/summary/me                → own monthly/weekly summary
GET /api/attendance/summary/employee/:id      → summary for specific employee (HR_ADMIN, MANAGER)
```

---

## Endpoint Specs

### `GET /api/attendance/my`
Query params: `?from=2025-01-01&to=2025-01-31&status=LATE`

Returns paginated attendance logs for the authenticated user:
```json
{
  "data": [
    {
      "id": "uuid",
      "date": "2025-01-15",
      "check_in_at": "2025-01-15T07:02:00Z",
      "check_out_at": "2025-01-15T15:30:00Z",
      "work_minutes": 508,
      "overtime_minutes": 28,
      "status": "PRESENT",
      "formatted": {
        "work_hours": "8h 28m",
        "overtime": "0h 28m",
        "check_in": "09:02",
        "check_out": "17:30"
      }
    }
  ],
  "pagination": { "page": 1, "limit": 30, "total": 22 }
}
```

Times in formatted should be in the company's local timezone.

### `GET /api/attendance/company`
HR_ADMIN only. Params: `?from=&to=&department_id=&employee_id=&status=&page=&limit=`

Returns same structure but for all employees in the company, with `user` nested:
```json
{
  "data": [
    {
      "user": { "id": "...", "full_name": "John Doe", "department": "Engineering" },
      "date": "...",
      ...
    }
  ]
}
```

### `GET /api/attendance/team`
MANAGER only. Same as company endpoint but scoped to employees with `manager_id = req.user.id`.

### `GET /api/attendance/summary/me`
Query: `?period=monthly&year=2025&month=3` OR `?period=weekly&week_start=2025-03-10`

**Response**:
```json
{
  "period": "March 2025",
  "working_days": 21,
  "days_present": 19,
  "days_absent": 1,
  "days_late": 2,
  "days_on_leave": 1,
  "total_work_minutes": 9120,
  "total_overtime_minutes": 180,
  "formatted": {
    "total_work_hours": "152h 0m",
    "total_overtime": "3h 0m",
    "attendance_rate": "90.5%"
  }
}
```

### `GET /api/attendance/summary/employee/:id`
Same as above but for a specific employee. Accessible by `HR_ADMIN` and the employee's `MANAGER`.

---

## Admin Override: Mark Attendance

```
POST   /api/attendance/admin/mark              → HR_ADMIN marks a day manually (no sessions)
PATCH  /api/attendance/admin/logs/:id          → HR_ADMIN edits log status/notes
POST   /api/attendance/admin/sessions          → HR_ADMIN adds a manual session to a log
PATCH  /api/attendance/admin/sessions/:id      → HR_ADMIN edits a session's times
DELETE /api/attendance/admin/sessions/:id      → HR_ADMIN removes a session
```

### `POST /api/attendance/admin/mark`
HR_ADMIN creates a daily log manually with no sessions (e.g. marking ABSENT):
```json
{
  "user_id": "uuid",
  "date": "2025-03-15",
  "status": "ABSENT",
  "notes": "Employee called in sick"
}
```
- Creates `AttendanceLog` with `total_work_minutes = 0`, `overtime_minutes = 0`
- Does not create any sessions

### `PATCH /api/attendance/admin/logs/:id`
HR_ADMIN updates log-level fields:
```json
{
  "status": "HALF_DAY",
  "notes": "Left early due to emergency"
}
```

### `POST /api/attendance/admin/sessions`
HR_ADMIN adds a manual session to an existing log:
```json
{
  "log_id": "uuid",
  "check_in_at": "2025-03-15T09:00:00Z",
  "check_out_at": "2025-03-15T13:00:00Z",
  "notes": "Added manually — system error"
}
```
- Computes `duration_minutes` from the times
- Calls `recomputeLogTotals(log_id)` after inserting

### `PATCH /api/attendance/admin/sessions/:id`
HR_ADMIN edits an existing session's times:
```json
{
  "check_in_at": "2025-03-15T09:00:00Z",
  "check_out_at": "2025-03-15T17:00:00Z"
}
```
- Recomputes `duration_minutes` from new times
- Calls `recomputeLogTotals(log_id)` after update

### `DELETE /api/attendance/admin/sessions/:id`
- Removes the session
- Calls `recomputeLogTotals(log_id)` after deletion

---

## Computed Field: `attendance_rate`
```
attendance_rate = days_present / working_days * 100
```
`working_days` = total calendar days in period excluding weekends (Saturday, Sunday). For companies with custom weekends, use a config field (skip for now, assume Sat+Sun off).

---

## File Structure
Add to existing `apps/api/src/modules/attendance/`:
```
├── attendance.router.ts       → add new routes
├── attendance.controller.ts   → add handlers
├── attendance.service.ts      → add history + summary queries
└── attendance.helpers.ts      → add computeSummary, getWorkingDays
```

---

## Acceptance Criteria
- [ ] `GET /api/attendance/my` with `?from=&to=` returns only records in range, each log includes its sessions array
- [ ] `GET /api/attendance/team` for a manager returns only their direct reports
- [ ] Summary `attendance_rate` is computed correctly for a month with known absences
- [ ] HR Admin manual mark creates a log with `status = ABSENT` and zero sessions
- [ ] Adding a manual session via `POST /api/attendance/admin/sessions` triggers log total recomputation
- [ ] Editing a session's times via `PATCH` recomputes `total_work_minutes` and `overtime_minutes` on the log
- [ ] Deleting a session recomputes log totals correctly
- [ ] A manager cannot access `/api/attendance/company`
