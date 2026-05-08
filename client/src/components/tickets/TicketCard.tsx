import { CalendarDays, MapPin, Receipt, Ticket, TimerReset } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import type { TicketBookingItem } from '@/types/ticket.types';
import TicketStatusBadge from './TicketStatusBadge';

interface TicketCardProps {
  ticket: TicketBookingItem;
  onViewDetails: (ticket: TicketBookingItem) => void;
  onCancel: (ticket: TicketBookingItem) => void;
  cancelDisabled: boolean;
  cancelling: boolean;
}

function formatCurrency(amount: number): string {
  if (amount <= 0) {
    return 'Free';
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

function formatDateTime(date: string, time?: string | null): string {
  const formattedDate = new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return time ? `${formattedDate} - ${time}` : formattedDate;
}

function TicketCard({ ticket, onViewDetails, onCancel, cancelDisabled, cancelling }: TicketCardProps) {
  const eventImage =
    ticket.event.image ??
    ticket.event.bannerImage ??
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 720'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' x2='1' y1='0' y2='1'%3E%3Cstop stop-color='%23dbeafe'/%3E%3Cstop offset='.5' stop-color='%23e0f2fe'/%3E%3Cstop offset='1' stop-color='%23ffedd5'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='1200' height='720' fill='url(%23g)'/%3E%3Ctext x='80' y='620' fill='%23334155' font-family='Arial, sans-serif' font-size='72' font-weight='700'%3EEvent Image%3C/text%3E%3C/svg%3E";

  return (
    <Card className="overflow-hidden p-0">
      <div className="h-2 bg-[linear-gradient(90deg,#f97316_0%,#fb7185_50%,#2563eb_100%)]" />
      <div className="grid gap-0 lg:grid-cols-[220px_minmax(0,1fr)]">
        <img src={eventImage} alt={ticket.event.title} className="h-48 w-full object-cover lg:h-full" />
        <div className="space-y-5 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">{ticket.event.category}</p>
            <h3 className="text-xl font-semibold text-slate-950">{ticket.event.title}</h3>
            <p className="text-sm text-slate-500">Ticket No. {ticket.ticketNumber}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <TicketStatusBadge status={ticket.bookingStatus} kind="booking" />
            <TicketStatusBadge status={ticket.paymentStatus} kind="payment" />
          </div>
        </div>

        <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="flex items-center gap-2 font-medium text-slate-900">
              <CalendarDays className="h-4 w-4 text-brand-500" />
              Event date
            </p>
            <p className="mt-2">{formatDateTime(ticket.event.startDate, ticket.event.startTime)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="flex items-center gap-2 font-medium text-slate-900">
              <MapPin className="h-4 w-4 text-brand-500" />
              Venue
            </p>
            <p className="mt-2">{ticket.event.venue ? ticket.event.venue.name : 'Venue to be announced'}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="flex items-center gap-2 font-medium text-slate-900">
              <Ticket className="h-4 w-4 text-brand-500" />
              Quantity
            </p>
            <p className="mt-2">
              {ticket.quantity} ticket{ticket.quantity === 1 ? '' : 's'}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="flex items-center gap-2 font-medium text-slate-900">
              <Receipt className="h-4 w-4 text-brand-500" />
              Total
            </p>
            <p className="mt-2">{formatCurrency(ticket.totalAmount)}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm text-slate-500">
          <p className="flex items-center gap-2">
            <TimerReset className="h-4 w-4 text-slate-400" />
            Booked on {new Date(ticket.bookedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => onViewDetails(ticket)}>
              View Ticket Details
            </Button>
            <Button variant="danger" disabled={cancelDisabled || cancelling} onClick={() => onCancel(ticket)}>
              {cancelling ? 'Cancelling...' : 'Cancel Ticket'}
            </Button>
          </div>
        </div>
        </div>
      </div>
    </Card>
  );
}

export default TicketCard;
