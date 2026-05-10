# Task 12 — Frontend: Employee Dashboard

## What Was Built

The employee-facing area of the web app: a check-in/out home, monthly history with calendar + list views, leave balance and request workflow, and a self-service profile + change-password page. All four sub-routes share an `EmployeeShell` chrome (sticky header + secondary tab bar) and are gated by the existing `AuthGuard` + `RoleGuard` from Task 11.

This task also adds three small server-side endpoints that didn't exist before: `GET /api/auth/profile`, `PATCH /api/auth/profile`, and `POST /api/auth/change-password`. They are needed because the `/employees/*` routes are HR/manager-only, so an employee had no way to update their own name/phone or change their password.

## Routes

| Path                     | What it shows                                                           |
| ------------------------ | ----------------------------------------------------------------------- |
| `/dashboard`             | Check-in/out widget, today's stats, sessions timeline, recent attendance, leave-balance strip. |
| `/dashboard/history`     | Monthly calendar (color-coded by status) + List view toggle, day-detail modal, paginated table. |
| `/dashboard/leave`       | Per-type leave-balance cards, new-request form, requests table with cancel. |
| `/dashboard/profile`     | Read-only account info, editable personal info, change-password form.   |

## API Used

All requests go through the Axios `apiClient` from Task 11 (auto-attaches access token, single-flight refresh on 401).

| Endpoint | Used for |
| --- | --- |
| `GET /api/attendance/status` | live status pill, "Today" stats — refreshed every 60s |
| `GET /api/attendance/today`  | sessions timeline, sessions count |
| `POST /api/attendance/check-in` `{ lat?, lng? }` | check-in mutation |
| `POST /api/attendance/check-out` `{ lat?, lng? }` | check-out mutation |
| `GET /api/attendance/my?from=&to=&page=&limit=` | calendar (`limit=100`) and list (`limit=30`) |
| `GET /api/leave/types` | leave-type select options |
| `GET /api/leave/balance` | balance cards + dashboard balance strip |
| `GET /api/leave/requests?limit=30` | requests table |
| `POST /api/leave/requests` | create leave request |
| `DELETE /api/leave/requests/:id` | cancel pending request (optimistic) |
| **NEW** `GET /api/auth/profile` | full profile (name, phone, dept, shift, manager, company timezone & weekend days) |
| **NEW** `PATCH /api/auth/profile` `{ first_name?, last_name?, phone? }` | self-service profile edit |
| **NEW** `POST /api/auth/change-password` `{ current_password, new_password }` | self-service password change; revokes all refresh tokens |

### New backend endpoints

Lives in `apps/api/src/modules/auth/`:

- `profile.schema.ts` — Zod schemas for the two update payloads.
- `profile.service.ts` — `getProfile`, `updateProfile`, `changePassword`. Password change verifies the current password (bcrypt 12 rounds via `apps/api/src/utils/password.ts`), refuses no-op changes, hashes the new password, and atomically deletes all `RefreshToken` rows for the user inside a `db.$transaction`.
- `profile.controller.ts` — thin Express handlers; `change-password` also clears the `refresh_token` cookie.
- Routes wired into `auth.router.ts`. All three require `authenticate` (any authenticated role can hit them — they always operate on `req.user.id`).

The profile response intentionally includes `company.weekend_days`, `company.daily_hours_threshold`, and `company.timezone` so the frontend can compute working days locally without a separate company endpoint.

## File Map

```
apps/web/src/
├── app/
│   ├── layout.tsx                     ← now also wraps tree in QueryProvider + Toaster
│   └── dashboard/
│       ├── layout.tsx                 ← AuthGuard → RoleGuard(employee) → EmployeeShell
│       ├── page.tsx                   ← /dashboard
│       ├── history/page.tsx
│       ├── leave/page.tsx
│       └── profile/page.tsx
├── components/
│   ├── employee/
│   │   ├── EmployeeShell.tsx          ← sticky header + tab nav for the four pages
│   │   ├── CheckInButton.tsx          ← big toggle button + GPS capture
│   │   ├── TodayStats.tsx             ← Sessions / Work hours / Overtime / Remaining
│   │   ├── SessionsTimeline.tsx       ← today's check-in → check-out rows (active = pulsing dot)
│   │   ├── RecentAttendance.tsx       ← last-5 mini table on the home
│   │   ├── LeaveBalanceStrip.tsx      ← horizontal balance teaser on the home
│   │   ├── AttendanceCalendar.tsx     ← month grid coloured by status
│   │   ├── AttendanceTable.tsx        ← list view with pagination
│   │   ├── DayDetailModal.tsx         ← click a calendar day → details + sessions + GPS
│   │   ├── LeaveBalanceCards.tsx      ← per-type cards with progress bars
│   │   ├── LeaveRequestForm.tsx       ← submit form (live working-days count + balance check)
│   │   ├── LeaveRequestsTable.tsx     ← list + optimistic cancel
│   │   ├── ProfileForm.tsx            ← editable name/phone
│   │   └── ChangePasswordForm.tsx     ← current + new + confirm; auto-logout after success
│   └── ui/                            ← new primitives: Toaster, Select, Textarea, ProgressBar, Spinner, Modal, StatusBadge
├── lib/
│   ├── api/
│   │   ├── types.ts                   ← shared request/response types
│   │   ├── attendance.ts              ← attendance API wrappers
│   │   ├── leave.ts                   ← leave API wrappers
│   │   └── profile.ts                 ← profile + change-password wrappers
│   ├── query/
│   │   ├── query-provider.tsx         ← QueryClientProvider with sane defaults
│   │   └── keys.ts                    ← centralised query keys (avoids string drift)
│   ├── format.ts                      ← formatMinutes / formatTime / formatDate helpers
│   ├── geolocation.ts                 ← getCurrentCoords with timeout + permission denial fallback
│   └── working-days.ts                ← client-side working-days count for live form preview

apps/api/src/modules/auth/
├── profile.schema.ts                  ← Zod for self-update + password change
├── profile.service.ts                 ← business logic (validate current password, revoke refresh tokens)
└── profile.controller.ts              ← Express handlers
```

## State Management

[React Query](https://tanstack.com/query) is now the source of truth for all server data. `QueryProvider` is mounted once in the root layout with these defaults:

- `staleTime: 30s`
- `refetchOnWindowFocus: false`
- `retry`: skip on 401/403/404, otherwise one retry

Per-query overrides:

- `attendance.status` and `attendance.today` use `refetchInterval: 60_000` so the elapsed-time and stats stay live without a websocket.
- After `check-in` / `check-out` mutate, we invalidate `attendance.status`, `attendance.today`, and the broad `["attendance", "my"]` prefix so the recent-attendance table on the dashboard updates immediately.
- After `createLeaveRequest`, both `leave.balance` and `["leave", "requests"]` are invalidated.
- `cancelLeaveRequest` is optimistic — it removes the row from every cached `leave.requests` query immediately, restores from snapshots if the API rejects, and invalidates on settle.

Query keys live in `lib/query/keys.ts` to avoid string drift across hooks.

## Key UI Behaviours

### Check-in widget (`CheckInButton`)

- Big rounded button: green "Check in" → red "Check out" → spinner while in flight.
- Calls `navigator.geolocation.getCurrentPosition` with a 4s timeout; on permission denial or timeout, the API call still proceeds without coordinates.
- A pulsing green dot on the avatar circle indicates an active session; the subtitle shows "Since HH:MM · Xm this session · Ym today".
- Errors surface via the global toaster, never as a hard error page.

### Today stats (`TodayStats`)

Four cards driven entirely by the `status` and `today` queries: sessions count, total work, overtime, remaining-to-threshold. The Remaining card flips to "Done" with a green tick when `threshold_met`.

### Sessions timeline (`SessionsTimeline`)

One row per session with start time → connector → end time → duration. Active sessions render the connector as a fading gradient and a pulsing right dot. Empty state: a dashed empty card.

### History calendar

- Custom month grid built with `date-fns`.
- Each cell shows the day number plus a status dot (or a weekend tick).
- Status colours: PRESENT = green, LATE/HALF_DAY = amber, ABSENT = red, ON_LEAVE = indigo. Weekends use the company's `weekend_days` from the profile endpoint, so the same UI works for Fri/Sat or Sat/Sun companies.
- Today's cell gets a primary outline ring.
- Clicking a day opens `DayDetailModal` with sessions, durations, and a "GPS" badge if coordinates were captured.
- Toggle to a paginated list view (30 per page) with the same date filter.

### Leave request form

- Live working-days count updates as dates change (uses `lib/working-days.ts` with the company's weekend days from the profile cache).
- Selecting a leave type shows remaining days inline; if `workingDays > remaining`, the submit button is disabled and a danger hint is shown — the API is never called with an over-limit request.
- Reason is optional, capped at 500 chars.
- On API rejection, `422 + remaining` is rendered as a clear inline alert.

### Cancel leave (optimistic)

`LeaveRequestsTable` removes the row from every cached `["leave", "requests", *]` query before the network call, restores all snapshots on error, invalidates on settle. Balance is invalidated on success (since the pending days return).

### Change password

Three fields: current, new, confirm. Zod refines: confirm matches new, new differs from current, new ≥ 8 chars. Backend additionally re-checks current password (bcrypt) and refuses no-op changes. On success: a toast → 800ms grace → `logout()` (cookie cleared + redirect to `/login`), since the backend revoked all refresh tokens.

### Profile form

When the API succeeds, `setQueryData(profile, next)` updates the cached profile and the auth store is patched in place so the avatar initials in the header re-render without a refetch.

## Acceptance Criteria

- [x] Check-in button sends GPS coordinates when permission is granted (and gracefully omits them otherwise).
- [x] Button state updates correctly: Check In → Check Out → spinner during the call.
- [x] Calendar colors match attendance statuses (PRESENT/LATE/HALF_DAY/ABSENT/ON_LEAVE).
- [x] Leave form calculates and displays working days in real-time (uses company `weekend_days` so it's correct for Fri/Sat or Sat/Sun companies).
- [x] Submitting leave with insufficient balance shows a clear error before the API call (button is disabled + inline hint).
- [x] Cancelling a pending leave request removes it from the list optimistically.
- [x] Profile update saves and shows a success toast.

## Deliberate Gaps

- **Avatar upload.** The schema has `avatar_url`, but real upload requires an S3-presigned-URL flow that was out of scope here. The profile page renders initials in a primary-tinted circle instead. When S3 lands, the header/avatar already reads from `profile.avatar_url` — wire the upload + a `PATCH /profile` call with the new URL and you're done.
- **Profile route.** The spec listed `/dashboard/profile`. We followed the same `/dashboard/*` pattern rather than splitting into a route group.

## Dependencies Added

- `@tanstack/react-query` — server-state cache & mutations
- `date-fns` — calendar grid + month navigation
- (already installed in Task 11) `react-hook-form`, `zod`, `@hookform/resolvers`, `axios`, `zustand`, `lucide-react`

## Backend changes summary

- `apps/api/src/modules/auth/auth.router.ts` — added `GET /profile`, `PATCH /profile`, `POST /change-password` (all behind `authenticate`).
- `apps/api/src/modules/auth/profile.{schema,service,controller}.ts` — new module.
- No DB migration required — uses existing `User` columns (`first_name`, `last_name`, `phone`).
