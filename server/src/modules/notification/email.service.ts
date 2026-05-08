import { sendBrevoEmail } from './brevo.service';

export async function sendEmailNotification(input: {
  to: { email: string; name?: string | null };
  subject: string;
  html: string;
}): Promise<void> {
  await sendBrevoEmail({
    to: input.to,
    subject: input.subject,
    htmlContent: input.html,
  });
}
