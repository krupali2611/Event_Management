import { buildEmailShell } from './baseEmail';

export function ticketStatusEmailTemplate(input: {
  attendeeName: string;
  eventName: string;
  ticketId: string;
  statusLabel: string;
  ticketUrl: string;
}) {
  return {
    subject: `Ticket ${input.statusLabel}: ${input.eventName}`,
    html: buildEmailShell({
      previewText: `Your ticket ${input.ticketId} is now ${input.statusLabel.toLowerCase()}.`,
      heading: `Ticket ${input.statusLabel}`,
      body: `
        <p style="margin-top: 0;">Hi ${input.attendeeName}, the status of your ticket for <strong>${input.eventName}</strong> has changed.</p>
        <p style="margin-bottom: 0;"><strong>Ticket ID:</strong> ${input.ticketId}<br /><strong>New Status:</strong> ${input.statusLabel}</p>
      `,
      ctaLabel: 'View Ticket',
      ctaUrl: input.ticketUrl,
    }),
  };
}
