# Task 10 — Email Notifications

## What Was Built

Transactional email service backed by `nodemailer` plus a `node-cron` job that reminds employees who never checked out. Five trigger points (welcome, password reset, leave submitted, leave approved, leave rejected) plus the daily missed-checkout cron. SMTP is fully configurable via env vars; if SMTP isn't configured, the service logs a stub line instead of crashing the API. All send failures are caught and logged — they never break the originating request.

## Triggers

| Event                         | Recipient(s)              | Source                                   |
| ----------------------------- | ------------------------- | ---------------------------------------- |
| Welcome / account created     | New employee              | `POST /api/employees`                    |
| Leave request submitted       | Employee's manager + HR admins | `POST /api/leave/requests`          |
| Leave approved                | Employee                  | `PATCH /api/leave/requests/:id/approve`  |
| Leave rejected                | Employee                  | `PATCH /api/leave/requests/:id/reject`   |
| Password reset by HR          | Employee                  | `PATCH /api/employees/:id/reset-password`|
| Missed check-out reminder     | Employees with open session | Daily cron at 19:00 company-local time |

## File Structure

```
apps/api/src/
├── services/
│   └── email.service.ts          → nodemailer transport + send helpers per template
├── jobs/
│   └── missed-checkout.job.ts    → node-cron registrar + per-company runner
└── templates/
    ├── layout.ts                 → shared HTML wrapper, escape(), button()
    ├── welcome.template.ts
    ├── leave-submitted.template.ts
    ├── leave-decision.template.ts (approved & rejected use same template)
    ├── password-reset.template.ts
    └── missed-checkout.template.ts
```

## Email Service API

```typescript
emailService.sendWelcome(company, user, tempPassword)
emailService.sendLeaveSubmitted(company, employee, reviewers, request)
emailService.sendLeaveDecision(company, employee, reviewerName, "APPROVED" | "REJECTED", request)
emailService.sendPasswordReset(company, user, tempPassword)
emailService.sendMissedCheckoutReminder(company, user, date, checkInTimeStr)
emailService.send(to, subject, html)
```

Each high-level method renders a template, then forwards to `send`. `send` looks up a cached `nodemailer` transporter and swallows any errors with a `console.error`. If `SMTP_HOST` / `SMTP_PORT` are missing, the transporter is null and the call is logged instead of sent (so dev environments without SMTP still work).

## Cron: Missed Check-Out

`startMissedCheckoutJobs()` is called from `index.ts` after the HTTP server is up. It:

1. Loads all active companies.
2. Registers one `node-cron` task per company: `0 19 * * *` with `timezone: company.timezone`.
3. On tick, calls `runMissedCheckoutForCompany(companyId)` which:
   - Resolves "today" in the company's timezone.
   - Finds every `AttendanceSession` where `check_out_at IS NULL` and the parent log's `date` equals today.
   - Sends one reminder per active user with the check-in time formatted in the company's timezone.

`runMissedCheckoutForCompany` is exported so it can be invoked manually (e.g. from a future CLI / admin endpoint) without restarting the cron.

## Env Vars

```env
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=your_mailtrap_user
SMTP_PASS=your_mailtrap_pass
SMTP_FROM="HR System <no-reply@hr.company.com>"
WEB_URL=http://localhost:3000
```

`WEB_URL` is used to build action button hrefs (login link, dashboard link). Defaults to `http://localhost:3000` if unset.

## Key Decisions

1. **Send-failure isolation**: every outbound call goes through `send`, which wraps `transporter.sendMail` in a try/catch. The originating endpoint (e.g. `POST /api/employees`) never fails because of email problems.

2. **No SMTP = no crash**: when `SMTP_HOST`/`SMTP_PORT` are missing, the service logs `[email] (skipped)` instead of throwing. This keeps local dev usable without provisioning Mailtrap.

3. **Plaintext password capture**: the welcome and password-reset emails need the unhashed value. `createEmployee` reads `body.password` before the hash; `resetEmployeePassword` reads `newPassword` from its argument before hashing. Plaintext is never logged or persisted — it leaves the process only as the email body.

4. **Reviewers = manager + HR admins**: `createLeaveRequest` notifies the employee's `manager_id` (if set) and every active `HR_ADMIN` in the company. This matches the manager-or-HR approval scope from task 08.

5. **One template, two decisions**: `leave-decision.template.ts` handles both approved and rejected by switching the headline color and copy. Halves the template surface and keeps subject/copy consistent.

6. **Per-company cron with timezone**: `node-cron` accepts a `timezone` option, so each company's `0 19 * * *` fires at its own 19:00. Tasks are stored in a `Map<companyId, ScheduledTask>` to make `stopMissedCheckoutJobs()` (used by tests / shutdown) trivial.

7. **HTML-only templates with shared layout**: no template engine. `layout.ts` provides a single inline-styled wrapper (header, body, footer with "automated email from …") plus an `escape()` that all templates use to neutralize untrusted strings (employee names, reasons, etc.).

8. **Cron registration is fire-and-forget at boot**: `app.listen` callback launches `startMissedCheckoutJobs()` and just logs failures. New companies created after boot won't auto-register until the next process restart — acceptable for now since company creation is rare; can be hooked into the company create flow later if needed.

## Business Rules

- Email failures must never propagate to the HTTP response.
- Plaintext passwords appear only inside email bodies; nowhere else.
- Missed-checkout reminders only target active users (`is_active = true`).
- The cron uses each company's configured timezone — no global default.
- All strings interpolated into HTML are escaped (`&`, `<`, `>`, `"`, `'`).

## Dependencies Added

```
pnpm --filter api add nodemailer node-cron
pnpm --filter api add -D @types/nodemailer @types/node-cron
```
