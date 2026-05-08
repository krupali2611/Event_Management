export function buildEmailShell(input: { previewText: string; heading: string; body: string; ctaLabel?: string; ctaUrl?: string }): string {
  const ctaMarkup =
    input.ctaLabel && input.ctaUrl
      ? `
        <div style="margin-top: 32px; text-align: center;">
          <a
            href="${input.ctaUrl}"
            style="display: inline-block; border-radius: 999px; background: linear-gradient(135deg, #0f172a, #1d4ed8); color: #ffffff; padding: 14px 24px; text-decoration: none; font-weight: 700;"
          >
            ${input.ctaLabel}
          </a>
        </div>
      `
      : '';

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${input.heading}</title>
      </head>
      <body style="margin: 0; padding: 0; background: #f8fafc; font-family: Arial, Helvetica, sans-serif; color: #0f172a;">
        <div style="display: none; overflow: hidden; line-height: 1px; opacity: 0; max-height: 0; max-width: 0;">${input.previewText}</div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #f8fafc; padding: 24px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 640px; background: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0;">
                <tr>
                  <td style="padding: 28px 32px; background: linear-gradient(135deg, #0f172a, #1d4ed8); color: #ffffff;">
                    <p style="margin: 0; font-size: 12px; letter-spacing: 0.24em; text-transform: uppercase; opacity: 0.82;">Event Management System</p>
                    <h1 style="margin: 14px 0 0; font-size: 28px; line-height: 1.2;">${input.heading}</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 32px;">
                    <div style="font-size: 15px; line-height: 1.75; color: #334155;">
                      ${input.body}
                    </div>
                    ${ctaMarkup}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 32px 32px; font-size: 12px; line-height: 1.7; color: #64748b;">
                    You are receiving this email because of activity on your Event Management account.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}
