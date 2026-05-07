import { Plus } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import EventCard from '@/components/organizer/EventCard';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { eventService } from '@/services/event.service';
import type { EventListData, EventListFilters } from '@/types/event.types';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

const initialFilters: EventListFilters = {
  page: 1,
  limit: 9,
  search: '',
  date: '',
  status: '',
  includeUnpublished: true,
};

const emptyData: EventListData = {
  events: [],
  pagination: {
    total: 0,
    page: 1,
    limit: 9,
    totalPages: 1,
  },
};

function OrganizerEventsPage() {
  const location = useLocation();
  const { currentUser } = useAuth();
  const [filters, setFilters] = useState<EventListFilters>(initialFilters);
  const [data, setData] = useState<EventListData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const isAdminWorkspace = location.pathname.startsWith('/admin');
  const eventsBasePath = isAdminWorkspace ? '/admin/events' : '/organizer/events';
  const eventsLabel = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN' ? 'Total Events' : 'My Events';
  const hasMore = data.pagination.page < data.pagination.totalPages;
  const filterKey = useMemo(() => JSON.stringify({ search: filters.search, date: filters.date, status: filters.status, limit: filters.limit }), [filters.date, filters.limit, filters.search, filters.status]);

  useEffect(() => {
    void loadEvents({ ...filters, page: 1 }, false);
  }, [filterKey]);

  useEffect(() => {
    const target = loadMoreRef.current;

    if (!target || loading || loadingMore || !hasMore) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setFilters((current) => ({ ...current, page: current.page + 1 }));
        }
      },
      { rootMargin: '200px 0px' },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, data.events.length]);

  useEffect(() => {
    if (filters.page === 1) {
      return;
    }

    void loadEvents(filters, true);
  }, [filters.page]);

  const loadEvents = async (nextFilters: EventListFilters, append: boolean): Promise<void> => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const response = await eventService.getEvents(nextFilters);
      const nextData = response.data ?? emptyData;
      setData((current) =>
        append
          ? {
              events: [...current.events, ...nextData.events],
              pagination: nextData.pagination,
            }
          : nextData,
      );
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      if (append) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  return (
    <section className="space-y-4">
      <Card className="rounded-xl p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-sm font-medium text-slate-700">
            <span className="text-2xl font-semibold text-slate-950">{data.pagination.total}</span> {eventsLabel}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, page: 1, search: event.target.value }))}
              placeholder="Search events by name or category..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white sm:w-72"
            />
            <Link to={`${eventsBasePath}/new`}>
              <Button icon={<Plus className="h-4 w-4" />}>Create Event</Button>
            </Link>
          </div>
        </div>
      </Card>

      <Card className="rounded-xl p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <input
            type="date"
            value={filters.date}
            onChange={(event) => setFilters((current) => ({ ...current, page: 1, date: event.target.value }))}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white"
          />
          <select
            value={filters.status}
            onChange={(event) => setFilters((current) => ({ ...current, page: 1, status: event.target.value as EventListFilters['status'] }))}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white"
          >
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select
            value={filters.limit}
            onChange={(event) => setFilters((current) => ({ ...current, page: 1, limit: Number(event.target.value) }))}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white"
          >
            <option value={9}>9 per page</option>
            <option value={18}>18 per page</option>
            <option value={27}>27 per page</option>
          </select>
        </div>
      </Card>

      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      {loading ? <div className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">Loading events...</div> : null}

      {!loading ? (
        <div className="grid gap-5 lg:grid-cols-3">
          {data.events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
          {data.events.length === 0 ? <Card className="p-6 text-sm text-slate-600 lg:col-span-3">No events match the current filters.</Card> : null}
        </div>
      ) : null}

      {!loading && data.events.length > 0 ? <div ref={loadMoreRef} className="h-2" /> : null}
      {loadingMore ? <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-600">Loading more events...</div> : null}
    </section>
  );
}

export default OrganizerEventsPage;
