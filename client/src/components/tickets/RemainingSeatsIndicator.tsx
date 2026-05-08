import { AlertCircle, CheckCircle2, Users } from 'lucide-react';

interface RemainingSeatsIndicatorProps {
  remainingSeats: number;
  attendeeLimit: number;
  soldTickets?: number;
  compact?: boolean;
}

function RemainingSeatsIndicator({ remainingSeats, attendeeLimit, soldTickets, compact = false }: RemainingSeatsIndicatorProps) {
  const soldOut = remainingSeats <= 0;
  const lowAvailability = remainingSeats > 0 && remainingSeats <= Math.max(3, Math.floor(attendeeLimit * 0.1));

  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${
        soldOut
          ? 'border-rose-200 bg-rose-50 text-rose-700'
          : lowAvailability
            ? 'border-amber-200 bg-amber-50 text-amber-700'
            : 'border-emerald-200 bg-emerald-50 text-emerald-700'
      }`}
    >
      <div className="flex items-start gap-3">
        {soldOut ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : lowAvailability ? <Users className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
        <div className="space-y-1">
          <p className={`font-semibold ${compact ? 'text-sm' : 'text-base'}`}>{soldOut ? 'Sold out' : `${remainingSeats} seat${remainingSeats === 1 ? '' : 's'} left`}</p>
          <p className="text-xs">
            {soldTickets !== undefined ? `${soldTickets} booked out of ${attendeeLimit}` : `${attendeeLimit} total attendee capacity`}
          </p>
        </div>
      </div>
    </div>
  );
}

export default RemainingSeatsIndicator;
