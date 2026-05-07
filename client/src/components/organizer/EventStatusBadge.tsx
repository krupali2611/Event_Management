import Badge from '@/components/ui/Badge';
import type { EventLifecycleStatus } from '@/types/event.types';

const badgeCopy: Record<EventLifecycleStatus, { label: string; color: 'slate' | 'green' | 'red' | 'amber' }> = {
  UPCOMING: { label: 'UPCOMING', color: 'slate' },
  ONGOING: { label: 'ONGOING', color: 'green' },
  COMPLETED: { label: 'COMPLETED', color: 'amber' },
  CANCELLED: { label: 'CANCELLED', color: 'red' },
};

function normalizeEventStatus(status: string | null | undefined): EventLifecycleStatus {
  const normalized = status?.toUpperCase();

  if (normalized === 'ONGOING' || normalized === 'COMPLETED' || normalized === 'CANCELLED') {
    return normalized;
  }

  return 'UPCOMING';
}

function EventStatusBadge({ status }: { status: EventLifecycleStatus | string | null | undefined; compact?: boolean }) {
  const resolved = badgeCopy[normalizeEventStatus(status)];
  return <Badge color={resolved.color}>{resolved.label}</Badge>;
}

export default EventStatusBadge;
