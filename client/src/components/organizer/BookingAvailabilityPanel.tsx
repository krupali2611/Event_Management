import { CalendarRange, CircleCheckBig, CircleX, TimerReset } from 'lucide-react';
import Card from '@/components/ui/Card';
import type { BookingAvailability } from '@/types/venue-booking.types';

interface BookingAvailabilityPanelProps {
  availability: BookingAvailability | null;
  loading: boolean;
}

function BookingAvailabilityPanel({ availability, loading }: BookingAvailabilityPanelProps) {
  if (loading) {
    return (
      <Card className="p-5">
        <div className="flex items-center gap-3 text-slate-600">
          <TimerReset className="h-5 w-5 animate-spin text-indigo-600" />
          <span className="text-sm font-medium">Checking venue availability...</span>
        </div>
      </Card>
    );
  }

  if (!availability) {
    return (
      <Card className="border-dashed p-5">
        <div className="flex items-center gap-3 text-slate-500">
          <CalendarRange className="h-5 w-5 text-indigo-500" />
          <span className="text-sm">Select a venue and date range to validate availability before creating a booking.</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-5 ${availability.available ? 'border-emerald-200 bg-emerald-50/80' : 'border-rose-200 bg-rose-50/80'}`}>
      <div className="flex items-start gap-3">
        {availability.available ? (
          <CircleCheckBig className="mt-0.5 h-5 w-5 text-emerald-600" />
        ) : (
          <CircleX className="mt-0.5 h-5 w-5 text-rose-600" />
        )}
        <div>
          <p className={`text-sm font-semibold ${availability.available ? 'text-emerald-700' : 'text-rose-700'}`}>
            {availability.available ? 'Venue available' : 'Venue not available'}
          </p>
          <p className={`mt-1 text-sm ${availability.available ? 'text-emerald-700/80' : 'text-rose-700/80'}`}>
            {availability.available
              ? 'The selected venue can be reserved for this date range.'
              : 'Another active booking overlaps with the selected dates. Choose different dates or another venue.'}
          </p>
        </div>
      </div>
    </Card>
  );
}

export default BookingAvailabilityPanel;
