import { useCallback, useState } from 'react';
import { ticketService } from '@/services/ticketService';
import type { BookTicketPayload, TicketBookingItem } from '@/types/ticket.types';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

export function useBookTicket() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bookTicket = useCallback(async (payload: BookTicketPayload): Promise<TicketBookingItem> => {
    try {
      setLoading(true);
      setError(null);
      const response = await ticketService.bookTicket(payload);

      if (!response.data) {
        throw new Error('Ticket booking failed');
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
    bookTicket,
    loading,
    error,
    clearError,
  };
}
