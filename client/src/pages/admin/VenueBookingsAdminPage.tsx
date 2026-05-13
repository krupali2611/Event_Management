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
    <section className="relative space-y-6 overflow-hidden px-0 pb-2 pt-1">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(circle_at_top_left,rgba(37,99,255,0.14),transparent_34%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_28%),radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.82),transparent_58%)]"
      />

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
                <h2 className="text-2xl font-bold tracking-tight text-[#0F172A]">All venue reservations across organizers</h2>
                <p className="max-w-2xl text-sm leading-7 text-[#64748B] sm:text-base">
                  View, filter and manage all venue booking requests.
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

        <div className="border-t border-slate-100/80 bg-white/80 px-6 py-6 sm:px-8">
          <div className="grid gap-4 xl:grid-cols-4">
            <label className="group relative block">
              <Building2 className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#2563FF]" strokeWidth={1.9} />
              <select
                value={filters.venueId}
                onChange={(event) => setFilters((current) => ({ ...current, page: 1, venueId: event.target.value }))}
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
                value={filters.startDate}
                onChange={(event) => setFilters((current) => ({ ...current, page: 1, startDate: event.target.value }))}
                className="h-[54px] w-full rounded-2xl border border-[#E2E8F0] bg-white pl-14 pr-4 text-sm font-medium text-[#0F172A] shadow-[0_1px_2px_rgba(15,23,42,0.03)] outline-none transition duration-200 hover:border-blue-200 focus:border-[#2563FF] focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <label className="group relative block">
              <CalendarDays className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#2563FF]" strokeWidth={1.9} />
              <input
                type="date"
                value={filters.endDate}
                onChange={(event) => setFilters((current) => ({ ...current, page: 1, endDate: event.target.value }))}
                className="h-[54px] w-full rounded-2xl border border-[#E2E8F0] bg-white pl-14 pr-4 text-sm font-medium text-[#0F172A] shadow-[0_1px_2px_rgba(15,23,42,0.03)] outline-none transition duration-200 hover:border-blue-200 focus:border-[#2563FF] focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <label className="group relative block">
              <ArrowUpDown className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#2563FF]" strokeWidth={1.9} />
              <select
                value={filters.sort}
                onChange={(event) => setFilters((current) => ({ ...current, page: 1, sort: event.target.value as 'asc' | 'desc' }))}
                className="h-[54px] w-full appearance-none rounded-2xl border border-[#E2E8F0] bg-white pl-14 pr-12 text-sm font-medium text-[#0F172A] shadow-[0_1px_2px_rgba(15,23,42,0.03)] outline-none transition duration-200 hover:border-blue-200 focus:border-[#2563FF] focus:ring-4 focus:ring-blue-100"
              >
                <option value="asc">Earliest first</option>
                <option value="desc">Latest first</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition group-hover:text-[#2563FF]" />
            </label>
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
