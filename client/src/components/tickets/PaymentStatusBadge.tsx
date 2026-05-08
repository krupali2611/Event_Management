import TicketStatusBadge from '@/components/tickets/TicketStatusBadge';
import type { TicketPaymentStatus } from '@/types/ticket.types';

interface PaymentStatusBadgeProps {
  status: TicketPaymentStatus;
}

function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  return <TicketStatusBadge status={status} kind="payment" />;
}

export default PaymentStatusBadge;
