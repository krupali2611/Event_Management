import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import VenueForm from '@/components/admin/VenueForm';
import Button from '@/components/ui/Button';
import { venueService } from '@/services/venue.service';
import type { VenuePayload } from '@/types/venue.types';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

function AddVenuePage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (payload: VenuePayload): Promise<void> => {
    try {
      setSubmitting(true);
      setError(null);
      await venueService.createVenue(payload);
      navigate('/admin/venues');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-end gap-4">
        <Link to="/admin/venues">
          <Button variant="secondary" icon={<ArrowLeft className="h-4 w-4" />}>
            Back to Venues
          </Button>
        </Link>
      </div>

      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <VenueForm mode="create" submitting={submitting} onSubmit={handleSubmit} />
    </section>
  );
}

export default AddVenuePage;
