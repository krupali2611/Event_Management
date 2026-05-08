import { buildEmailShell } from './baseEmail';

export function eventUpdatedEmailTemplate(input: {
  attendeeName: string;
  eventName: string;
  summary: string;
  eventUrl: string;
}) {
  return {
    subject: `${input.eventName} has been updated`,
    html: buildEmailShell({
      previewText: `${input.eventName} details were updated.`,
      heading: 'Event Details Updated',
      body: `
        <p style="margin-top: 0;">Hi ${input.attendeeName}, one or more important details for <strong>${input.eventName}</strong> were updated.</p>
        <p style="margin-bottom: 0;">${input.summary}</p>
      `,
      ctaLabel: 'Review Event Details',
      ctaUrl: input.eventUrl,
    }),
  };
}
