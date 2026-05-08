import * as brevo from '@getbrevo/brevo';
import { env } from '../../config/env';

const apiInstance = new brevo.TransactionalEmailsApi();

if (env.brevoApiKey) {
  apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, env.brevoApiKey);
}

export async function sendBrevoEmail(input: {
  to: { email: string; name?: string | null };
  subject: string;
  htmlContent: string;
}): Promise<void> {
  if (!env.brevoApiKey || !env.brevoSenderEmail) {
    console.warn('Brevo email skipped because BREVO_API_KEY or BREVO_SENDER_EMAIL is not configured.');
    return;
  }

  await apiInstance.sendTransacEmail({
    sender: {
      email: env.brevoSenderEmail,
      name: env.brevoSenderName,
    },
    to: [
      {
        email: input.to.email,
        name: input.to.name ?? undefined,
      },
    ],
    subject: input.subject,
    htmlContent: input.htmlContent,
  });
}
