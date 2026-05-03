export function layout(companyName: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escape(companyName)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:24px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
            <tr>
              <td style="background:#1f2937;color:#ffffff;padding:20px 24px;font-size:18px;font-weight:bold;">
                ${escape(companyName)}
              </td>
            </tr>
            <tr>
              <td style="padding:24px;line-height:1.5;font-size:14px;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="background:#f9fafb;padding:16px 24px;font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb;">
                This is an automated email from ${escape(companyName)} HR System.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function button(href: string, label: string): string {
  return `<a href="${escape(href)}" style="display:inline-block;background:#2563eb;color:#ffffff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">${escape(label)}</a>`;
}
