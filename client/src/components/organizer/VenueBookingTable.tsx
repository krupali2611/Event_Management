import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Table from '@/components/ui/Table';
import type { VenueBooking } from '@/types/venue-booking.types';

interface VenueBookingTableProps {
  bookings: VenueBooking[];
  loading: boolean;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  showCancelAction?: boolean;
  onCancel?: (booking: VenueBooking) => void;
  onPageChange: (page: number) => void;
}

function formatDateRange(startDate: string, endDate: string): string {
  const formatter = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return `${formatter.format(new Date(startDate))} - ${formatter.format(new Date(endDate))}`;
}

function VenueBookingTable({
  bookings,
  loading,
  pagination,
  showCancelAction = false,
  onCancel,
  onPageChange,
}: VenueBookingTableProps) {
  return (
    <Table
      footer={
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={pagination.page <= 1} onClick={() => onPageChange(pagination.page - 1)}>
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      }
    >
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            <th className="px-6 py-4">Venue</th>
            <th className="px-6 py-4">Dates</th>
            <th className="px-6 py-4">Time</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Future Event Link</th>
            {showCancelAction ? <th className="px-6 py-4 text-right">Action</th> : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading ? (
            <tr>
              <td className="px-6 py-8 text-sm text-slate-500" colSpan={showCancelAction ? 6 : 5}>
                Loading venue bookings...
              </td>
            </tr>
          ) : bookings.length === 0 ? (
            <tr>
              <td className="px-6 py-8 text-sm text-slate-500" colSpan={showCancelAction ? 6 : 5}>
                No bookings found for the current filters.
              </td>
            </tr>
          ) : (
            bookings.map((booking) => (
              <tr key={booking.id} className="text-sm text-slate-700">
                <td className="px-6 py-4">
                  <p className="font-semibold text-slate-900">{booking.venue?.name ?? booking.venueId}</p>
                  <p className="mt-1 text-xs text-slate-500">{booking.venue?.location ?? 'Venue summary unavailable'}</p>
                </td>
                <td className="px-6 py-4">{formatDateRange(booking.startDate, booking.endDate)}</td>
                <td className="px-6 py-4">{booking.startTime || booking.endTime ? `${booking.startTime ?? '--:--'} - ${booking.endTime ?? '--:--'}` : 'Flexible'}</td>
                <td className="px-6 py-4">
                  <Badge color={booking.status === 'booked' ? 'green' : 'red'}>{booking.status === 'booked' ? 'Booked' : 'Cancelled'}</Badge>
                </td>
                <td className="px-6 py-4 text-slate-500">{booking.eventId ? 'Attached' : 'Ready for event mapping'}</td>
                {showCancelAction ? (
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={booking.status === 'cancelled'}
                      onClick={() => onCancel?.(booking)}
                    >
                      {booking.status === 'cancelled' ? 'Cancelled' : 'Cancel'}
                    </Button>
                  </td>
                ) : null}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </Table>
  );
}

export default VenueBookingTable;
