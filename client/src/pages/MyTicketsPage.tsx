import { CalendarDays, MapPin, Receipt, Ticket } from 'lucide-react';
import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import TicketCard from '@/components/tickets/TicketCard';
import TicketStatusBadge from '@/components/tickets/TicketStatusBadge';
import { useCancelTicket } from '@/hooks/useCancelTicket';
import { useMyTickets } from '@/hooks/useMyTickets';
import { ticketService } from '@/services/ticketService';
import type { TicketBookingItem } from '@/types/ticket.types';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

function formatCurrency(amount: number): string {
  if (amount <= 0) {
    return 'Free';
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function canCancelTicket(ticket: TicketBookingItem): boolean {
  return ticket.bookingStatus !== 'cancelled' && ticket.event.lifecycleStatus === 'UPCOMING';
}

function MyTicketsPage() {
  const { tickets, loading, error, refresh } = useMyTickets();
  const { cancelTicket, loading: cancelling, error: cancelError, clearError } = useCancelTicket();
  const [toast, setToast] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<TicketBookingItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<TicketBookingItem | null>(null);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const handleViewDetails = async (ticket: TicketBookingItem): Promise<void> => {
    try {
      setSelectedTicket(ticket);
      setDetailLoading(true);
      setDetailError(null);
      const response = await ticketService.getTicketById(ticket.id);
      setSelectedTicket(response.data ?? ticket);
    } catch (requestError) {
      setDetailError(getApiErrorMessage(requestError));
    } finally {
      setDetailLoading(false);
    }
  };

  const handleConfirmCancel = async (): Promise<void> => {
    if (!cancelTarget) {
      return;
    }

    try {
      clearError();
      const updatedTicket = await cancelTicket(cancelTarget.id);
      await refresh();
      setCancelTarget(null);
      setToast('Ticket cancelled successfully');

      if (selectedTicket?.id === updatedTicket.id) {
        setSelectedTicket(updatedTicket);
      }
    } catch {
      // Error message is handled by the hook state and displayed in the modal.
    }
  };

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-600">Attendee Tickets</p>
          <h2 className="mt-4 text-4xl font-bold tracking-tight text-slate-950">All your booked events in one place.</h2>
          <p className="mt-3 text-base text-slate-600">
            Review upcoming bookings, check ticket details, and cancel reservations before the event starts.
          </p>
        </div>
        <Button variant="secondary" onClick={() => void refresh()} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh Tickets'}
        </Button>
      </div>

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      {loading ? (
        <div className="grid gap-5">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="overflow-hidden p-0">
              <div className="h-2 animate-pulse bg-slate-200" />
              <div className="grid gap-0 lg:grid-cols-[220px_minmax(0,1fr)]">
                <div className="h-48 animate-pulse bg-slate-200 lg:h-full" />
                <div className="space-y-4 p-5">
                  <div className="h-6 w-40 animate-pulse rounded-full bg-slate-200" />
                  <div className="h-4 w-56 animate-pulse rounded-full bg-slate-200" />
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((__, innerIndex) => (
                      <div key={innerIndex} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : null}

      {!loading && tickets.length === 0 ? (
        <Card className="rounded-[2rem] border-dashed p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-orange-50 text-orange-600">
            <Ticket className="h-7 w-7" />
          </div>
          <h3 className="mt-5 text-xl font-semibold text-slate-950">No tickets booked yet</h3>
          <p className="mt-2 text-sm text-slate-600">Your confirmed ticket reservations will appear here once you book an upcoming event.</p>
        </Card>
      ) : null}

      <div className="grid gap-5">
        {tickets.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            onViewDetails={(nextTicket) => void handleViewDetails(nextTicket)}
            onCancel={setCancelTarget}
            cancelDisabled={!canCancelTicket(ticket)}
            cancelling={cancelling && cancelTarget?.id === ticket.id}
          />
        ))}
      </div>

      {selectedTicket ? (
        <Modal
          eyebrow="Ticket Details"
          title={selectedTicket.event.title}
          description="Detailed booking information for your reservation."
          onClose={() => {
            setSelectedTicket(null);
            setDetailError(null);
          }}
          footer={
            <Button variant="secondary" onClick={() => setSelectedTicket(null)}>
              Close
            </Button>
          }
        >
          {detailLoading ? <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">Loading ticket details...</div> : null}
          {detailError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{detailError}</div> : null}
          {!detailLoading && !detailError ? (
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2">
                <TicketStatusBadge status={selectedTicket.bookingStatus} kind="booking" />
                <TicketStatusBadge status={selectedTicket.paymentStatus} kind="payment" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Card className="rounded-3xl border-slate-200 bg-slate-50/90 p-4 shadow-none">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Ticket Number</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">{selectedTicket.ticketNumber}</p>
                </Card>
                <Card className="rounded-3xl border-slate-200 bg-slate-50/90 p-4 shadow-none">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Booked On</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">{formatDate(selectedTicket.bookedAt)}</p>
                </Card>
              </div>
              <div className="grid gap-3 text-sm text-slate-600">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <CalendarDays className="h-4 w-4 text-brand-500" />
                  <span>{formatDate(selectedTicket.event.startDate)}{selectedTicket.event.startTime ? ` - ${selectedTicket.event.startTime}` : ''}</span>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <MapPin className="h-4 w-4 text-brand-500" />
                  <span>{selectedTicket.event.venue ? `${selectedTicket.event.venue.name}, ${selectedTicket.event.venue.location}` : 'Venue to be announced'}</span>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <Receipt className="h-4 w-4 text-brand-500" />
                  <span>
                    {selectedTicket.quantity} ticket{selectedTicket.quantity === 1 ? '' : 's'} - {formatCurrency(selectedTicket.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </Modal>
      ) : null}

      {cancelTarget ? (
        <Modal
          eyebrow="Cancel Ticket"
          title="Cancel this booking?"
          description="The reserved seats will become available again immediately after cancellation."
          onClose={() => {
            setCancelTarget(null);
            clearError();
          }}
          footer={
            <>
              <Button variant="secondary" onClick={() => setCancelTarget(null)}>
                Keep Ticket
              </Button>
              <Button variant="danger" disabled={cancelling} onClick={() => void handleConfirmCancel()}>
                {cancelling ? 'Cancelling...' : 'Cancel Ticket'}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-950">{cancelTarget.event.title}</p>
              <p className="mt-1">Ticket No. {cancelTarget.ticketNumber}</p>
            </div>
            {cancelError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{cancelError}</div> : null}
          </div>
        </Modal>
      ) : null}

      {toast ? (
        <div className="pointer-events-none fixed bottom-6 right-6 z-50 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-medium text-emerald-700 shadow-2xl shadow-emerald-100">
          {toast}
        </div>
      ) : null}
    </section>
  );
}

export default MyTicketsPage;
