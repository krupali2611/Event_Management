import { useEffect, useRef, useState } from 'react';
import VenueFilters from '@/components/admin/VenueFilters';
import VenueTable from '@/components/admin/VenueTable';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { venueService } from '@/services/venue.service';
import type { Venue, VenueDeactivationImpact, VenueListData, VenueListFilters } from '@/types/venue.types';
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
  const [deactivationImpact, setDeactivationImpact] = useState<VenueDeactivationImpact | null>(null);
  const [deactivationLoadingVenueId, setDeactivationLoadingVenueId] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const formatBookingSchedule = (startDate: string, endDate: string, startTime: string | null, endTime: string | null): string => {
    const dateFormatter = new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const formattedStartDate = dateFormatter.format(new Date(startDate));
    const formattedEndDate = dateFormatter.format(new Date(endDate));
    const formattedDateRange = formattedStartDate === formattedEndDate ? formattedStartDate : `${formattedStartDate} - ${formattedEndDate}`;

    if (!startTime && !endTime) {
      return `${formattedDateRange} | Flexible time`;
    }

    return `${formattedDateRange} | ${startTime ?? '--:--'} - ${endTime ?? '--:--'}`;
  };

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
      const updatedVenue = response.data?.venue;

      if (updatedVenue) {
        setData((current) => ({
          ...current,
          venues: current.venues.map((item) => (item.id === venue.id ? updatedVenue : item)),
        }));
      }

      setToast(nextIsActive ? 'Venue Activated' : response.data?.confirmationMessage ?? 'Venue Deactivated');
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

  const handleVenueStatusAction = async (venue: Venue): Promise<void> => {
    if (!venue.isActive) {
      await handleToggleStatus(venue);
      return;
    }

    try {
      setError(null);
      setDeactivationLoadingVenueId(venue.id);
      const response = await venueService.getVenueDeactivationImpact(venue.id);
      setDeactivationImpact(response.data ?? null);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setDeactivationLoadingVenueId(null);
    }
  };

  const handleConfirmDeactivation = async (): Promise<void> => {
    if (!deactivationImpact) {
      return;
    }

    const venue = deactivationImpact.venue;
    setDeactivationImpact(null);
    await handleToggleStatus(venue);
  };

  return (
    <section className="space-y-5">
      <VenueFilters
        filters={filters}
        totalVenues={data.pagination.total}
        actionHref="/admin/venues/new"
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
        onToggleStatus={(venue) => void handleVenueStatusAction(venue)}
        togglingVenueId={togglingVenueId ?? deactivationLoadingVenueId}
        loadMoreRef={loadMoreRef}
      />

      {toast ? (
        <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-medium text-emerald-700 shadow-2xl shadow-emerald-100 sm:inset-x-auto sm:bottom-6 sm:right-6">
          {toast}
        </div>
      ) : null}

      {deactivationImpact ? (
        <Modal
          title="Deactivate Venue"
          eyebrow="Confirmation"
          description={deactivationImpact.confirmationMessage}
          onClose={() => setDeactivationImpact(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setDeactivationImpact(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={() => void handleConfirmDeactivation()}>
                Deactivate
              </Button>
            </>
          }
        >
          <div className="space-y-4 text-sm text-slate-700">
            {deactivationImpact.hasConflicts ? (
              <div className="space-y-3">
                {deactivationImpact.conflicts.map((conflict) => (
                  <div key={conflict.bookingId} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="font-semibold text-slate-900">{conflict.eventTitle}</p>
                    <p className="mt-1 text-slate-600">
                      {formatBookingSchedule(conflict.startDate, conflict.endDate, conflict.startTime, conflict.endTime)}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </Modal>
      ) : null}
    </section>
  );
}

export default VenueManagementPage;
