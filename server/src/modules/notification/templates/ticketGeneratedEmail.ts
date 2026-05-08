import { buildEmailShell } from './baseEmail';

export function ticketGeneratedEmailTemplate(input: {
  attendeeName: string;
  eventName: string;
  ticketId: string;
  eventDate: string;
  venue: string;
  organizerName: string;
  ticketUrl: string;
}) {
  return {
    subject: `Your ticket for ${input.eventName} is ready`,
    html: buildEmailShell({
      previewText: `Ticket ${input.ticketId} has been generated for ${input.eventName}.`,
      heading: 'Ticket Generated',
      body: `
        <p style="margin-top: 0;">Hi ${input.attendeeName}, your ticket has been generated successfully.</p>
        <div style="border-radius: 18px; background: #f8fafc; padding: 18px 20px;">
          <p style="margin: 0 0 8px;"><strong>Event:</strong> ${input.eventName}</p>
          <p style="margin: 0 0 8px;"><strong>Ticket ID:</strong> ${input.ticketId}</p>
          <p style="margin: 0 0 8px;"><strong>Date:</strong> ${input.eventDate}</p>
          <p style="margin: 0 0 8px;"><strong>Venue:</strong> ${input.venue}</p>
          <p style="margin: 0;"><strong>Organizer:</strong> ${input.organizerName}</p>
        </div>
      `,
      ctaLabel: 'View My Ticket',
      ctaUrl: input.ticketUrl,
    }),
  };
}
