import { layout, escape, button } from "./layout";

interface MissedCheckoutInput {
  company_name: string;
  first_name: string;
  date: string;
  check_in_at: string;
  dashboard_url: string;
}

export function missedCheckoutTemplate(
  input: MissedCheckoutInput,
): { subject: string; html: string } {
  const body = `
    <h2 style="margin:0 0 16px;">You forgot to check out</h2>
    <p>Hi ${escape(input.first_name)},</p>
    <p>Our records show you checked in at <strong>${escape(input.check_in_at)}</strong> on <strong>${escape(input.date)}</strong> but never checked out.</p>
    <p>Please update your attendance so your hours are recorded correctly.</p>
    <p style="margin-top:20px;">${button(input.dashboard_url, "Update attendance")}</p>
  `;
  return {
    subject: `Reminder: missed check-out for ${input.date}`,
    html: layout(input.company_name, body),
  };
}
