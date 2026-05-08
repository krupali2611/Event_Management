import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import type { TicketEventAttendeeItem } from '@/types/ticket.types';
import PaymentStatusBadge from './PaymentStatusBadge';
import TicketStatusBadge from './TicketStatusBadge';

interface AttendeeTableProps {
  attendees: TicketEventAttendeeItem[];
  loading: boolean;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

function AttendeeTable({ attendees, loading, pagination, onPageChange }: AttendeeTableProps) {
  return (
    <Table
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
            <th className="px-6 py-4">Attendee</th>
            <th className="px-6 py-4">Quantity</th>
            <th className="px-6 py-4">Amount</th>
            <th className="px-6 py-4">Booking Status</th>
            <th className="px-6 py-4">Payment</th>
            <th className="px-6 py-4">Booked At</th>
            <th className="px-6 py-4">Ticket No.</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading ? (
            <tr>
              <td className="px-6 py-8 text-sm text-slate-500" colSpan={7}>
                Loading attendees...
              </td>
            </tr>
          ) : attendees.length === 0 ? (
            <tr>
              <td className="px-6 py-8 text-sm text-slate-500" colSpan={7}>
                No attendee bookings match the current filters.
              </td>
            </tr>
          ) : (
            attendees.map((attendee) => (
              <tr key={attendee.id} className="text-sm text-slate-700 transition-colors hover:bg-slate-50/80">
                <td className="px-6 py-4">
                  <p className="font-semibold text-slate-900">{attendee.attendeeName}</p>
                  <p className="mt-1 text-xs text-slate-500">{attendee.attendeeEmail}</p>
                </td>
                <td className="px-6 py-4">{attendee.quantity}</td>
                <td className="px-6 py-4 font-medium text-slate-900">{formatCurrency(attendee.totalAmount)}</td>
                <td className="px-6 py-4">
                  <TicketStatusBadge status={attendee.bookingStatus} kind="booking" />
                </td>
                <td className="px-6 py-4">
                  <PaymentStatusBadge status={attendee.paymentStatus} />
                </td>
                <td className="px-6 py-4">{new Date(attendee.bookedAt).toLocaleDateString('en-IN')}</td>
                <td className="px-6 py-4 font-medium text-slate-800">{attendee.ticketNumber}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </Table>
  );
}

export default AttendeeTable;
