import { useCallback, useEffect, useState } from 'react';
import { ticketService } from '@/services/ticketService';
import type { TicketBookingItem } from '@/types/ticket.types';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

function isVisibleTicket(ticket: TicketBookingItem): boolean {
  return ticket.bookingStatus !== 'cancelled' && ticket.event.lifecycleStatus !== 'CANCELLED';
}

export function useMyTickets() {
  const [tickets, setTickets] = useState<TicketBookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const response = await ticketService.getMyTickets();
      setTickets((response.data?.bookings ?? []).filter(isVisibleTicket));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    tickets,
    loading,
    error,
    refresh,
    setTickets,
  };
}
