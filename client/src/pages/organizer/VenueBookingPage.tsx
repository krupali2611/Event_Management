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

function VenueBookingPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [bookingsData, setBookingsData] = useState<VenueBookingListData>(initialBookingListData);
  const [listFilters, setListFilters] = useState<VenueBookingListFilters>({
    venueId: '',
    startDate: '',
    endDate: '',
    upcomingOnly: true,
    sort: 'asc',
    page: 1,
    limit: 10,
  });
  const [loadingVenues, setLoadingVenues] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadInitialData();
  }, []);

  useEffect(() => {
    void loadBookings(listFilters);
  }, [listFilters]);

  const loadInitialData = async (): Promise<void> => {
    try {
      setLoadingVenues(true);
      setError(null);
      const venueResponse = await venueService.getVenues({
        page: 1,
        limit: 50,
        search: '',
        location: '',
        minCapacity: '',
        status: 'ACTIVE',
      });
      setVenues(venueResponse.data?.venues ?? []);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoadingVenues(false);
    }
  };

  const loadBookings = async (filters: VenueBookingListFilters): Promise<void> => {
    try {
      setLoadingBookings(true);
      const response = await venueBookingService.getBookings(filters);
      setBookingsData(response.data ?? initialBookingListData);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoadingBookings(false);
    }
  };

  return (
    <section className="space-y-6">
      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <Card className="overflow-hidden p-0">
        <div className="bg-[linear-gradient(120deg,#0f172a_0%,#1d4ed8_50%,#0f766e_100%)] px-6 py-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/75">Venue Bookings</p>
          <h2 className="mt-3 text-2xl font-semibold">Bookings created from event publishing</h2>
          <p className="mt-2 max-w-3xl text-sm text-white/80">
            Review venue reservations created automatically through event publishing.
          </p>
        </div>
        <div className="p-5">
          <div className="mb-4 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-800">
            Manual cancellation is disabled. Venue bookings are released automatically when an event is cancelled.
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <select
              value={listFilters.venueId}
              onChange={(event) => setListFilters((current) => ({ ...current, page: 1, venueId: event.target.value }))}
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
              value={listFilters.startDate}
              onChange={(event) => setListFilters((current) => ({ ...current, page: 1, startDate: event.target.value }))}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white"
            />
            <input
              type="date"
              value={listFilters.endDate}
              onChange={(event) => setListFilters((current) => ({ ...current, page: 1, endDate: event.target.value }))}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white"
            />
            <select
              value={listFilters.sort}
              onChange={(event) => setListFilters((current) => ({ ...current, page: 1, sort: event.target.value as 'asc' | 'desc' }))}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white"
              disabled={loadingVenues}
            >
              <option value="asc">Earliest first</option>
              <option value="desc">Latest first</option>
            </select>
          </div>
        </div>
      </Card>

      <VenueBookingTable
        bookings={bookingsData.bookings}
        loading={loadingBookings}
        pagination={bookingsData.pagination}
        onPageChange={(page) => setListFilters((current) => ({ ...current, page }))}
      />
    </section>
  );
}

export default VenueBookingPage;
