# Task 13 — Frontend: Manager Dashboard

## Goal
The manager's view of their team. Live attendance status, team summary, leave approvals, and exportable reports.

## Pages

```
/manager                        → team live status + today's overview
/manager/attendance             → team attendance history & table
/manager/leave                  → pending leave requests from team
/manager/reports                → team reports + export
```

---

## Manager Home (`/manager`)

### Today's Team Status
A live grid of employee cards showing who's in, who's out, who's late, who's on leave.

Each card shows:
```
┌──────────────────────────┐
│ 🟢  John Doe              │
│     Engineering           │
│     Checked in: 08:55 AM  │
│     4h 22m worked         │
└──────────────────────────┘
```
Status dot colors: green = checked in, gray = not yet in, yellow = late, red = absent, blue = on leave

Refresh button (or auto-refresh every 5 minutes via React Query refetch).

### Today Summary Bar
```
Total: 12 | Checked In: 9 | Not In: 2 | Late: 1 | On Leave: 1
```

### Pending Leave Requests Badge
If any pending requests exist, show a banner: "3 leave requests awaiting your approval →"

---

## Team Attendance (`/manager/attendance`)

### Filters
- Date range picker (default: current month)
- Employee selector (dropdown)
- Status filter (PRESENT, ABSENT, LATE, ON_LEAVE)

### Attendance Table
Columns: Employee | Department | Date | Check In | Check Out | Work Hours | Overtime | Status
- Sortable columns
- Color-coded status badges
- Pagination (30 per page)

### Quick Stats (above table)
For the selected period: avg attendance rate, total overtime hours, most absent employee.

---

## Leave Requests (`/manager/leave`)

### Pending Requests
Cards layout, each showing:
- Employee name + avatar
- Leave type
- Dates + total days
- Reason (if provided)
- [Approve] and [Reject] buttons
- Reject opens a modal to enter rejection reason

### Approved/Rejected History
Tabbed view: Pending | Approved | Rejected
Approved/rejected table with: Employee | Type | Dates | Days | Decision | Decided On

---

## Reports (`/manager/reports`)

### Attendance Report Section
- Month/year selector
- Department filter (if manager manages multiple departments)
- Per-employee summary table (same as `GET /api/reports/attendance` response)
- Charts:
  - Bar chart: attendance rate per employee
  - Simple totals: total work hours, total overtime

### Export Buttons
- "Export CSV" → calls `POST /api/reports/export/csv`
- "Export PDF" → calls `POST /api/reports/export/pdf`
- Both trigger a file download

---

## Component Structure
```
apps/web/src/app/(manager)/
├── manager/
│   ├── page.tsx               → team live status
│   ├── attendance/page.tsx
│   ├── leave/page.tsx
│   └── reports/page.tsx
└── layout.tsx                 → manager layout

apps/web/src/components/manager/
├── TeamStatusGrid.tsx
├── TeamSummaryBar.tsx
├── LeaveRequestCard.tsx
├── RejectModal.tsx
├── AttendanceReportTable.tsx
└── ExportButtons.tsx
```

---

## Acceptance Criteria
- [ ] Team status grid correctly shows employee statuses for today
- [ ] Approving a leave request moves it from Pending to Approved tab
- [ ] Rejecting without a reason is blocked (reason required)
- [ ] Attendance table filters by date range and employee correctly
- [ ] CSV and PDF downloads trigger a file save in the browser
- [ ] Manager cannot see employees from other teams
- [ ] Documentation added to `docs/` folder covering what was built, API routes, and key decisions
