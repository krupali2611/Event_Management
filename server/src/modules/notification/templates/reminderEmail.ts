import { buildEmailShell } from './baseEmail';

export function reminderEmailTemplate(input: {
  attendeeName: string;
  eventName: string;
  eventDate: string;
  venue: string;
  reminderLabel: string;
  eventUrl: string;
}) {
  return {
    subject: `${input.reminderLabel}: ${input.eventName}`,
    html: buildEmailShell({
      previewText: `${input.eventName} starts ${input.reminderLabel.toLowerCase()}.`,
      heading: input.reminderLabel,
      body: `
        <p style="margin-top: 0;">Hi ${input.attendeeName}, this is a reminder that <strong>${input.eventName}</strong> starts ${input.reminderLabel.toLowerCase()}.</p>
        <div style="border-radius: 18px; background: #f8fafc; padding: 18px 20px;">
          <p style="margin: 0 0 8px;"><strong>Date:</strong> ${input.eventDate}</p>
          <p style="margin: 0;"><strong>Venue:</strong> ${input.venue}</p>
        </div>
      `,
      ctaLabel: 'View Event',
      ctaUrl: input.eventUrl,
    }),
  };
}
