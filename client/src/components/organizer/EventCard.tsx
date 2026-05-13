import { CalendarDays, Eye, ImageIcon, MapPin, Pencil } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import EventStatusBadge from '@/components/organizer/EventStatusBadge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import type { EventItem } from '@/types/event.types';
import type { TicketEventStats } from '@/types/ticket.types';

const EVENT_FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 720'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' x2='1' y1='0' y2='1'%3E%3Cstop stop-color='%23dbeafe'/%3E%3Cstop offset='.5' stop-color='%23e0f2fe'/%3E%3Cstop offset='1' stop-color='%23ffedd5'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='1200' height='720' fill='url(%23g)'/%3E%3Ccircle cx='965' cy='180' r='110' fill='%23ffffff' fill-opacity='.4'/%3E%3Ccircle cx='260' cy='590' r='160' fill='%23ffffff' fill-opacity='.25'/%3E%3Ctext x='80' y='620' fill='%23334155' font-family='Arial, sans-serif' font-size='72' font-weight='700'%3EEvent Image%3C/text%3E%3C/svg%3E";

function formatShortDate(date: string): string {
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTicketPrice(ticketPrice: number): string {
  if (ticketPrice <= 0) {
    return 'Free Event';
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: ticketPrice % 1 === 0 ? 0 : 2,
  }).format(ticketPrice);
}

function IconAction({ children, tooltip }: { children: ReactNode; tooltip: string }) {
  return (
    <div className="group/tooltip relative">
      {children}
      <div className="pointer-events-none absolute -top-11 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-xl bg-slate-950 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-all duration-200 group-hover/tooltip:-translate-y-1 group-hover/tooltip:opacity-100">
        {tooltip}
      </div>
    </div>
  );
}

function formatRevenue(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

function EventCard({ event, stats }: { event: EventItem; stats?: TicketEventStats }) {
  const location = useLocation();
  const eventsBasePath = location.pathname.startsWith('/admin') ? '/admin/events' : '/organizer/events';
  const eventImage = event.image ?? event.bannerImage ?? EVENT_FALLBACK_IMAGE;
  const eventDate = new Date(event.startDate);
  const eventTime = new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(eventDate);

  return (
    <Card className="group overflow-hidden rounded-[1.9rem] border border-white/70 bg-[var(--dashboard-surface-strong)] p-0 shadow-[var(--dashboard-shadow)] transition duration-300 hover:-translate-y-1.5">
      <div className="relative h-56 overflow-hidden bg-slate-100">
        <Link to={`${eventsBasePath}/${event.id}`} aria-label={`Open ${event.title}`} className="absolute inset-0 z-10">
          <span className="sr-only">View Event</span>
        </Link>

        <img src={eventImage} alt={event.title} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105 hover:scale-105" />
        {!event.image && !event.bannerImage ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/5 text-slate-500">
            <ImageIcon className="h-14 w-14" />
          </div>
        ) : null}

        <div className="absolute left-5 top-5 z-20">
          <EventStatusBadge status={event.status} lifecycleStatus={event.lifecycleStatus} compact />
        </div>

        <div className="absolute right-5 top-5 z-20 flex gap-2 opacity-100 transition-all duration-200 sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
          <IconAction tooltip="View Event">
            <Link to={`${eventsBasePath}/${event.id}`} className="inline-flex">
              <Button
                size="icon"
                variant="secondary"
                aria-label="View Event"
                className="h-11 w-11 rounded-2xl border-white/70 bg-white/95 text-slate-700 shadow-sm backdrop-blur hover:scale-110 hover:bg-white hover:text-brand-600"
                icon={<Eye className="h-4 w-4" />}
              />
            </Link>
          </IconAction>

          {event.isEditable ? (
            <IconAction tooltip="Edit Event">
              <Link to={`${eventsBasePath}/${event.id}/edit`} className="inline-flex">
                <Button
                  size="icon"
                  variant="secondary"
                  aria-label="Edit Event"
                  className="h-11 w-11 rounded-2xl border-white/70 bg-white/95 text-slate-700 shadow-sm backdrop-blur hover:scale-110 hover:bg-white hover:text-amber-600"
                  icon={<Pencil className="h-4 w-4" />}
                />
              </Link>
            </IconAction>
          ) : null}

        </div>
      </div>

      <div className="space-y-5 p-5">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-[1.8rem] font-semibold leading-tight text-slate-950 transition-colors duration-200 group-hover:text-brand-700">{event.title}</h3>
            <div className="flex shrink-0 items-center gap-2">
              <span className="rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-600">{formatTicketPrice(event.ticketPrice)}</span>
              <Link to={`${eventsBasePath}/${event.id}/attendees`} className="shrink-0">
                <Button variant="secondary" size="sm" className="rounded-2xl">
                  View Attendees
                </Button>
              </Link>
            </div>
          </div>

          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-brand-500" />
              <span>
                {formatShortDate(event.startDate)} • {eventTime}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-brand-500" />
              <span className="truncate">{event.venue?.name ?? 'Venue not assigned yet'}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-slate-200/80 pt-4 text-xs text-slate-600 md:grid-cols-4">
          <div>
            <p className="uppercase tracking-[0.18em] text-slate-400">Sold</p>
            <p className="mt-2 text-[1.65rem] font-semibold leading-none text-blue-600">{stats?.totalTicketsSold ?? event.soldTickets}</p>
          </div>
          <div>
            <p className="uppercase tracking-[0.18em] text-slate-400">Seats Left</p>
            <p className="mt-2 text-[1.65rem] font-semibold leading-none text-amber-500">{stats?.remainingSeats ?? event.remainingSeats}</p>
          </div>
          <div>
            <p className="uppercase tracking-[0.18em] text-slate-400">Revenue</p>
            <p className="mt-2 text-[1.65rem] font-semibold leading-none text-emerald-600">{formatRevenue(stats?.totalRevenue ?? 0)}</p>
          </div>
          <div>
            <p className="uppercase tracking-[0.18em] text-slate-400">Bookings</p>
            <p className="mt-2 text-[1.65rem] font-semibold leading-none text-slate-900">{stats?.confirmedBookings ?? 0}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 sm:hidden">
          <IconAction tooltip="View Event">
            <Link to={`${eventsBasePath}/${event.id}`} className="inline-flex">
              <Button size="icon" aria-label="View Event" className="hover:scale-110 hover:text-brand-600" icon={<Eye className="h-4 w-4" />} />
            </Link>
          </IconAction>
          {event.isEditable ? (
            <IconAction tooltip="Edit Event">
              <Link to={`${eventsBasePath}/${event.id}/edit`} className="inline-flex">
                <Button
                  size="icon"
                  variant="secondary"
                  aria-label="Edit Event"
                  className="hover:scale-110 hover:text-amber-600"
                  icon={<Pencil className="h-4 w-4" />}
                />
              </Link>
            </IconAction>
          ) : null}
        </div>

      </div>
    </Card>
  );
}

export default EventCard;
