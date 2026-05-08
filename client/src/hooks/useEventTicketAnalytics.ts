import { useCallback, useEffect, useMemo, useState } from 'react';
import { ticketService } from '@/services/ticketService';
import type { TicketEventAttendeeFilters, TicketEventAttendeeListData, TicketEventStats } from '@/types/ticket.types';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

const defaultPagination = {
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 1,
};

const emptyAttendees: TicketEventAttendeeListData = {
  event: {
    id: '',
    title: '',
    attendeeLimit: 0,
    soldTickets: 0,
    remainingSeats: 0,
  },
  attendees: [],
  pagination: defaultPagination,
};

const emptyStats: TicketEventStats = {
  eventId: '',
  eventTitle: '',
  attendeeLimit: 0,
  totalTicketsSold: 0,
  remainingSeats: 0,
  totalRevenue: 0,
  totalBookings: 0,
  cancelledBookings: 0,
  confirmedBookings: 0,
};

export function useEventTicketAnalytics(eventId: string, initialFilters?: Partial<TicketEventAttendeeFilters>) {
  const [filters, setFilters] = useState<TicketEventAttendeeFilters>({
    page: 1,
    limit: 10,
    search: '',
    bookingStatus: '',
    paymentStatus: '',
    ...initialFilters,
  });
  const [attendeeData, setAttendeeData] = useState<TicketEventAttendeeListData>(emptyAttendees);
  const [stats, setStats] = useState<TicketEventStats>(emptyStats);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filterKey = useMemo(
    () =>
      JSON.stringify({
        eventId,
        page: filters.page,
        limit: filters.limit,
        search: filters.search,
        bookingStatus: filters.bookingStatus,
        paymentStatus: filters.paymentStatus,
      }),
    [eventId, filters.bookingStatus, filters.limit, filters.page, filters.paymentStatus, filters.search],
  );

  const refreshStats = useCallback(async (): Promise<void> => {
    try {
      setStatsLoading(true);
      const response = await ticketService.getEventStats(eventId);
      setStats(response.data ?? emptyStats);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setStatsLoading(false);
    }
  }, [eventId]);

  const refreshAttendees = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const response = await ticketService.getEventAttendees(eventId, filters);
      setAttendeeData(response.data ?? emptyAttendees);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [eventId, filters]);

  useEffect(() => {
    void refreshAttendees();
  }, [filterKey, refreshAttendees]);

  useEffect(() => {
    void refreshStats();
  }, [refreshStats]);

  const refreshAll = useCallback(async (): Promise<void> => {
    await Promise.all([refreshAttendees(), refreshStats()]);
  }, [refreshAttendees, refreshStats]);

  return {
    attendeeData,
    stats,
    filters,
    setFilters,
    loading,
    statsLoading,
    error,
    refreshAll,
  };
}
