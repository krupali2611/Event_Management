import Badge from '@/components/ui/Badge';
import type { EventStatus } from '@/types/event.types';

const badgeCopy: Record<EventStatus, { label: string; color: 'amber' | 'green' | 'red' }> = {
  draft: { label: 'Draft', color: 'amber' },
  published: { label: 'Published', color: 'green' },
  cancelled: { label: 'Cancelled', color: 'red' },
};

function EventStatusBadge({ status }: { status: EventStatus }) {
  const resolved = badgeCopy[status];
  return <Badge color={resolved.color}>{resolved.label}</Badge>;
}

export default EventStatusBadge;
