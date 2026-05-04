import { useEffect, useState } from 'react';
import VenueBookingTable from '@/components/organizer/VenueBookingTable';
import Card from '@/components/ui/Card';
import { venueBookingService } from '@/services/venueBooking.service';
import { venueService } from '@/services/venue.service';
import type { VenueBooking, VenueBookingListData, VenueBookingListFilters } from '@/types/venue-booking.types';
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

  const handleCancel = async (booking: VenueBooking): Promise<void> => {
    try {
      setError(null);
      await venueBookingService.cancelBooking(booking.id);
      await loadBookings(filters);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    }
  };

  return (
    <section className="space-y-5">
      <Card className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Operations Console</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Venue Bookings</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Review active and cancelled venue reservations today, while keeping the module ready for future event-linked booking flows.
            </p>
          </div>
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
      </Card>

      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <VenueBookingTable
        bookings={bookingsData.bookings}
        loading={loading}
        pagination={bookingsData.pagination}
        showCancelAction
        onCancel={(booking) => void handleCancel(booking)}
        onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
      />
    </section>
  );
}

export default VenueBookingsAdminPage;
