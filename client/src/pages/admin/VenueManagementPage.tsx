import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import VenueFilters from '@/components/admin/VenueFilters';
import VenueTable from '@/components/admin/VenueTable';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { venueService } from '@/services/venue.service';
import type { Venue, VenueListData, VenueListFilters } from '@/types/venue.types';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

const defaultFilters: VenueListFilters = {
  page: 1,
  limit: 10,
  search: '',
  location: '',
  minCapacity: '',
  status: '',
  includeInactive: true,
};

const emptyData: VenueListData = {
  venues: [],
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  },
};

function VenueManagementPage() {
  const [filters, setFilters] = useState<VenueListFilters>(defaultFilters);
  const [debouncedSearch, setDebouncedSearch] = useState(defaultFilters.search);
  const [data, setData] = useState<VenueListData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<Venue | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(filters.search.trim());
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [filters.search]);

  useEffect(() => {
    void loadVenues({
      ...filters,
      search: debouncedSearch,
    });
  }, [debouncedSearch, filters.page, filters.limit, filters.location, filters.minCapacity, filters.status]);

  const loadVenues = async (nextFilters: VenueListFilters): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const response = await venueService.getVenues(nextFilters);
      setData(response.data ?? emptyData);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (): Promise<void> => {
    if (!deactivateTarget) {
      return;
    }

    try {
      setSubmitting(true);
      await venueService.deactivateVenue(deactivateTarget.id);
      setDeactivateTarget(null);
      await loadVenues({
        ...filters,
        search: debouncedSearch,
      });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-5">
      <div className="rounded-[1.85rem] border border-slate-200 bg-white/95 px-5 py-5 shadow-panel">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Venue Management</h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {data.pagination.total} venues
            </div>
            <Link to="/admin/venues/new">
              <Button icon={<Plus className="h-4 w-4" />}>
                Add Venue
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <VenueFilters
        filters={filters}
        onSearchChange={(value) => setFilters((current) => ({ ...current, page: 1, search: value }))}
        onLocationChange={(value) => setFilters((current) => ({ ...current, page: 1, location: value }))}
        onCapacityChange={(value) => setFilters((current) => ({ ...current, page: 1, minCapacity: value }))}
        onStatusChange={(value) => setFilters((current) => ({ ...current, page: 1, status: value }))}
      />

      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <VenueTable
        venues={data.venues}
        pagination={data.pagination}
        loading={loading}
        onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
        onPageSizeChange={(limit) => setFilters((current) => ({ ...current, page: 1, limit }))}
        onDeactivate={setDeactivateTarget}
      />

      {deactivateTarget ? (
        <Modal
          eyebrow="Deactivate Venue"
          title={`Mark ${deactivateTarget.name} inactive?`}
          description="This venue will be marked inactive."
          onClose={() => setDeactivateTarget(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setDeactivateTarget(null)}>
                Cancel
              </Button>
              <Button variant="danger" disabled={submitting} onClick={() => void handleDeactivate()}>
                {submitting ? 'Updating...' : 'Mark Inactive'}
              </Button>
            </>
          }
        />
      ) : null}
    </section>
  );
}

export default VenueManagementPage;
