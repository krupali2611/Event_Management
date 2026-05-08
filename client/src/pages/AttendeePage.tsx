import { CalendarDays, MapPin, Ticket } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import RemainingSeatsIndicator from '@/components/tickets/RemainingSeatsIndicator';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { getPublicEvents } from '@/services/api';
import type { EventItem } from '@/types/event.types';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

const EVENT_FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 720'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' x2='1' y1='0' y2='1'%3E%3Cstop stop-color='%23dbeafe'/%3E%3Cstop offset='.5' stop-color='%23e0f2fe'/%3E%3Cstop offset='1' stop-color='%23ffedd5'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='1200' height='720' fill='url(%23g)'/%3E%3Ccircle cx='965' cy='180' r='110' fill='%23ffffff' fill-opacity='.4'/%3E%3Ccircle cx='260' cy='590' r='160' fill='%23ffffff' fill-opacity='.25'/%3E%3Ctext x='80' y='620' fill='%23334155' font-family='Arial, sans-serif' font-size='72' font-weight='700'%3EEvent Image%3C/text%3E%3C/svg%3E";

function AttendeePage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatTicketPrice = (ticketPrice: number): string =>
    ticketPrice <= 0
      ? 'Free Event'
      : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: ticketPrice % 1 === 0 ? 0 : 2 }).format(ticketPrice);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getPublicEvents({
          page: 1,
          limit: 24,
          search: '',
          date: '',
          status: 'PUBLISHED',
        });
        setEvents(response.data?.events ?? []);
      } catch (requestError) {
        setError(getApiErrorMessage(requestError));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <section className="space-y-8">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-600">Attendee View</p>
        <h2 className="mt-4 text-4xl font-bold tracking-tight text-slate-950">Find events worth showing up for.</h2>
        <p className="mt-3 text-base text-slate-600">
          Browse published events directly from the live database, with venue details pulled from linked records.
        </p>
      </div>

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      {loading ? <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">Loading events...</div> : null}
      {!loading && events.length === 0 ? <Card className="p-6 text-sm text-slate-600">No upcoming events are available right now.</Card> : null}

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {events.map((event) => (
          <Card key={event.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-0 transition duration-300 hover:-translate-y-1 hover:shadow-xl">
            <img
              src={event.image ?? event.bannerImage ?? EVENT_FALLBACK_IMAGE}
              alt={event.title}
              className="h-48 w-full object-cover transition duration-300 hover:scale-105"
            />
            <div className="p-5">
              <h3 className="text-xl font-bold text-slate-950">{event.title}</h3>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-orange-500" />
                  {new Date(event.startDate).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-orange-500" />
                  {event.venue ? `${event.venue.name}, ${event.venue.location}` : 'Venue to be announced'}
                </div>
                <div className="text-sm font-semibold text-slate-900">{formatTicketPrice(event.ticketPrice)}</div>
              </div>
              <div className="mt-4">
                <RemainingSeatsIndicator
                  remainingSeats={event.remainingSeats}
                  attendeeLimit={event.attendeeLimit}
                  soldTickets={event.soldTickets}
                  compact
                />
              </div>
              <Link to={`/events/${event.id}`}>
                <Button className="mt-5 w-full bg-orange-500 hover:bg-orange-600" size="lg" icon={<Ticket className="h-4 w-4" />}>
                  View Event
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

export default AttendeePage;
