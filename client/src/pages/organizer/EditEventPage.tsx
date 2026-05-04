import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import EventWizardForm from '@/components/organizer/EventWizardForm';
import { getVenues } from '@/services/api';
import { eventService } from '@/services/event.service';
import type { EventItem, EventPayload } from '@/types/event.types';
import type { Venue } from '@/types/venue.types';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

function EditEventPage() {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        setError(null);
        const [venueResponse, eventResponse] = await Promise.all([
          getVenues({ page: 1, limit: 50, search: '', location: '', minCapacity: '', status: 'ACTIVE' }),
          eventService.getEventById(id),
        ]);
        setVenues(venueResponse.data?.venues ?? []);
        setEvent(eventResponse.data ?? null);
      } catch (requestError) {
        setError(getApiErrorMessage(requestError));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleSubmit = async (payload: EventPayload): Promise<void> => {
    try {
      setSubmitting(true);
      setError(null);
      await eventService.updateEvent(id, payload);
      navigate(`/organizer/events/${id}`);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-5">
      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      {loading ? <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">Loading event workspace...</div> : null}
      {!loading && !error && venues.length === 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
          No active venues found in the database. Add or reactivate a venue before editing this event.
        </div>
      ) : null}
      {!loading && event && venues.length > 0 ? <EventWizardForm venues={venues} initialEvent={event} submitting={submitting} onSubmit={handleSubmit} /> : null}
    </section>
  );
}

export default EditEventPage;
