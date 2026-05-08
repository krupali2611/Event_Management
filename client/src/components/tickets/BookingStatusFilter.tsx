import type { TicketBookingStatus, TicketPaymentStatus } from '@/types/ticket.types';

interface BookingStatusFilterProps {
  bookingStatus: '' | Uppercase<TicketBookingStatus>;
  paymentStatus: '' | Uppercase<TicketPaymentStatus>;
  onBookingStatusChange: (status: '' | Uppercase<TicketBookingStatus>) => void;
  onPaymentStatusChange: (status: '' | Uppercase<TicketPaymentStatus>) => void;
}

function BookingStatusFilter({
  bookingStatus,
  paymentStatus,
  onBookingStatusChange,
  onPaymentStatusChange,
}: BookingStatusFilterProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <select
        value={bookingStatus}
        onChange={(event) => onBookingStatusChange(event.target.value as BookingStatusFilterProps['bookingStatus'])}
        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white"
      >
        <option value="">All booking statuses</option>
        <option value="CONFIRMED">Confirmed</option>
        <option value="PENDING">Pending</option>
        <option value="CANCELLED">Cancelled</option>
        <option value="USED">Used</option>
        <option value="REFUNDED">Refunded</option>
      </select>
      <select
        value={paymentStatus}
        onChange={(event) => onPaymentStatusChange(event.target.value as BookingStatusFilterProps['paymentStatus'])}
        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white"
      >
        <option value="">All payment statuses</option>
        <option value="PENDING">Pending</option>
        <option value="PAID">Paid</option>
        <option value="FAILED">Failed</option>
        <option value="REFUN_PENDING">Refund Pending</option>
        <option value="REFUNDED">Refunded</option>
      </select>
    </div>
  );
}

export default BookingStatusFilter;
