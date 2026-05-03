# Task 10 — Email Notifications [Done]

## Goal

Send transactional emails for key events. Use `nodemailer` with a configurable SMTP provider (default: Mailtrap for dev, any SMTP for prod).

## Events to Notify

| Event                     | Recipient          | Trigger                          |
| ------------------------- | ------------------ | -------------------------------- |
| Welcome / account created | New employee       | `POST /api/employees`            |
| Leave request submitted   | Manager + HR Admin | `POST /api/leave/requests`       |
| Leave approved            | Employee           | `PATCH .../approve`              |
| Leave rejected            | Employee           | `PATCH .../reject`               |
| Password reset by HR      | Employee           | `PATCH .../reset-password`       |
| Missed check-out reminder | Employee           | Daily cron at 19:00 company time |

---

## Implementation

### Email Service (`apps/api/src/services/email.service.ts`)

```typescript
class EmailService {
  async send(to: string, subject: string, html: string): Promise<void>;
  async sendWelcome(user: User, password: string): Promise<void>;
  async sendLeaveSubmitted(
    request: LeaveRequest,
    reviewers: User[],
  ): Promise<void>;
  async sendLeaveApproved(request: LeaveRequest, employee: User): Promise<void>;
  async sendLeaveRejected(
    request: LeaveRequest,
    employee: User,
    reason: string,
  ): Promise<void>;
  async sendPasswordReset(user: User, tempPassword: string): Promise<void>;
  async sendMissedCheckoutReminder(users: User[]): Promise<void>;
}
```

### Email Templates

Use simple HTML string templates (no template engine needed). Each template should have:

- Company name in the header
- Clear subject line
- Action button where relevant
- Footer with "This is an automated email from [Company Name] HR System"

### Cron Job: Missed Check-Out Reminder

```typescript
// apps/api/src/jobs/missed-checkout.job.ts
```

- Runs daily at 19:00 for each company (respect each company's timezone)
- Find employees who have `check_in_at` set but `check_out_at` is null for today
- Send reminder email: "You forgot to check out today. Please update your attendance."
- Use `node-cron` for scheduling

---

## Config (add to `.env`)

```env
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=your_mailtrap_user
SMTP_PASS=your_mailtrap_pass
SMTP_FROM="HR System <no-reply@hr.company.com>"
```

---

## Queue (Optional Enhancement)

If time allows, wrap email sending in a Bull queue (Redis-backed) so failures don't block the API response:

```typescript
// apps/api/src/queues/email.queue.ts
```

This is optional — direct `async` sending is acceptable for now.

---

## File Structure

```
apps/api/src/
├── services/
│   └── email.service.ts
├── jobs/
│   └── missed-checkout.job.ts
└── templates/
    ├── welcome.template.ts
    ├── leave-submitted.template.ts
    ├── leave-decision.template.ts
    └── missed-checkout.template.ts
```

---

## Dependencies

```
pnpm --filter api add nodemailer node-cron
pnpm --filter api add -D @types/nodemailer @types/node-cron
```

---

## Acceptance Criteria

- [ ] Welcome email is sent when a new employee is created (includes temp password)
- [ ] Leave request triggers email to the employee's manager and HR admin
- [ ] Approval/rejection email reaches the employee with correct details
- [ ] Cron job runs and identifies employees with missing check-out
- [ ] Emails render correctly in Mailtrap inbox (no broken HTML)
- [ ] Email failures do not crash the API (catch and log errors)
- [ ] Documentation added to `docs/` folder covering what was built, API routes, and key decisions
