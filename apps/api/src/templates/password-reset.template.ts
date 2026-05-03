import { layout, escape, button } from "./layout";

interface PasswordResetInput {
  company_name: string;
  first_name: string;
  email: string;
  temp_password: string;
  login_url: string;
}

export function passwordResetTemplate(
  input: PasswordResetInput,
): { subject: string; html: string } {
  const body = `
    <h2 style="margin:0 0 16px;">Your password was reset</h2>
    <p>Hi ${escape(input.first_name)},</p>
    <p>An HR administrator has reset your password. Use the temporary password below to sign in, then change it immediately.</p>
    <table cellpadding="6" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;margin:12px 0;">
      <tr><td style="color:#6b7280;">Email</td><td><strong>${escape(input.email)}</strong></td></tr>
      <tr><td style="color:#6b7280;">Temporary password</td><td><strong>${escape(input.temp_password)}</strong></td></tr>
    </table>
    <p>If you did not expect this, contact your HR administrator immediately.</p>
    <p style="margin-top:20px;">${button(input.login_url, "Sign in")}</p>
  `;
  return {
    subject: `Your ${input.company_name} password was reset`,
    html: layout(input.company_name, body),
  };
}
