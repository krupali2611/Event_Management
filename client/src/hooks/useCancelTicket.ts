import { useCallback, useState } from 'react';
import { ticketService } from '@/services/ticketService';
import type { TicketBookingItem } from '@/types/ticket.types';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

export function useCancelTicket() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelTicket = useCallback(async (id: string): Promise<TicketBookingItem> => {
    try {
      setLoading(true);
      setError(null);
      const response = await ticketService.cancelTicket(id);

      if (!response.data) {
        throw new Error('Ticket cancellation failed');
      }

      return response.data;
    } catch (requestError) {
      const message = getApiErrorMessage(requestError);
      setError(message);
      throw requestError;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    cancelTicket,
    loading,
    error,
    clearError,
  };
}
