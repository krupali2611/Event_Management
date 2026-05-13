import { useEffect, useState } from 'react';
import { ArrowUpDown, Building2, CalendarDays, CalendarRange, ChevronDown } from 'lucide-react';
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
    <section className="relative space-y-6 overflow-hidden rounded-[2rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.58),rgba(244,247,252,0.92)_30%,rgba(244,247,252,0.98))] px-1 pb-3 pt-2">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(37,99,255,0.14),transparent_26%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.10),transparent_24%),radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.85),transparent_34%)]"
      />

      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <Card className="overflow-hidden border border-white/70 bg-white/80 p-0 shadow-[0_10px_35px_rgba(37,99,255,0.08)] backdrop-blur-xl">
        <div className="relative overflow-hidden px-6 py-6 sm:px-8 sm:py-8">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(125deg,rgba(255,255,255,0.96),rgba(239,246,255,0.92)_55%,rgba(219,234,254,0.72))]"
          />
          <div
            aria-hidden="true"
            className="absolute right-0 top-0 h-full w-48 bg-[radial-gradient(circle_at_center,rgba(37,99,255,0.16),transparent_62%)] blur-2xl"
          />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[24px] bg-[linear-gradient(180deg,#3B82F6_0%,#2563FF_100%)] text-white shadow-[0_16px_32px_rgba(37,99,255,0.28)]">
                <CalendarRange className="h-9 w-9" strokeWidth={1.8} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-[#0F172A]">Your venue reservations from published events</h2>
                <p className="max-w-2xl text-sm leading-7 text-[#64748B] sm:text-base">
                  Track all venue bookings linked to your organizer events and review upcoming reservations in one place.
                </p>
              </div>
            </div>
            <div className="hidden lg:flex lg:items-center lg:justify-end">
              <div className="relative h-28 w-44 overflow-hidden rounded-[28px] border border-white/70 bg-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                <div className="absolute left-5 top-5 h-3 w-3 rounded-full bg-blue-200" />
                <div className="absolute left-16 top-9 h-2.5 w-2.5 rounded-full bg-sky-200" />
                <div className="absolute right-8 top-7 h-16 w-16 rounded-[22px] bg-[linear-gradient(180deg,rgba(191,219,254,0.88),rgba(96,165,250,0.6))] opacity-80" />
                <div className="absolute right-6 top-4 h-20 w-20 rounded-[26px] border border-white/60 bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.95),rgba(191,219,254,0.75)_55%,rgba(96,165,250,0.42))]" />
                <div className="absolute bottom-5 left-6 right-16 h-3 rounded-full bg-blue-100" />
                <div className="absolute bottom-11 left-6 h-3 w-24 rounded-full bg-slate-100" />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100/80 bg-white/88 px-6 py-6 sm:px-8">
          <div className="grid gap-4 xl:grid-cols-4">
            <label className="group relative block">
              <Building2 className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#2563FF]" strokeWidth={1.9} />
              <select
                value={listFilters.venueId}
                onChange={(event) => setListFilters((current) => ({ ...current, page: 1, venueId: event.target.value }))}
                className="h-[54px] w-full appearance-none rounded-2xl border border-[#E2E8F0] bg-white pl-14 pr-12 text-sm font-medium text-[#0F172A] shadow-[0_1px_2px_rgba(15,23,42,0.03)] outline-none transition duration-200 hover:border-blue-200 focus:border-[#2563FF] focus:ring-4 focus:ring-blue-100"
              >
                <option value="">All venues</option>
                {venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition group-hover:text-[#2563FF]" />
            </label>

            <label className="group relative block">
              <CalendarDays className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#2563FF]" strokeWidth={1.9} />
              <input
                type="date"
                value={listFilters.startDate}
                onChange={(event) => setListFilters((current) => ({ ...current, page: 1, startDate: event.target.value }))}
                className="h-[54px] w-full rounded-2xl border border-[#E2E8F0] bg-white pl-14 pr-4 text-sm font-medium text-[#0F172A] shadow-[0_1px_2px_rgba(15,23,42,0.03)] outline-none transition duration-200 hover:border-blue-200 focus:border-[#2563FF] focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <label className="group relative block">
              <CalendarDays className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#2563FF]" strokeWidth={1.9} />
              <input
                type="date"
                value={listFilters.endDate}
                onChange={(event) => setListFilters((current) => ({ ...current, page: 1, endDate: event.target.value }))}
                className="h-[54px] w-full rounded-2xl border border-[#E2E8F0] bg-white pl-14 pr-4 text-sm font-medium text-[#0F172A] shadow-[0_1px_2px_rgba(15,23,42,0.03)] outline-none transition duration-200 hover:border-blue-200 focus:border-[#2563FF] focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <label className="group relative block">
              <ArrowUpDown className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#2563FF]" strokeWidth={1.9} />
              <select
                value={listFilters.sort}
                onChange={(event) => setListFilters((current) => ({ ...current, page: 1, sort: event.target.value as 'asc' | 'desc' }))}
                className="h-[54px] w-full appearance-none rounded-2xl border border-[#E2E8F0] bg-white pl-14 pr-12 text-sm font-medium text-[#0F172A] shadow-[0_1px_2px_rgba(15,23,42,0.03)] outline-none transition duration-200 hover:border-blue-200 focus:border-[#2563FF] focus:ring-4 focus:ring-blue-100"
                disabled={loadingVenues}
              >
                <option value="asc">Earliest first</option>
                <option value="desc">Latest first</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition group-hover:text-[#2563FF]" />
            </label>
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
