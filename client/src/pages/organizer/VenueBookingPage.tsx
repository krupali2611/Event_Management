import { useEffect, useMemo, useState } from 'react';
import BookingAvailabilityPanel from '@/components/organizer/BookingAvailabilityPanel';
import VenueBookingForm, { type VenueBookingFormValues } from '@/components/organizer/VenueBookingForm';
import VenueBookingTable from '@/components/organizer/VenueBookingTable';
import Card from '@/components/ui/Card';
import { venueBookingService } from '@/services/venueBooking.service';
import { venueService } from '@/services/venue.service';
import type { BookingAvailability, VenueBooking, VenueBookingListData, VenueBookingListFilters } from '@/types/venue-booking.types';
import type { Venue } from '@/types/venue.types';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

const initialValues: VenueBookingFormValues = {
  venueId: '',
  startDate: '',
  endDate: '',
  startTime: '',
  endTime: '',
};

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
  const [formValues, setFormValues] = useState<VenueBookingFormValues>(initialValues);
  const [availability, setAvailability] = useState<BookingAvailability | null>(null);
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
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canCheckAvailability = useMemo(
    () => Boolean(formValues.venueId && formValues.startDate && formValues.endDate),
    [formValues.endDate, formValues.startDate, formValues.venueId],
  );

  const canSubmit = Boolean(canCheckAvailability && availability?.available);

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

  const handleChange = (field: keyof VenueBookingFormValues, value: string): void => {
    setFormValues((current) => ({ ...current, [field]: value }));
    if (field === 'venueId' || field === 'startDate' || field === 'endDate') {
      setAvailability(null);
    }
  };

  const handleCheckAvailability = async (): Promise<void> => {
    if (!canCheckAvailability) {
      setError('Select venue, start date, and end date before checking availability.');
      return;
    }

    try {
      setCheckingAvailability(true);
      setError(null);
      const response = await venueBookingService.checkAvailability({
        venueId: formValues.venueId,
        startDate: formValues.startDate,
        endDate: formValues.endDate,
      });
      setAvailability(response.data ?? null);
    } catch (requestError) {
      setAvailability(null);
      setError(getApiErrorMessage(requestError));
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleSubmit = async (): Promise<void> => {
    try {
      setSubmitting(true);
      setError(null);
      await venueBookingService.createBooking({
        venueId: formValues.venueId,
        startDate: formValues.startDate,
        endDate: formValues.endDate,
        ...(formValues.startTime ? { startTime: formValues.startTime } : {}),
        ...(formValues.endTime ? { endTime: formValues.endTime } : {}),
      });
      setFormValues(initialValues);
      setAvailability(null);
      await loadBookings(listFilters);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (booking: VenueBooking): Promise<void> => {
    try {
      setError(null);
      await venueBookingService.cancelBooking(booking.id);
      await loadBookings(listFilters);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    }
  };

  return (
    <section className="space-y-6">
      <VenueBookingForm
        values={formValues}
        venues={venues}
        checkingAvailability={checkingAvailability || loadingVenues}
        submitting={submitting}
        canSubmit={canSubmit}
        onChange={handleChange}
        onCheckAvailability={() => void handleCheckAvailability()}
        onSubmit={() => void handleSubmit()}
      />

      <BookingAvailabilityPanel availability={availability} loading={checkingAvailability} />

      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <Card className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Live Booking Ledger</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-950">Upcoming venue reservations</h3>
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
        showCancelAction
        onCancel={(booking) => void handleCancel(booking)}
        onPageChange={(page) => setListFilters((current) => ({ ...current, page }))}
      />
    </section>
  );
}

export default VenueBookingPage;
