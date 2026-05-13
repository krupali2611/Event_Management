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
      onClose={onClose}
      panelClassName="max-w-2xl sm:max-h-[calc(100vh-2rem)]"
      eyebrowClassName="text-orange-600"
      footer={
        <>
          <Button variant="secondary" className="border-orange-200 text-orange-700 hover:bg-orange-50" onClick={onClose}>
            Not now
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600" disabled={loading || soldOut} onClick={() => void handleConfirm()}>
            {loading ? 'Booking...' : 'Confirm Booking'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-4">
          <p className="text-xl font-semibold leading-8 text-slate-950">{event.title}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 sm:items-stretch">
          <div className="rounded-3xl border border-emerald-100 bg-white p-4">
            <RemainingSeatsIndicator
              remainingSeats={event.remainingSeats}
              attendeeLimit={event.attendeeLimit}
              soldTickets={event.soldTickets}
              compact
            />
          </div>
          <div className="rounded-3xl border border-orange-100 bg-white p-4">
            <QuantitySelector value={quantity} max={maxQuantity} disabled={loading || soldOut} onChange={setQuantity} />
          </div>
        </div>

        <BookingSummaryCard ticketPrice={event.ticketPrice} quantity={quantity} totalAmount={totalAmount} />

        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      </div>
    </Modal>
  );
}

export default TicketBookingModal;
