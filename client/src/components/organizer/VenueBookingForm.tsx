import { CalendarDays, Clock3, MapPin } from 'lucide-react';
import { useMemo } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import type { Venue } from '@/types/venue.types';

export interface VenueBookingFormValues {
  venueId: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
}

interface VenueBookingFormProps {
  values: VenueBookingFormValues;
  venues: Venue[];
  checkingAvailability: boolean;
  submitting: boolean;
  canSubmit: boolean;
  onChange: (field: keyof VenueBookingFormValues, value: string) => void;
  onCheckAvailability: () => void;
  onSubmit: () => void;
}

function VenueBookingForm({
  values,
  venues,
  checkingAvailability,
  submitting,
  canSubmit,
  onChange,
  onCheckAvailability,
  onSubmit,
}: VenueBookingFormProps) {
  const selectedVenue = useMemo(() => venues.find((venue) => venue.id === values.venueId) ?? null, [venues, values.venueId]);

  return (
    <Card className="overflow-hidden">
      <div className="bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_55%,#34d399_100%)] px-6 py-6 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/75">Venue Booking System</p>
        <h2 className="mt-3 text-2xl font-semibold">Reserve venues with conflict-safe availability checks</h2>
        <p className="mt-2 max-w-2xl text-sm text-white/80">
          This module is ready for future event attachment through an optional `eventId`, while staying focused on dates, availability, and clean booking operations today.
        </p>
      </div>

      <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]">
        <div className="space-y-5">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-800">Venue</span>
            <select
              value={values.venueId}
              onChange={(event) => onChange('venueId', event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white"
            >
              <option value="">Select a venue</option>
              {venues.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name} • {venue.location}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-800">Start Date</span>
              <Input type="date" value={values.startDate} onChange={(event) => onChange('startDate', event.target.value)} />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-800">End Date</span>
              <Input type="date" value={values.endDate} onChange={(event) => onChange('endDate', event.target.value)} />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-800">Start Time</span>
              <Input type="time" value={values.startTime} onChange={(event) => onChange('startTime', event.target.value)} />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-800">End Time</span>
              <Input type="time" value={values.endTime} onChange={(event) => onChange('endTime', event.target.value)} />
            </label>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="secondary" disabled={checkingAvailability} onClick={onCheckAvailability}>
              {checkingAvailability ? 'Checking...' : 'Check Availability'}
            </Button>
            <Button variant="success" disabled={!canSubmit || submitting} onClick={onSubmit}>
              {submitting ? 'Booking...' : 'Book Venue'}
            </Button>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/90 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Booking Summary</p>
          {selectedVenue ? (
            <div className="mt-4 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">{selectedVenue.name}</h3>
                <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="h-4 w-4 text-indigo-500" />
                  <span>{selectedVenue.location}</span>
                </div>
              </div>
              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-indigo-500" />
                  <span>
                    {values.startDate || 'Start date'} to {values.endDate || 'End date'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-indigo-500" />
                  <span>
                    {values.startTime || 'Flexible start'} to {values.endTime || 'Flexible end'}
                  </span>
                </div>
              </div>
              <div className="rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-sm">
                Capacity: <span className="font-semibold text-slate-900">{selectedVenue.capacity}</span>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Choose a venue to preview booking details and keep the future event linkage open.</p>
          )}
        </div>
      </div>
    </Card>
  );
}

export default VenueBookingForm;
