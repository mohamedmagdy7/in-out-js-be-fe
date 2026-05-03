import nodemailer, { Transporter } from "nodemailer";
import { welcomeTemplate } from "../templates/welcome.template";
import { leaveSubmittedTemplate } from "../templates/leave-submitted.template";
import { leaveDecisionTemplate } from "../templates/leave-decision.template";
import { passwordResetTemplate } from "../templates/password-reset.template";
import { missedCheckoutTemplate } from "../templates/missed-checkout.template";

interface SmtpUser {
  email: string;
  first_name: string;
}

interface CompanyMeta {
  name: string;
}

interface LeaveRequestSummary {
  leave_type_name: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason?: string | null;
}

let cachedTransporter: Transporter | null = null;
let warnedMissingConfig = false;

function getTransporter(): Transporter | null {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port) {
    if (!warnedMissingConfig) {
      console.warn("[email] SMTP_HOST/SMTP_PORT not set — emails will be skipped.");
      warnedMissingConfig = true;
    }
    return null;
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: user && pass ? { user, pass } : undefined,
  });

  return cachedTransporter;
}

function getFrom(): string {
  return process.env.SMTP_FROM ?? "HR System <no-reply@example.com>";
}

function getWebUrl(): string {
  return process.env.WEB_URL ?? "http://localhost:3000";
}

async function send(to: string, subject: string, html: string): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[email] (skipped) to=${to} subject="${subject}"`);
    return;
  }
  try {
    await transporter.sendMail({ from: getFrom(), to, subject, html });
  } catch (err) {
    console.error(`[email] failed to send to ${to}:`, err);
  }
}

export const emailService = {
  send,

  async sendWelcome(
    company: CompanyMeta,
    user: SmtpUser,
    tempPassword: string,
  ): Promise<void> {
    const { subject, html } = welcomeTemplate({
      company_name: company.name,
      first_name: user.first_name,
      email: user.email,
      temp_password: tempPassword,
      login_url: `${getWebUrl()}/login`,
    });
    await send(user.email, subject, html);
  },

  async sendLeaveSubmitted(
    company: CompanyMeta,
    employee: SmtpUser & { last_name: string },
    reviewers: Array<SmtpUser>,
    request: LeaveRequestSummary,
  ): Promise<void> {
    const reviewUrl = `${getWebUrl()}/leave/pending`;
    await Promise.all(
      reviewers.map((rev) => {
        const { subject, html } = leaveSubmittedTemplate({
          company_name: company.name,
          reviewer_name: rev.first_name,
          employee_name: `${employee.first_name} ${employee.last_name}`,
          leave_type: request.leave_type_name,
          start_date: request.start_date,
          end_date: request.end_date,
          total_days: request.total_days,
          reason: request.reason ?? null,
          review_url: reviewUrl,
        });
        return send(rev.email, subject, html);
      }),
    );
  },

  async sendLeaveDecision(
    company: CompanyMeta,
    employee: SmtpUser,
    reviewerName: string,
    decision: "APPROVED" | "REJECTED",
    request: LeaveRequestSummary,
  ): Promise<void> {
    const { subject, html } = leaveDecisionTemplate({
      company_name: company.name,
      employee_name: employee.first_name,
      leave_type: request.leave_type_name,
      start_date: request.start_date,
      end_date: request.end_date,
      total_days: request.total_days,
      reviewer_name: reviewerName,
      decision,
      reason: request.reason ?? null,
      dashboard_url: `${getWebUrl()}/leave`,
    });
    await send(employee.email, subject, html);
  },

  async sendPasswordReset(
    company: CompanyMeta,
    user: SmtpUser,
    tempPassword: string,
  ): Promise<void> {
    const { subject, html } = passwordResetTemplate({
      company_name: company.name,
      first_name: user.first_name,
      email: user.email,
      temp_password: tempPassword,
      login_url: `${getWebUrl()}/login`,
    });
    await send(user.email, subject, html);
  },

  async sendMissedCheckoutReminder(
    company: CompanyMeta,
    user: SmtpUser,
    date: string,
    checkInAtFormatted: string,
  ): Promise<void> {
    const { subject, html } = missedCheckoutTemplate({
      company_name: company.name,
      first_name: user.first_name,
      date,
      check_in_at: checkInAtFormatted,
      dashboard_url: `${getWebUrl()}/attendance`,
    });
    await send(user.email, subject, html);
  },
};
