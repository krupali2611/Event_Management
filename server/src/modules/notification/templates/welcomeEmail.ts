import { buildEmailShell } from './baseEmail';

export function welcomeEmailTemplate(input: { userName: string; platformName: string; loginUrl: string }) {
  return {
    subject: `Welcome to ${input.platformName}`,
    html: buildEmailShell({
      previewText: `Welcome to ${input.platformName}, ${input.userName}.`,
      heading: `Welcome, ${input.userName}`,
      body: `
        <p style="margin-top: 0;">Thanks for joining <strong>${input.platformName}</strong>. Your account is ready, and you can now explore events, registrations, and tickets from your dashboard.</p>
        <p style="margin-bottom: 0;">We’re excited to have you on board.</p>
      `,
      ctaLabel: 'Log In',
      ctaUrl: input.loginUrl,
    }),
  };
}
