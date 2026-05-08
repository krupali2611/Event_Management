import Badge from '@/components/ui/Badge';
import type { EventLifecycleStatus, EventStatus } from '@/types/event.types';

type EventDisplayStatus = 'DRAFT' | 'UPCOMING' | 'CONTINUE' | 'COMPLETE' | 'CANCELLED';

const badgeCopy: Record<EventDisplayStatus, { label: string; color: 'slate' | 'green' | 'red' | 'amber' | 'blue' }> = {
  DRAFT: { label: 'DRAFT', color: 'slate' },
  UPCOMING: { label: 'UPCOMING', color: 'blue' },
  CONTINUE: { label: 'CONTINUE', color: 'green' },
  COMPLETE: { label: 'COMPLETE', color: 'amber' },
  CANCELLED: { label: 'CANCELLED', color: 'red' },
};

function normalizeLifecycleStatus(status: string | null | undefined): EventLifecycleStatus {
  const normalized = status?.toUpperCase();

  if (normalized === 'ONGOING' || normalized === 'COMPLETED' || normalized === 'CANCELLED') {
    return normalized;
  }

  return 'UPCOMING';
}

export function getEventDisplayStatus(status: EventStatus | string | null | undefined, lifecycleStatus: EventLifecycleStatus | string | null | undefined): EventDisplayStatus {
  const normalizedStatus = status?.toUpperCase();

  if (normalizedStatus === 'DRAFT') {
    return 'DRAFT';
  }

  if (normalizedStatus === 'CANCELLED') {
    return 'CANCELLED';
  }

  const normalizedLifecycleStatus = normalizeLifecycleStatus(lifecycleStatus);

  if (normalizedLifecycleStatus === 'ONGOING') {
    return 'CONTINUE';
  }

  if (normalizedLifecycleStatus === 'COMPLETED') {
    return 'COMPLETE';
  }

  if (normalizedLifecycleStatus === 'CANCELLED') {
    return 'CANCELLED';
  }

  return 'UPCOMING';
}

function EventStatusBadge({
  status,
  lifecycleStatus,
}: {
  status: EventStatus | string | null | undefined;
  lifecycleStatus?: EventLifecycleStatus | string | null | undefined;
  compact?: boolean;
}) {
  const resolved = badgeCopy[getEventDisplayStatus(status, lifecycleStatus ?? status)];
  return <Badge color={resolved.color}>{resolved.label}</Badge>;
}

export default EventStatusBadge;
