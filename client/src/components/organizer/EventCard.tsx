import { CalendarDays, MapPin, Pencil, Trash2, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import EventStatusBadge from '@/components/organizer/EventStatusBadge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import type { EventItem } from '@/types/event.types';

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
}

function EventCard({ event, onDelete }: { event: EventItem; onDelete: (event: EventItem) => void }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-600">{event.category}</p>
          <h3 className="text-xl font-semibold text-slate-950">{event.title}</h3>
          <p className="text-sm text-slate-600">{event.description ?? 'No event description yet.'}</p>
        </div>
        <EventStatusBadge status={event.status} />
      </div>
      <div className="mt-5 space-y-3 text-sm text-slate-600">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-4 w-4 text-brand-500" />
          <span>{formatDateRange(event.startDate, event.endDate)}</span>
        </div>
        <div className="flex items-center gap-3">
          <MapPin className="h-4 w-4 text-brand-500" />
          <span>{event.venue ? `${event.venue.name}, ${event.venue.location}` : 'Venue not assigned yet'}</span>
        </div>
        <div className="flex items-center gap-3">
          <Users className="h-4 w-4 text-brand-500" />
          <span>{event.attendeeLimit} attendee limit</span>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link to={`/organizer/events/${event.id}`}>
          <Button>Open</Button>
        </Link>
        <Link to={`/organizer/events/${event.id}/edit`}>
          <Button variant="secondary" icon={<Pencil className="h-4 w-4" />}>
            Edit
          </Button>
        </Link>
        <Button variant="ghost" icon={<Trash2 className="h-4 w-4" />} onClick={() => onDelete(event)}>
          Delete
        </Button>
      </div>
    </Card>
  );
}

export default EventCard;
