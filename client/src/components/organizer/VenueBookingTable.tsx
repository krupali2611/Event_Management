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
  onPageChange: (page: number) => void;
}

function VenueBookingTable({
  bookings,
  loading,
  pagination,
  onPageChange,
}: VenueBookingTableProps) {
  const showOrganizerColumn = bookings.some((booking) => Boolean(booking.organizerName));

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
        <thead className="bg-slate-50/80">
          <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            <th className="px-6 py-4">Venue Name</th>
            <th className="px-6 py-4">Date</th>
            <th className="px-6 py-4">Time</th>
            <th className="px-6 py-4">Event Name</th>
            {showOrganizerColumn ? <th className="px-6 py-4">Organizer</th> : null}
            <th className="px-6 py-4">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading ? (
            <tr>
              <td className="px-6 py-8 text-sm text-slate-500" colSpan={showOrganizerColumn ? 6 : 5}>
                Loading venue bookings...
              </td>
            </tr>
          ) : bookings.length === 0 ? (
            <tr>
              <td className="px-6 py-8 text-sm text-slate-500" colSpan={showOrganizerColumn ? 6 : 5}>
                No bookings found for the current filters.
              </td>
            </tr>
          ) : (
            bookings.map((booking) => (
              <tr key={booking.id} className="text-sm text-slate-700 transition-colors hover:bg-slate-50/80">
                <td className="px-6 py-4">
                  <p className="font-semibold text-slate-900">{booking.venueName}</p>
                </td>
                <td className="px-6 py-4">{booking.date}</td>
                <td className="px-6 py-4">{booking.time}</td>
                <td className="px-6 py-4 font-medium text-slate-800">{booking.eventName}</td>
                {showOrganizerColumn ? <td className="px-6 py-4">{booking.organizerName ?? 'Unknown organizer'}</td> : null}
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      booking.status === 'booked' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {booking.status === 'booked' ? 'Booked' : 'Cancelled'}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </Table>
  );
}

export default VenueBookingTable;
