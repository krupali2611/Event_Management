import Button from '@/components/ui/Button';
import Table from '@/components/ui/Table';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3 } from 'lucide-react';
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-[#64748B]">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              className="rounded-2xl border-[#E2E8F0] px-4 py-2.5 text-sm font-semibold text-[#64748B] shadow-sm hover:border-blue-200 hover:bg-[#F8FAFF] hover:text-[#2563FF]"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
              icon={<ChevronLeft className="h-4 w-4" />}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="rounded-2xl border-[#E2E8F0] px-4 py-2.5 text-sm font-semibold text-[#64748B] shadow-sm hover:border-blue-200 hover:bg-[#F8FAFF] hover:text-[#2563FF]"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange(pagination.page + 1)}
              icon={<ChevronRight className="h-4 w-4" />}
            >
              Next
            </Button>
          </div>
        </div>
      }
    >
      <table className="min-w-full divide-y divide-[#E2E8F0]">
        <thead className="sticky top-0 z-10 bg-[linear-gradient(180deg,rgba(248,250,255,0.98),rgba(255,255,255,0.98))] backdrop-blur-sm">
          <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-[#64748B]">
            <th className="px-6 py-4">Venue Name</th>
            <th className="px-6 py-4">Date</th>
            <th className="px-6 py-4">Time</th>
            <th className="px-6 py-4">Event Name</th>
            {showOrganizerColumn ? <th className="px-6 py-4">Organizer</th> : null}
            <th className="px-6 py-4">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {loading ? (
            <tr>
              <td className="px-6 py-10 text-sm text-[#64748B]" colSpan={showOrganizerColumn ? 6 : 5}>
                Loading venue bookings...
              </td>
            </tr>
          ) : bookings.length === 0 ? (
            <tr>
              <td className="px-6 py-10 text-sm text-[#64748B]" colSpan={showOrganizerColumn ? 6 : 5}>
                No bookings found for the current filters.
              </td>
            </tr>
          ) : (
            bookings.map((booking) => (
              <tr
                key={booking.id}
                className="text-sm text-slate-700 transition-all duration-200 hover:bg-[#F8FAFF] hover:shadow-[inset_0_1px_0_rgba(37,99,255,0.02)]"
              >
                <td className="px-6 py-5 align-middle">
                  <p className="font-semibold text-[#0F172A]">{booking.venueName}</p>
                </td>
                <td className="px-6 py-5 align-middle">
                  <span className="inline-flex items-center gap-2 text-[#334155]">
                    <CalendarDays className="h-4 w-4 text-[#2563FF]" />
                    {booking.date}
                  </span>
                </td>
                <td className="px-6 py-5 align-middle">
                  <span className="inline-flex items-center gap-2 text-[#334155]">
                    <Clock3 className="h-4 w-4 text-[#2563FF]" />
                    {booking.time}
                  </span>
                </td>
                <td className="px-6 py-5 align-middle font-medium text-[#1E293B]">{booking.eventName}</td>
                {showOrganizerColumn ? <td className="px-6 py-5 align-middle text-[#334155]">{booking.organizerName ?? 'Unknown organizer'}</td> : null}
                <td className="px-6 py-5 align-middle">
                  <span
                    className={`inline-flex rounded-full px-3.5 py-1.5 text-xs font-semibold ring-1 ring-inset ${
                      booking.status === 'booked'
                        ? 'bg-emerald-100 text-emerald-700 ring-emerald-200/70'
                        : 'bg-rose-100 text-rose-700 ring-rose-200/70'
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
