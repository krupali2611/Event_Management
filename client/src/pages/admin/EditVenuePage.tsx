import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import VenueForm from '@/components/admin/VenueForm';
import Button from '@/components/ui/Button';
import { venueService } from '@/services/venue.service';
import type { Venue, VenuePayload } from '@/types/venue.types';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

function EditVenuePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVenue = async (): Promise<void> => {
      if (!id) {
        setError('Venue id is missing.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await venueService.getVenueById(id);
        setVenue(response.data ?? null);
      } catch (requestError) {
        setError(getApiErrorMessage(requestError));
      } finally {
        setLoading(false);
      }
    };

    void loadVenue();
  }, [id]);

  const handleSubmit = async (payload: VenuePayload): Promise<void> => {
    if (!id) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await venueService.updateVenue(id, payload);
      navigate('/admin/venues');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-5">
      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      {loading ? (
        <div className="rounded-[1.75rem] border border-slate-200 bg-white/95 px-6 py-10 text-sm text-slate-500 shadow-panel">
          Loading venue details...
        </div>
      ) : venue ? (
        <VenueForm
          mode="edit"
          initialVenue={venue}
          submitting={submitting}
          onSubmit={handleSubmit}
          previewHeaderAction={
            <Link to="/admin/venues">
              <Button variant="primary" size="sm" className="rounded-xl px-4 py-2 text-xs font-semibold text-white" icon={<ArrowLeft className="h-3.5 w-3.5" />}>
                Back to Venues
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50 px-6 py-10 text-sm text-amber-800 shadow-panel">
          Venue record could not be loaded.
        </div>
      )}
    </section>
  );
}

export default EditVenuePage;
