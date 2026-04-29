# Task 12 — Frontend: Employee Dashboard

## Goal
The employee's personal dashboard. Check in/out with one tap, see today's status, view attendance history, and manage leave requests.

## Pages

```
/dashboard                      → main check-in/out page
/dashboard/history              → attendance history with calendar view
/dashboard/leave                → leave requests list + submit form
/dashboard/profile              → view/edit own profile
```

---

## Dashboard Home (`/dashboard`)

### Check-In/Out Widget (main CTA)
- Shows current status: "Not checked in", "Checked in at 09:02", "Checked out at 17:30"
- **Big button**: "Check In" (green) → "Check Out" (red) → disabled after check-out
- On click: request device GPS via `navigator.geolocation.getCurrentPosition()`
  - If granted: send `{ lat, lng }` with request
  - If denied: send without coordinates (never block the action)
- Show confirmation with work hours after check-out
- Loading state during API call (prevent double-tap)

### Today's Stats Cards
```
┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐
│  Sessions  │  │ Work Hours │  │ Overtime   │  │ Remaining  │
│     2      │  │  7h 58m   │  │  0h 0m    │  │  0h 02m   │
└────────────┘  └────────────┘  └────────────┘  └────────────┘
```
- **Sessions**: number of completed check-in/out pairs today
- **Work Hours**: `total_work_minutes` from the log
- **Overtime**: `overtime_minutes` from the log
- **Remaining**: minutes left to hit `daily_hours_threshold` (shows "✓ Done" once met)

### Today's Sessions Timeline
Below the stats, show a vertical timeline of today's sessions:
```
  09:02 AM  ●──────────────●  01:00 PM   3h 58m
  02:00 PM  ●──────────────●  06:00 PM   4h 00m
  07:00 PM  ●─────────── (ongoing)
```
- Each row: check-in time → check-out time → duration
- Active session shown with a pulsing dot and "(ongoing)"
- If no sessions yet: "No activity yet today"

### Recent Attendance (last 5 days)
Mini table showing date, in/out times, status badge, hours.

### Leave Balance Strip
Show remaining days for each leave type: "Annual Leave: 16 days remaining"

---

## Attendance History (`/dashboard/history`)

### Calendar View
- Monthly calendar where each day is colored by status:
  - Green = PRESENT
  - Yellow = LATE
  - Red = ABSENT
  - Blue = ON_LEAVE
  - Gray = weekend / no record
- Click a day to see details (check-in time, check-out, work hours, location if available)

### List View (toggle)
- Table: Date | Check In | Check Out | Work Hours | Overtime | Status
- Filter by month/year
- Pagination (30 per page)

---

## Leave Requests (`/dashboard/leave`)

### Leave Balance Cards
One card per leave type showing: used / total / remaining with a progress bar.

### Leave Request Form
```
Leave Type:     [dropdown]
Start Date:     [date picker]
End Date:       [date picker]
Total Days:     3 working days (auto-computed, shown live)
Reason:         [textarea, optional]
                [Submit Request]
```
- Real-time working days count updates as dates change
- Validate: start ≤ end, check balance before submit
- Show error if insufficient balance

### Requests Table
Columns: Type | From | To | Days | Status | Submitted | Actions
- PENDING: show "Cancel" button
- APPROVED: show green badge
- REJECTED: show red badge + rejection reason on hover/expand

---

## Profile (`/dashboard/profile`)

Editable fields: First Name, Last Name, Phone Number, Avatar (upload)
Read-only: Email, Department, Shift, Manager, Role
Change Password section: Current Password + New Password + Confirm

---

## Component Structure
```
apps/web/src/app/(employee)/
├── dashboard/
│   ├── page.tsx               → check-in/out + today stats
│   ├── history/page.tsx
│   └── leave/page.tsx
└── layout.tsx                 → employee layout (sidebar + top bar)

apps/web/src/components/employee/
├── CheckInButton.tsx
├── TodayStats.tsx
├── AttendanceCalendar.tsx
├── LeaveRequestForm.tsx
├── LeaveBalanceCard.tsx
└── AttendanceTable.tsx
```

---

## State Management
- Use React Query (`@tanstack/react-query`) for all API calls
- Check-in status: query `GET /api/attendance/status` on page load
- Optimistic update on check-in (show "Checked in" immediately, rollback on error)

---

## Acceptance Criteria
- [ ] Check-in button sends GPS coordinates when permission is granted
- [ ] Button state updates correctly: Check In → Check Out → disabled
- [ ] Calendar colors match attendance statuses
- [ ] Leave form calculates and displays working days in real-time
- [ ] Submitting leave with insufficient balance shows a clear error before API call
- [ ] Cancelling a pending leave request removes it from the list optimistically
- [ ] Profile update saves and shows success toast
