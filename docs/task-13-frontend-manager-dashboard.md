# Task 13 — Frontend: Manager Dashboard

## What Was Built

The manager-facing area of the web app: a live team status grid, a filtered team-attendance table with per-day session expansion, a tabbed leave-approval workflow, and a monthly attendance report with CSV/PDF export. All four sub-routes share a `ManagerShell` chrome (sticky header + secondary tab bar) and are gated by the existing `AuthGuard` + `RoleGuard` from Task 11.

The previous `app/manager/page.tsx` was a placeholder set up in Task 11. Task 13 replaces it with a real overview page and adds three new sub-routes plus a shared layout.

## Routes

| Path                   | What it shows                                                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------------------------------- |
| `/manager`             | Pending-leave banner, today summary bar, live employee grid (status dot, dept, today's work, current session). |
| `/manager/attendance`  | Date/employee/status filters, quick stats, paginated team table with click-to-expand session timelines.        |
| `/manager/leave`       | Pending / Approved / Rejected tabs. Approve inline; reject opens a modal that requires a reason.               |
| `/manager/reports`     | Month + year selectors, summary cards, employee table, attendance-rate bars, CSV + PDF download buttons.       |

## API Used

All requests go through the Axios `apiClient` from Task 11.

| Endpoint | Used for |
| --- | --- |
| `GET /api/employees?is_active=true` | Team roster. Backend scopes to `manager_id` automatically when role is MANAGER, so the manager only ever sees direct reports. |
| `GET /api/attendance/team?from=&to=&employee_id=&status=&page=&limit=` | Today's logs (overview) + paginated history (attendance page). The response includes `is_live`, enriched `total_work_minutes`, and per-day sessions. |
| `GET /api/reports/summary` | Pending-leave banner count + today/this-month roll-ups. Refreshed every 2 minutes alongside the team grid. |
| `GET /api/leave/requests/pending?status=&limit=` | Powers all three tabs on the leave page (see backend tweak below). |
| `PATCH /api/leave/requests/:id/approve` | Approve mutation. |
| `PATCH /api/leave/requests/:id/reject` `{ reason }` | Reject mutation; reason is required. |
| `GET /api/reports/attendance?from=&to=` | Per-employee monthly summary table + bars. |
| `POST /api/reports/export/csv` `{ from, to, … }` → `text/csv` | CSV download (binary blob). |
| `POST /api/reports/export/pdf` `{ from, to, … }` → `application/pdf` | PDF download (binary blob). |

### Backend tweak (`apps/api/src/modules/leave/leave.service.ts`)

`getPendingRequests` now respects `query.status` (defaulting to `PENDING` when omitted, preserving existing behaviour) and includes the `reviewer` relation in the response. This unlocks the Approved / Rejected history tabs for managers without exposing the HR-only `getAllRequests` endpoint. Sorting also flips: pending sorts ascending by `created_at` (oldest first), decided requests sort descending by `reviewed_at` (most recent first).

## File Map

```
apps/web/src/
├── app/manager/
│   ├── layout.tsx                      ← AuthGuard → RoleGuard("manager") → ManagerShell
│   ├── page.tsx                        ← /manager — overview
│   ├── attendance/page.tsx             ← /manager/attendance
│   ├── leave/page.tsx                  ← /manager/leave (Pending | Approved | Rejected)
│   └── reports/page.tsx                ← /manager/reports
├── components/manager/
│   ├── ManagerShell.tsx                ← sticky header + tab nav, mirrors EmployeeShell
│   ├── TeamSummaryBar.tsx              ← Total / Checked in / Not in / Late / On leave
│   ├── PendingLeaveBanner.tsx          ← warning-tinted banner that links to /manager/leave
│   ├── TeamStatusGrid.tsx              ← per-employee live cards with status dot + live tag
│   ├── TeamAttendanceTable.tsx         ← paginated table with click-to-expand sessions
│   ├── LeaveRequestCard.tsx            ← pending request card with Approve / Reject
│   ├── RejectModal.tsx                 ← required-reason modal for reject
│   ├── AttendanceReportTable.tsx       ← report rows: present/absent/late/leave/work/OT/rate
│   ├── AttendanceReportBars.tsx        ← horizontal bars per employee (rate)
│   └── ExportButtons.tsx               ← CSV + PDF download (blob → object URL)
└── lib/
    ├── api/
    │   ├── manager.ts                  ← team/leave/reports/export wrappers + downloadBlob helper
    │   └── types.ts                    ← TeamMember, TeamAttendanceLog, LeaveRequestForReviewer, ReportsSummary, AttendanceReportRow…
    └── query/
        └── keys.ts                     ← `queryKeys.manager.{team,teamAttendance,leaveRequests,summary,report}`

apps/api/src/modules/leave/
└── leave.service.ts                    ← getPendingRequests honours query.status + sorts by reviewed_at for decided
```

## State Management

Same React Query patterns as Task 12.

- `manager.summary` and `manager.teamAttendance` (overview) refetch every **120 seconds** so the live grid stays current without polling individual employees. The grid updates by re-rendering — no manual elapsed-time math is added on top of `total_work_minutes`.
- The "Session N · Xm" current-session-elapsed value on each card is derived locally from the active session's `check_in_at` (a 30s `setInterval` re-renders just the card). Only this small, isolated value is computed client-side; the day total stays whatever the server returned.
- Approve/reject mutations invalidate every `["manager", "leave", *]` cache and the manager summary, so the request hops between tabs and the banner count updates with no extra fetch logic.
- Exports do not go through React Query — they're imperative one-shot blob downloads via a hidden `<a>` element.

## Key UI Behaviours

### Live status grid (`TeamStatusGrid`)

- One card per direct report, fed by joining `/api/employees` (roster) with `/api/attendance/team?from=today&to=today`.
- Status dot colors follow the spec: green (checked in) / gray (not yet in) / yellow (late) / red (absent) / blue (on leave). The dot pulses when checked in.
- A `Live` chip appears next to the day total when `is_live: true`.
- "Today" hours come straight from the API's enriched `total_work_minutes` — never re-summed on the client. Only the *current session's* elapsed value is computed locally, displayed as a separate metric on the right side of the card.
- The grid auto-refreshes every 2 minutes via React Query's `refetchInterval`.

### Attendance table (`TeamAttendanceTable`)

- Defaults to the current month, paginated 30 per page.
- Filter row: from/to dates, employee dropdown (populated from the team roster), status dropdown (Present / Absent / Late / On leave). A "Reset filters" button restores the month default.
- Sessions column shows the count (e.g. "2 sessions"); clicking a row expands an inline timeline showing each session's start → end → duration. Active sessions render an "Ongoing" tag and the success-tinted dot pulses.
- Live rows (today + active session) show a small pulsing dot beside the work column.
- Quick stats above the table aggregate the **currently displayed page** (attendance rate, total overtime, most-absent employee). They're a fast at-a-glance — full period totals are on the Reports page.

### Leave approvals (`/manager/leave`)

- Three-tab toggle: Pending / Approved / Rejected. Tab state drives both the query and the rendered view (cards for pending, table for decided).
- Pending cards show avatar, name, department, leave type, From/To/Days strip, reason (or a muted "No reason provided"), and Approve / Reject buttons.
- Reject opens a `RejectModal` with a textarea. The modal submits only if the reason is non-empty (trimmed), so the API never sees a blank rejection. The mutation runs from the modal so the spinner sits on the modal's primary button.
- Approve runs inline with optimistic toast feedback.
- Both mutations invalidate `["manager", "leave"]` and the summary so the banner count, the open tab, and the destination tab all update.

### Reports (`/manager/reports`)

- Month + year selectors compute a YYYY-MM-DD `from/to` range and feed both the report query and the export buttons. Switching either instantly re-fetches.
- Summary cards: total employees, average attendance rate, total work hours, total overtime hours.
- Per-employee table: present, absent, late, on-leave, total work, total overtime, attendance rate. Right-aligned tabular numerals, no overflow.
- Bars panel: one bar per employee with a tone tied to attendance rate (≥90 success, ≥75 primary, ≥50 warning, else danger). Useful for spotting outliers fast.
- CSV / PDF buttons hit the same export endpoints as HR Admin uses; the server's manager-scoping (`requesterRole === "MANAGER"` filter) ensures the file only contains the manager's direct reports.

## Acceptance Criteria

- [x] Team status grid shows correct status and live work hours for each employee.
- [x] Cards with `is_live: true` show a `Live` indicator.
- [x] Work hours on cards come from the API's enriched value — no manual elapsed-time addition on the frontend.
- [x] Grid auto-refreshes every 2 minutes.
- [x] Approving a leave request moves it from Pending to Approved tab (cache invalidation).
- [x] Rejecting without a reason is blocked at the modal level.
- [x] Attendance table shows a Sessions count column and an expandable session timeline per row.
- [x] Today's rows with active sessions show a pulsing live indicator next to work hours.
- [x] CSV and PDF downloads trigger a file save in the browser.
- [x] Manager cannot see employees from other teams (enforced by the `MANAGER` branch in `getScopedEmployees`, `getTeamAttendance`, and `getPendingRequests`).

## Dependencies Added

None. All new code reuses primitives, hooks, and libraries already installed in Tasks 11 & 12 (`@tanstack/react-query`, `axios`, `react-hook-form`, `date-fns`, `lucide-react`, `zustand`).

## Backend Changes Summary

- `apps/api/src/modules/leave/leave.service.ts` — `getPendingRequests` accepts `query.status` (default `PENDING`), includes the `reviewer` relation, and sorts decided rows by `reviewed_at` desc.
- No DB migration. No new endpoints or routes.
