# Task 13 — Frontend: Manager Dashboard [Done]

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
│     Session 2 · 2h 14m   │  ← current session elapsed
│     6h 22m today  ● live  │  ← total including active session
└──────────────────────────┘
```

Status dot colors: green = checked in, gray = not yet in, yellow = late, red = absent, blue = on leave

**Important**: "worked today" hours come from the API's enriched `total_work_minutes` (which already includes active session elapsed time from Task 07). Do **not** manually add elapsed time on the frontend — it would double-count. Just display what the API returns.

The `● live` indicator is shown when `is_live: true` on the log. Auto-refresh every 2 minutes via React Query refetch to keep hours current.

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

Columns: Employee | Department | Date | Sessions | Total Work Hours | Overtime | Status

- "Sessions" = number of check-in/out pairs that day (e.g. "2 sessions")
- "Total Work Hours" = `total_work_minutes` from the log, formatted. For today's rows with `is_live: true`, show a pulsing dot next to the hours
- Sortable columns
- Color-coded status badges
- Pagination (30 per page)
- Clicking a row expands it to show the individual sessions timeline for that day

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

- [ ] Team status grid shows correct status and live work hours for each employee
- [ ] Cards with `is_live: true` show the `● live` indicator
- [ ] Work hours on cards come from the API's enriched value — no manual elapsed time calculation on the frontend
- [ ] Grid auto-refreshes every 2 minutes
- [ ] Approving a leave request moves it from Pending to Approved tab
- [ ] Rejecting without a reason is blocked (reason required)
- [ ] Attendance table shows Sessions count column and expandable session timeline per row
- [ ] Today's rows with active sessions show a pulsing live indicator next to work hours
- [ ] CSV and PDF downloads trigger a file save in the browser
- [ ] Manager cannot see employees from other teams
