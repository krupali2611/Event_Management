import { buildEmailShell } from './baseEmail';

export function eventCancelledEmailTemplate(input: {
  attendeeName: string;
  eventName: string;
  eventDate: string;
  eventUrl: string;
}) {
  return {
    subject: `${input.eventName} has been cancelled`,
    html: buildEmailShell({
      previewText: `${input.eventName} has been cancelled.`,
      heading: 'Event Cancelled',
      body: `
        <p style="margin-top: 0;">Hi ${input.attendeeName}, we’re sorry to share that <strong>${input.eventName}</strong> scheduled for ${input.eventDate} has been cancelled.</p>
        <p style="margin-bottom: 0;">Please check the event page for the latest updates from the organizer.</p>
      `,
      ctaLabel: 'Open Event',
      ctaUrl: input.eventUrl,
    }),
  };
}
