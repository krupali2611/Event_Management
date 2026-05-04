import { CalendarDays, MapPin, Ticket } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { getEvents } from '@/services/api';
import type { EventItem } from '@/types/event.types';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

function AttendeePage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getEvents({
          page: 1,
          limit: 24,
          category: '',
          date: '',
          status: 'published',
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
      {!loading && events.length === 0 ? <Card className="p-6 text-sm text-slate-600">No published events are available right now.</Card> : null}

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {events.map((event) => (
          <Card key={event.id} className="overflow-hidden border border-slate-200 bg-white p-0">
            <div className="h-2 bg-[linear-gradient(90deg,#f97316_0%,#fb7185_50%,#0f766e_100%)]" />
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
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Status: {event.status}</div>
              </div>
              <Link to={`/attendee/events/${event.id}`}>
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
