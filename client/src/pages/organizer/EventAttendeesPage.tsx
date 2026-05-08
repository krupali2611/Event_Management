import { Search, Ticket, Users } from 'lucide-react';
import { useMemo } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import AttendeeTable from '@/components/tickets/AttendeeTable';
import BookingStatusFilter from '@/components/tickets/BookingStatusFilter';
import RevenueCard from '@/components/tickets/RevenueCard';
import TicketAnalyticsCard from '@/components/tickets/TicketAnalyticsCard';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useEventTicketAnalytics } from '@/hooks/useEventTicketAnalytics';

function EventAttendeesPage() {
  const { id = '' } = useParams();
  const location = useLocation();
  const isAdminWorkspace = location.pathname.startsWith('/admin');
  const eventsBasePath = isAdminWorkspace ? '/admin/events' : '/organizer/events';
  const { attendeeData, stats, filters, setFilters, loading, statsLoading, error } = useEventTicketAnalytics(id);

  const statCards = useMemo(
    () => [
      {
        label: 'Tickets Sold',
        value: statsLoading ? '--' : stats.totalTicketsSold,
        helper: `${stats.remainingSeats} seats remaining`,
        icon: Ticket,
        tone: 'brand' as const,
      },
      {
        label: 'Confirmed Bookings',
        value: statsLoading ? '--' : stats.confirmedBookings,
        helper: `${stats.cancelledBookings} cancelled`,
        icon: Users,
        tone: 'emerald' as const,
      },
      {
        label: 'Total Bookings',
        value: statsLoading ? '--' : stats.totalBookings,
        helper: `Attendee limit ${stats.attendeeLimit}`,
        icon: Users,
        tone: 'amber' as const,
      },
    ],
    [stats.attendeeLimit, stats.cancelledBookings, stats.confirmedBookings, stats.remainingSeats, stats.totalBookings, stats.totalTicketsSold, statsLoading],
  );

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-700">Attendee Management</p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-950">{attendeeData.event.title || stats.eventTitle || 'Event attendees'}</h2>
          <p className="mt-2 text-sm text-slate-600">
            Review ticket holders, monitor booking performance, and keep the attendee list export-ready.
          </p>
        </div>
        <Link to={`${eventsBasePath}/${id}`}>
          <Button variant="secondary">Back to Event</Button>
        </Link>
      </div>

      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <div className="grid gap-4 xl:grid-cols-4">
        {statCards.map((card) => (
          <TicketAnalyticsCard key={card.label} {...card} />
        ))}
        <RevenueCard label="Revenue" value={statsLoading ? 0 : stats.totalRevenue} helper="Confirmed bookings only" />
      </div>

      <Card className="rounded-xl p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_340px_280px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, page: 1, search: event.target.value }))}
              placeholder="Search attendee by name or email..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white"
            />
          </div>
          <BookingStatusFilter
            bookingStatus={filters.bookingStatus}
            paymentStatus={filters.paymentStatus}
            onBookingStatusChange={(bookingStatus) => setFilters((current) => ({ ...current, page: 1, bookingStatus }))}
            onPaymentStatusChange={(paymentStatus) => setFilters((current) => ({ ...current, page: 1, paymentStatus }))}
          />
          <select
            value={filters.limit}
            onChange={(event) => setFilters((current) => ({ ...current, page: 1, limit: Number(event.target.value) }))}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white"
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={30}>30 per page</option>
          </select>
        </div>
      </Card>

      {loading && attendeeData.attendees.length === 0 ? (
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="h-20 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : null}

      {!loading && attendeeData.attendees.length === 0 ? (
        <Card className="rounded-xl p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 text-slate-600">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-950">No attendees found</h3>
          <p className="mt-2 text-sm text-slate-600">Try widening your filters or wait for attendees to start booking tickets.</p>
        </Card>
      ) : null}

      {attendeeData.attendees.length > 0 ? (
        <AttendeeTable
          attendees={attendeeData.attendees}
          loading={loading}
          pagination={attendeeData.pagination}
          onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
        />
      ) : null}
    </section>
  );
}

export default EventAttendeesPage;
