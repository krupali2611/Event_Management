import { CalendarDays, IndianRupee, Plus, Search, Ticket } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import EventCard from '@/components/organizer/EventCard';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { eventService } from '@/services/event.service';
import { ticketService } from '@/services/ticketService';
import type { EventListData, EventListFilters } from '@/types/event.types';
import type { TicketEventStats } from '@/types/ticket.types';
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
  const [statsByEventId, setStatsByEventId] = useState<Record<string, TicketEventStats>>({});
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const isAdminWorkspace = location.pathname.startsWith('/admin');
  const eventsBasePath = isAdminWorkspace ? '/admin/events' : '/organizer/events';
  const eventsLabel = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN' ? 'Total Events' : 'My Events';
  const hasMore = data.pagination.page < data.pagination.totalPages;
  const filterKey = useMemo(() => JSON.stringify({ search: filters.search, date: filters.date, status: filters.status }), [filters.date, filters.search, filters.status]);
  const overview = useMemo(() => {
    const now = Date.now();
    const totals = Object.values(statsByEventId).reduce(
      (accumulator, stat) => {
        accumulator.bookings += stat.countedBookings ?? stat.confirmedBookings;
        accumulator.revenue += stat.totalRevenue;
        return accumulator;
      },
      { bookings: 0, revenue: 0 },
    );

    return {
      totalEvents: data.pagination.total,
      upcomingEvents: data.events.filter((event) => new Date(event.startDate).getTime() >= now && event.status !== 'CANCELLED').length,
      totalBookings: totals.bookings,
      totalRevenue: totals.revenue,
    };
  }, [data.events, data.pagination.total, statsByEventId]);

  const summaryCards = [
    { label: eventsLabel, value: overview.totalEvents, helper: 'Across your current workspace', icon: CalendarDays, accent: 'from-violet-100 to-violet-50 text-violet-600' },
    { label: 'Upcoming Events', value: overview.upcomingEvents, helper: 'Scheduled from visible results', icon: CalendarDays, accent: 'from-emerald-100 to-emerald-50 text-emerald-600' },
    { label: 'Total Bookings', value: overview.totalBookings, helper: 'Counted attendee bookings', icon: Ticket, accent: 'from-amber-100 to-amber-50 text-amber-600' },
    { label: 'Revenue', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(overview.totalRevenue), helper: 'For loaded event analytics', icon: IndianRupee, accent: 'from-blue-100 to-blue-50 text-blue-600' },
  ];

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
      const statsEntries = await Promise.all(
        nextData.events.map(async (event) => {
          try {
            const statsResponse = await ticketService.getEventStats(event.id);
            return [event.id, statsResponse.data ?? null] as const;
          } catch {
            return [event.id, null] as const;
          }
        }),
      );

      setData((current) =>
        append
          ? {
              events: [...current.events, ...nextData.events],
              pagination: nextData.pagination,
            }
          : nextData,
      );
      setStatsByEventId((current) => {
        const nextStats = append ? { ...current } : {};

        for (const [eventId, stats] of statsEntries) {
          if (stats) {
            nextStats[eventId] = stats;
          }
        }

        return nextStats;
      });
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
    <section className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <Card key={card.label} className="rounded-[1.9rem] border border-white/70 bg-[var(--dashboard-surface-strong)] p-5 shadow-[var(--dashboard-shadow)] backdrop-blur">
              <div className="flex items-center gap-4">
                <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.5rem] bg-gradient-to-br ${card.accent}`}>
                  <Icon className="h-7 w-7" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-500">{card.label}</p>
                  <p className="mt-1 text-[1.9rem] font-semibold leading-none text-slate-950">{card.value}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="overflow-hidden rounded-[2rem] border border-white/70 bg-[var(--dashboard-surface)] p-4 shadow-[var(--dashboard-shadow)] backdrop-blur sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, page: 1, search: event.target.value }))}
              placeholder="Search events by name or category..."
              className="min-w-0 w-full rounded-[1.3rem] border border-slate-200/80 bg-white/90 py-4 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500"
            />
          </div>

          <div className="flex flex-col gap-4 md:flex-row xl:w-auto">
            <div className="relative md:w-[220px]">
              <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                value={filters.date}
                onChange={(event) => setFilters((current) => ({ ...current, page: 1, date: event.target.value }))}
                className="w-full rounded-[1.3rem] border border-slate-200/80 bg-white/90 py-4 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-brand-500"
              />
            </div>

            <select
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, page: 1, status: event.target.value as EventListFilters['status'] }))}
              className="rounded-[1.3rem] border border-slate-200/80 bg-white/90 px-4 py-4 text-sm text-slate-900 outline-none transition focus:border-brand-500 md:w-[190px]"
            >
              <option value="">All Status</option>
              <option value="PUBLISHED">Published</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <Link to={`${eventsBasePath}/new`} className="shrink-0">
              <Button className="h-[58px] rounded-[1.3rem] px-6 shadow-[0_20px_40px_-24px_rgba(37,99,235,0.8)]" icon={<Plus className="h-4 w-4" />}>
                Create Event
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      {loading ? <div className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">Loading events...</div> : null}

      {!loading ? (
        <div className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-2">
          {data.events.map((event) => (
            <EventCard key={event.id} event={event} stats={statsByEventId[event.id]} />
          ))}
          {data.events.length === 0 ? <Card className="p-6 text-sm text-slate-600 lg:col-span-3">No events match the current filters.</Card> : null}
        </div>
      ) : null}

      {!loading && data.events.length > 0 ? <div ref={loadMoreRef} className="h-2" /> : null}
      {loadingMore ? <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-600">Loading more events...</div> : null}
      {!loading && !loadingMore && data.events.length > 0 && !hasMore ? <p className="py-2 text-center text-sm text-slate-500">No more events</p> : null}
    </section>
  );
}

export default OrganizerEventsPage;
