import { useEffect, useState } from 'react';
import VenueBookingTable from '@/components/organizer/VenueBookingTable';
import Card from '@/components/ui/Card';
import { venueBookingService } from '@/services/venueBooking.service';
import { venueService } from '@/services/venue.service';
import type { VenueBookingListData, VenueBookingListFilters } from '@/types/venue-booking.types';
import type { Venue } from '@/types/venue.types';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

const initialBookingListData: VenueBookingListData = {
  bookings: [],
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  },
};

function VenueBookingsAdminPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [bookingsData, setBookingsData] = useState<VenueBookingListData>(initialBookingListData);
  const [filters, setFilters] = useState<VenueBookingListFilters>({
    venueId: '',
    startDate: '',
    endDate: '',
    upcomingOnly: false,
    sort: 'asc',
    page: 1,
    limit: 10,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadVenues();
  }, []);

  useEffect(() => {
    void loadBookings(filters);
  }, [filters]);

  const loadVenues = async (): Promise<void> => {
    try {
      const response = await venueService.getVenues({
        page: 1,
        limit: 50,
        search: '',
        location: '',
        minCapacity: '',
        status: '',
      });
      setVenues(response.data?.venues ?? []);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    }
  };

  const loadBookings = async (nextFilters: VenueBookingListFilters): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const response = await venueBookingService.getBookings(nextFilters);
      setBookingsData(response.data ?? initialBookingListData);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-5">
      <Card className="overflow-hidden p-0">
        <div className="bg-[linear-gradient(120deg,#111827_0%,#0f766e_55%,#f59e0b_100%)] px-6 py-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/75">Admin Booking View</p>
          <h2 className="mt-3 text-2xl font-semibold">All venue reservations across organizers</h2>
          <p className="mt-2 max-w-3xl text-sm text-white/80">Review booking status, linked events, and organizer ownership from one place.</p>
        </div>
        <div className="p-5">
        <div className="mb-4 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          Venue bookings are read-only here. They are cancelled automatically when their linked event is cancelled.
        </div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid gap-3 sm:grid-cols-4">
            <select
              value={filters.venueId}
              onChange={(event) => setFilters((current) => ({ ...current, page: 1, venueId: event.target.value }))}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white"
            >
              <option value="">All venues</option>
              {venues.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={filters.startDate}
              onChange={(event) => setFilters((current) => ({ ...current, page: 1, startDate: event.target.value }))}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white"
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(event) => setFilters((current) => ({ ...current, page: 1, endDate: event.target.value }))}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white"
            />
            <select
              value={filters.sort}
              onChange={(event) => setFilters((current) => ({ ...current, page: 1, sort: event.target.value as 'asc' | 'desc' }))}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white"
            >
              <option value="asc">Earliest first</option>
              <option value="desc">Latest first</option>
            </select>
          </div>
        </div>
        </div>
      </Card>

      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <VenueBookingTable
        bookings={bookingsData.bookings}
        loading={loading}
        pagination={bookingsData.pagination}
        onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
      />
    </section>
  );
}

export default VenueBookingsAdminPage;
