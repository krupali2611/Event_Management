import { CalendarDays, MapPin, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import EventStatusBadge from '@/components/organizer/EventStatusBadge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { getEventById } from '@/services/api';
import type { EventItem } from '@/types/event.types';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

function EventDetailPage() {
  const { id = '' } = useParams();
  const { currentUser } = useAuth();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canManageEvent = currentUser?.role === 'ORGANIZER' || currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getEventById(id);
        setEvent(response.data ?? null);
      } catch (requestError) {
        setError(getApiErrorMessage(requestError));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">Loading event details...</div>;
  }

  if (error || !event) {
    return <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error ?? 'Event not found'}</div>;
  }

  return (
    <section className="space-y-6">
      <Card className="overflow-hidden p-0">
        <div className="bg-[linear-gradient(135deg,#f8fafc_0%,#dbeafe_55%,#ffedd5_100%)] px-6 py-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">{event.category}</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-950">{event.title}</h1>
              <p className="mt-3 max-w-3xl text-sm text-slate-600">{event.description ?? 'No event description provided yet.'}</p>
            </div>
            <EventStatusBadge status={event.status} />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {canManageEvent ? (
              <>
                <Link to={`/organizer/events/${event.id}/edit`}>
                  <Button>Edit Event</Button>
                </Link>
                <Link to="/organizer/events">
                  <Button variant="secondary">Back to Events</Button>
                </Link>
              </>
            ) : (
              <Link to="/attendee">
                <Button variant="secondary">Back to Events</Button>
              </Link>
            )}
          </div>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-3 text-slate-700">
            <CalendarDays className="h-5 w-5 text-brand-500" />
            <div>
              <p className="text-sm font-semibold text-slate-950">Schedule</p>
              <p className="text-sm text-slate-600">
                {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3 text-slate-700">
            <MapPin className="h-5 w-5 text-brand-500" />
            <div>
              <p className="text-sm font-semibold text-slate-950">Venue</p>
              <p className="text-sm text-slate-600">{event.venue ? `${event.venue.name}, ${event.venue.location}` : 'No venue assigned'}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3 text-slate-700">
            <Users className="h-5 w-5 text-brand-500" />
            <div>
              <p className="text-sm font-semibold text-slate-950">Capacity Plan</p>
              <p className="text-sm text-slate-600">{event.attendeeLimit} attendees</p>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}

export default EventDetailPage;
