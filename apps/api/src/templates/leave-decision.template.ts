import { layout, escape, button } from "./layout";

interface LeaveDecisionInput {
  company_name: string;
  employee_name: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reviewer_name: string;
  decision: "APPROVED" | "REJECTED";
  reason?: string | null;
  dashboard_url: string;
}

export function leaveDecisionTemplate(
  input: LeaveDecisionInput,
): { subject: string; html: string } {
  const approved = input.decision === "APPROVED";
  const headline = approved ? "Your leave request was approved" : "Your leave request was rejected";
  const accent = approved ? "#16a34a" : "#dc2626";

  const body = `
    <h2 style="margin:0 0 16px;color:${accent};">${headline}</h2>
    <p>Hi ${escape(input.employee_name)},</p>
    <p>Your <strong>${escape(input.leave_type)}</strong> request has been <strong>${approved ? "approved" : "rejected"}</strong> by ${escape(input.reviewer_name)}.</p>
    <table cellpadding="6" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;margin:12px 0;">
      <tr><td style="color:#6b7280;">Dates</td><td>${escape(input.start_date)} → ${escape(input.end_date)}</td></tr>
      <tr><td style="color:#6b7280;">Working days</td><td>${input.total_days}</td></tr>
      ${!approved && input.reason ? `<tr><td style="color:#6b7280;">Reason</td><td>${escape(input.reason)}</td></tr>` : ""}
    </table>
    <p style="margin-top:20px;">${button(input.dashboard_url, "Open dashboard")}</p>
  `;
  return {
    subject: approved
      ? `Leave approved (${input.start_date} → ${input.end_date})`
      : `Leave rejected (${input.start_date} → ${input.end_date})`,
    html: layout(input.company_name, body),
  };
}
