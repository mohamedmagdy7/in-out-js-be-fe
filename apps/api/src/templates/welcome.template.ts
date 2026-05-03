import { layout, escape, button } from "./layout";

interface WelcomeInput {
  company_name: string;
  first_name: string;
  email: string;
  temp_password: string;
  login_url: string;
}

export function welcomeTemplate(input: WelcomeInput): { subject: string; html: string } {
  const body = `
    <h2 style="margin:0 0 16px;">Welcome, ${escape(input.first_name)}!</h2>
    <p>Your account at <strong>${escape(input.company_name)}</strong> has been created. Use the credentials below to sign in:</p>
    <table cellpadding="6" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;margin:12px 0;">
      <tr><td style="color:#6b7280;">Email</td><td><strong>${escape(input.email)}</strong></td></tr>
      <tr><td style="color:#6b7280;">Temporary password</td><td><strong>${escape(input.temp_password)}</strong></td></tr>
    </table>
    <p>Please change your password after your first sign-in.</p>
    <p style="margin-top:20px;">${button(input.login_url, "Sign in")}</p>
  `;
  return {
    subject: `Welcome to ${input.company_name}`,
    html: layout(input.company_name, body),
  };
}
