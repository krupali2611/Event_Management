import { ArrowLeft, Building2, MapPin, Pencil, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { venueService } from '@/services/venue.service';
import type { Venue } from '@/types/venue.types';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

function VenueDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
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

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
        <div className="flex flex-wrap gap-3">
          <Link to="/admin/venues">
            <Button variant="secondary" icon={<ArrowLeft className="h-4 w-4" />}>
              Back to Venues
            </Button>
          </Link>
          {venue ? (
            <Link to={`/admin/venues/${venue.id}/edit`}>
              <Button variant="secondary" icon={<Pencil className="h-4 w-4" />}>
                Edit Venue
              </Button>
            </Link>
          ) : null}
        </div>
      </div>

      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      {loading ? (
        <Card className="px-6 py-10 text-sm text-slate-500">Loading venue details...</Card>
      ) : venue ? (
        <Card className="overflow-hidden p-0">
          <div className="relative h-72 overflow-hidden bg-slate-100">
            {venue.image ? (
              <img src={venue.image} alt={venue.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 text-slate-500">
                <Building2 className="h-16 w-16" />
              </div>
            )}
            <div className="absolute left-6 top-6">
              <Badge color={venue.isActive ? 'green' : 'amber'}>{venue.isActive ? 'ACTIVE' : 'INACTIVE'}</Badge>
            </div>
          </div>
          <div className="space-y-6 p-6">
            <div className="space-y-2">
              <h3 className="text-3xl font-semibold text-slate-950">{venue.name}</h3>
              <div className="flex items-start gap-3 text-slate-600">
                <MapPin className="mt-1 h-5 w-5 shrink-0 text-brand-500" />
                <div>
                  <p>{venue.location}</p>
                  <p>{venue.address ?? 'Address not added yet.'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <Users className="h-5 w-5 text-brand-500" />
                <span>{venue.capacity.toLocaleString()} People</span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Description</h4>
              <p className="mt-2 text-sm leading-6 text-slate-600">{venue.description ?? 'No description provided yet.'}</p>
            </div>

            <div>
              <h4 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Amenities</h4>
              <div className="mt-3 flex flex-wrap gap-2">
                {venue.amenities.length > 0 ? (
                  venue.amenities.map((amenity) => (
                    <span key={amenity} className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                      {amenity}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No amenities added yet.</p>
                )}
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="px-6 py-10 text-sm text-amber-800">Venue record could not be loaded.</Card>
      )}
    </section>
  );
}

export default VenueDetailsPage;
