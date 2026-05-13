import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import EventWizardForm from '@/components/organizer/EventWizardForm';
import Button from '@/components/ui/Button';
import { createEvent, getVenues } from '@/services/api';
import type { EventPayload } from '@/types/event.types';
import type { Venue } from '@/types/venue.types';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

function CreateEventPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventsBasePath = location.pathname.startsWith('/admin') ? '/admin/events' : '/organizer/events';

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getVenues({ page: 1, limit: 50, search: '', location: '', minCapacity: '', status: 'ACTIVE' });
        setVenues(response.data?.venues ?? []);
      } catch (requestError) {
        setError(getApiErrorMessage(requestError));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSubmit = async (payload: EventPayload): Promise<void> => {
    try {
      setSubmitting(true);
      setError(null);
      const response = await createEvent(payload);
      navigate(`${eventsBasePath}/${response.data?.id ?? ''}`);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-5">
      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      {loading ? <div className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">Loading venues...</div> : null}
      {!loading && venues.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
          No active venues found in the database. Add an active venue from admin venue management first.
        </div>
      ) : null}
      {!loading && venues.length > 0 ? (
        <EventWizardForm
          venues={venues}
          submitting={submitting}
          onSubmit={handleSubmit}
          mode="create"
          footerAction={
            <Link to={eventsBasePath}>
              <Button variant="primary" icon={<ArrowLeft className="h-4 w-4" />}>
                Back to Events
              </Button>
            </Link>
          }
        />
      ) : null}
    </section>
  );
}

export default CreateEventPage;
