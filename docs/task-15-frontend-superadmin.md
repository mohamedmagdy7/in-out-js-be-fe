# Task 15 — Super Admin Panel

The SaaS control panel for `SUPER_ADMIN` users. Lists tenants, creates new ones with an initial HR admin, and surfaces per-company stats.

## Routes

All routes are gated by `AuthGuard` → `RoleGuard(roles=["super_admin"])` → `SuperAdminShell` (declared once in `apps/web/src/app/superadmin/layout.tsx`).

| Path                                  | File                                                | Purpose                                                |
| ------------------------------------- | --------------------------------------------------- | ------------------------------------------------------ |
| `/superadmin`                         | `app/superadmin/page.tsx`                           | Platform KPIs + recently created companies            |
| `/superadmin/companies`               | `app/superadmin/companies/page.tsx`                 | Search/filter, deactivate/reactivate                  |
| `/superadmin/companies/new`           | `app/superadmin/companies/new/page.tsx`             | Multi-step create flow + success screen with creds    |
| `/superadmin/companies/:id`           | `app/superadmin/companies/[id]/page.tsx`            | Header, stats, HR admins tab, settings tab            |

## Shell

`apps/web/src/components/superadmin/SuperAdminShell.tsx` follows the same pattern as `AdminShell` and `ManagerShell` — sticky header with brand mark, theme toggle, sign-out, and a horizontal nav. Two entries: Overview and Companies. The detail page sits under Companies, so the Companies tab stays highlighted while drilling in.

## Components

Under `apps/web/src/components/superadmin/`:

- **`CompanyTable`** — paginated table for `/superadmin/companies` with a logo placeholder column, deactivate/reactivate toggle, and a row-level link into the detail page.
- **`HRAdminTable`** — list of HR admins for one company, with per-row activate/deactivate.
- **`AddHRAdminModal`** — drops on top of the detail page to invite a second (or third…) HR admin.
- **`PasswordStrength`** — shared meter used inside `AddHRAdminModal` and the create-company step 2. Scores by length, case mix, digits, and special chars.

`KpiCard` is reused from the HR admin panel — it's role-agnostic by design.

## Create company flow

Two-step form, single submit:

1. **Company info** — name, slug (auto-generated from the name, locked once the user edits it manually, regex-validated `^[a-z0-9-]+$`), timezone (curated list of IANA zones), daily-hours threshold.
2. **First HR admin** — first/last name, email, password (with `PasswordStrength`).

On submit the page issues `POST /api/companies` followed by `POST /api/companies/:id/invite-admin`. The page then renders a success screen with the company name, slug, login email, and password — and a **Copy credentials** button that writes a multi-line string to the clipboard. The password is shown exactly once.

Server-side validation errors are surfaced inline: duplicate slug bounces to step 1 with the field marked; duplicate email bounces to step 2.

## Detail page

`/superadmin/companies/:id` has:

- **Header**: logo placeholder, name, status badge, slug, timezone, created date. Actions: a disabled “View as HR admin” button (impersonation lives in future scope) and a destructive deactivate (or its primary-toned reactivate twin).
- **Stats**: four `KpiCard`s sourced from `GET /api/companies/:id/stats` (active employees, departments, checked in today, on leave).
- **Tabs**:
  - *HR admins* — `HRAdminTable` with an **Add HR admin** button that opens `AddHRAdminModal`. Per-row toggles call the new `PATCH /api/companies/:id/admins/:userId`.
  - *Company settings* — read-only summary (timezone, daily-hours threshold, weekend days as a human-readable list, logo presence, created date). HR admins manage these from `/admin/settings` in their own panel.

## API client

All super-admin calls live in `apps/web/src/lib/api/superadmin.ts`:

- `fetchPlatformStats`, `fetchCompanies`, `fetchCompany`, `createCompany`, `updateCompany`, `deactivateCompany`, `reactivateCompany`, `fetchCompanyStats`.
- `fetchCompanyAdmins`, `inviteCompanyAdmin`, `setCompanyAdminActive`.

Types live in `lib/api/types.ts` (`CompanyRow`, `CompaniesListResponse`, `PlatformStats`, `CompanyAdmin`). Query keys live under `queryKeys.superadmin.*`.

## Backend additions

| Endpoint                                | Method | Auth          | Notes                                                       |
| --------------------------------------- | ------ | ------------- | ----------------------------------------------------------- |
| `/api/companies/platform/stats`         | GET    | `SUPER_ADMIN` | Platform-wide counts + 5 most recent companies              |
| `/api/companies/:id/admins`             | GET    | `SUPER_ADMIN` | List HR admins for a single company                         |
| `/api/companies/:id/admins/:userId`     | PATCH  | `SUPER_ADMIN` | `{ is_active: boolean }` — toggle access for an HR admin    |

All three handlers were added to the existing `companies` module (controller + service + router). The existing list/get/create/update/delete + invite-admin + stats endpoints were already there — task 4 covered those; task 15 only added what was missing.

## Decisions worth flagging

- **Slug auto-fill stops the moment the user edits it.** Tracked via a `slugTouched` flag, so re-typing the company name later doesn't clobber a manually chosen slug.
- **Server errors steer the stepper.** A duplicate-slug error coming back from step 2 doesn't pop a toast and leave the user stranded — it sends them to step 1 with the inline error already set.
- **Reactivation reuses the update endpoint.** Rather than introducing a new "reactivate" route, the client calls `PATCH /api/companies/:id` with `{ is_active: true }`. The route was already a SUPER_ADMIN-only update.
- **Deactivating a tenant doesn't cascade in code.** Login checks already gate on `user.is_active` *and* `user.company.is_active`, so deactivating the company alone is enough to lock out everyone.
- **No emails on company creation.** The HR admin creds are revealed once on the success screen and copy-able. Adding an email later only requires extending `emailService` — no UI rework.
- **Impersonation deferred.** The "View as HR admin" button exists as a disabled placeholder so the slot is reserved.

## Acceptance criteria coverage

- [x] Platform stats reflect real counts from the API — `GET /api/companies/platform/stats` runs five aggregates and the page refetches every 2 minutes.
- [x] Slug auto-generates from company name — lowercased, spaces collapsed to dashes, non-alphanumerics stripped.
- [x] Slug field validates: only lowercase letters, numbers, hyphens — `SLUG_RE = /^[a-z0-9-]+$/`.
- [x] Duplicate slug shows inline error — server message surfaces under the slug field, stepper returns to step 1.
- [x] Success screen shows HR admin credentials — name, email, password, plus copy-to-clipboard.
- [x] Deactivating a company shows a confirmation modal — `Modal` with `danger`-variant confirm button.
- [x] HR admins of a deactivated company cannot log in — handled by the existing auth service (`is_active` check on user + company); no change needed.
- [x] "Add HR admin" modal creates the user and shows them in the table immediately — `invalidateQueries({ queryKey: companyAdmins(id) })` after success.
- [x] Documentation added to `docs/` — this file plus the `ui-theme.md` updates for the new shell and component folder.
