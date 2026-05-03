import { layout, escape, button } from "./layout";

interface LeaveSubmittedInput {
  company_name: string;
  reviewer_name: string;
  employee_name: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason?: string | null;
  review_url: string;
}

export function leaveSubmittedTemplate(
  input: LeaveSubmittedInput,
): { subject: string; html: string } {
  const body = `
    <h2 style="margin:0 0 16px;">New leave request awaiting review</h2>
    <p>Hi ${escape(input.reviewer_name)},</p>
    <p><strong>${escape(input.employee_name)}</strong> submitted a leave request:</p>
    <table cellpadding="6" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;margin:12px 0;">
      <tr><td style="color:#6b7280;">Type</td><td>${escape(input.leave_type)}</td></tr>
      <tr><td style="color:#6b7280;">Dates</td><td>${escape(input.start_date)} → ${escape(input.end_date)}</td></tr>
      <tr><td style="color:#6b7280;">Working days</td><td>${input.total_days}</td></tr>
      ${input.reason ? `<tr><td style="color:#6b7280;">Reason</td><td>${escape(input.reason)}</td></tr>` : ""}
    </table>
    <p style="margin-top:20px;">${button(input.review_url, "Review request")}</p>
  `;
  return {
    subject: `Leave request from ${input.employee_name}`,
    html: layout(input.company_name, body),
  };
}
