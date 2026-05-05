import { Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import VenueFilters from '@/components/admin/VenueFilters';
import VenueTable from '@/components/admin/VenueTable';
import Button from '@/components/ui/Button';
import { venueService } from '@/services/venue.service';
import type { Venue, VenueListData, VenueListFilters } from '@/types/venue.types';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

const defaultFilters: VenueListFilters = {
  page: 1,
  limit: 8,
  offset: 0,
  search: '',
  location: '',
  minCapacity: '',
  status: '',
  includeInactive: true,
};

const emptyData: VenueListData = {
  venues: [],
  hasMore: false,
  pagination: {
    total: 0,
    page: 1,
    limit: 8,
    totalPages: 1,
    offset: 0,
  },
};

function VenueManagementPage() {
  const [filters, setFilters] = useState<VenueListFilters>(defaultFilters);
  const [debouncedSearch, setDebouncedSearch] = useState(defaultFilters.search);
  const [data, setData] = useState<VenueListData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [togglingVenueId, setTogglingVenueId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(filters.search.trim());
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [filters.search]);

  useEffect(() => {
    void loadVenues(
      {
        ...filters,
        search: debouncedSearch,
        offset: 0,
      },
      { append: false },
    );
  }, [debouncedSearch, filters.limit, filters.location, filters.minCapacity, filters.status]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  useEffect(() => {
    const target = loadMoreRef.current;

    if (!target || loading || loadingMore || !data.hasMore) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];

        if (firstEntry?.isIntersecting) {
          void loadVenues(
            {
              ...filters,
              search: debouncedSearch,
              offset: data.venues.length,
            },
            { append: true },
          );
        }
      },
      {
        rootMargin: '220px 0px',
        threshold: 0.01,
      },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [data.hasMore, data.venues.length, debouncedSearch, filters, loading, loadingMore]);

  const loadVenues = async (nextFilters: VenueListFilters, options: { append: boolean }): Promise<void> => {
    try {
      if (options.append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      setError(null);
      const response = await venueService.getVenues(nextFilters);
      const responseData = response.data ?? emptyData;

      setData((current) => ({
        venues: options.append ? [...current.venues, ...responseData.venues] : responseData.venues,
        hasMore: responseData.hasMore,
        pagination: responseData.pagination,
      }));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      if (options.append) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleToggleStatus = async (venue: Venue): Promise<void> => {
    const previousVenues = data.venues;
    const nextIsActive = !venue.isActive;

    setError(null);
    setTogglingVenueId(venue.id);
    setData((current) => ({
      ...current,
      venues: current.venues.map((item) => (item.id === venue.id ? { ...item, isActive: nextIsActive } : item)),
    }));

    try {
      const response = await venueService.toggleVenueStatus(venue.id);
      const updatedVenue = response.data;

      if (updatedVenue) {
        setData((current) => ({
          ...current,
          venues: current.venues.map((item) => (item.id === venue.id ? updatedVenue : item)),
        }));
      }

      setToast(nextIsActive ? 'Venue Activated' : 'Venue Deactivated');
    } catch (requestError) {
      setData((current) => ({
        ...current,
        venues: previousVenues,
      }));
      setError(getApiErrorMessage(requestError));
    } finally {
      setTogglingVenueId(null);
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
        onSearchChange={(value) => setFilters((current) => ({ ...current, page: 1, offset: 0, search: value }))}
        onLocationChange={(value) => setFilters((current) => ({ ...current, page: 1, offset: 0, location: value }))}
        onCapacityChange={(value) => setFilters((current) => ({ ...current, page: 1, offset: 0, minCapacity: value }))}
        onStatusChange={(value) => setFilters((current) => ({ ...current, page: 1, offset: 0, status: value }))}
      />

      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <VenueTable
        venues={data.venues}
        loading={loading}
        loadingMore={loadingMore}
        hasMore={data.hasMore}
        onToggleStatus={(venue) => void handleToggleStatus(venue)}
        togglingVenueId={togglingVenueId}
        loadMoreRef={loadMoreRef}
      />

      {toast ? (
        <div className="pointer-events-none fixed bottom-6 right-6 z-50 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-medium text-emerald-700 shadow-2xl shadow-emerald-100">
          {toast}
        </div>
      ) : null}
    </section>
  );
}

export default VenueManagementPage;
