import Badge from '@/components/ui/Badge';
import type { TicketBookingStatus, TicketPaymentStatus } from '@/types/ticket.types';

interface TicketStatusBadgeProps {
  status: TicketBookingStatus | TicketPaymentStatus;
  kind: 'booking' | 'payment';
}

function getBadgeColor(status: TicketStatusBadgeProps['status'], kind: TicketStatusBadgeProps['kind']) {
  if (kind === 'booking') {
    switch (status) {
      case 'confirmed':
        return 'green';
      case 'cancelled':
      case 'refunded':
        return 'red';
      case 'pending':
      default:
        return 'amber';
    }
  }

  switch (status) {
    case 'paid':
      return 'green';
    case 'failed':
      return 'red';
    case 'refunded':
      return 'slate';
    case 'refun_pending':
    case 'pending':
    default:
      return 'amber';
  }
}

function formatStatusLabel(status: TicketStatusBadgeProps['status']): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function TicketStatusBadge({ status, kind }: TicketStatusBadgeProps) {
  return <Badge color={getBadgeColor(status, kind)}>{formatStatusLabel(status)}</Badge>;
}

export default TicketStatusBadge;
