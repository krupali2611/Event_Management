import { CalendarDays, MapPin, Ticket } from 'lucide-react';
import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useBookTicket } from '@/hooks/useBookTicket';
import type { EventItem } from '@/types/event.types';
import type { TicketBookingItem } from '@/types/ticket.types';
import BookingSummaryCard from './BookingSummaryCard';
import QuantitySelector from './QuantitySelector';
import RemainingSeatsIndicator from './RemainingSeatsIndicator';

interface TicketBookingModalProps {
  event: EventItem;
  onClose: () => void;
  onBooked: (booking: TicketBookingItem) => void;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function TicketBookingModal({ event, onClose, onBooked }: TicketBookingModalProps) {
  const { bookTicket, loading, error, clearError } = useBookTicket();
  const [quantity, setQuantity] = useState(1);
  const maxQuantity = Math.max(event.remainingSeats, 1);
  const totalAmount = event.ticketPrice * quantity;
  const soldOut = event.remainingSeats <= 0;

  useEffect(() => {
    setQuantity(1);
    clearError();
  }, [event.id, clearError]);

  const handleConfirm = async (): Promise<void> => {
    const booking = await bookTicket({
      eventId: event.id,
      quantity,
    });

    onBooked(booking);
  };

  return (
    <Modal
      eyebrow="Ticket Booking"
      title="Reserve your spot"
      description="Review your booking details before confirming your ticket reservation."
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Not now
          </Button>
          <Button disabled={loading || soldOut} onClick={() => void handleConfirm()}>
            {loading ? 'Booking...' : 'Confirm Booking'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-brand-50 p-3 text-brand-700">
              <Ticket className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold text-slate-950">{event.title}</p>
              <div className="mt-2 space-y-1 text-sm text-slate-600">
                <p className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-slate-400" />
                  {formatDate(event.startDate)}{event.startDate !== event.endDate ? ` - ${formatDate(event.endDate)}` : ''}
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  {event.venue ? `${event.venue.name}, ${event.venue.location}` : 'Venue to be announced'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <RemainingSeatsIndicator remainingSeats={event.remainingSeats} attendeeLimit={event.attendeeLimit} soldTickets={event.soldTickets} />
        <QuantitySelector value={quantity} max={maxQuantity} disabled={loading || soldOut} onChange={setQuantity} />
        <BookingSummaryCard ticketPrice={event.ticketPrice} quantity={quantity} totalAmount={totalAmount} />

        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      </div>
    </Modal>
  );
}

export default TicketBookingModal;
