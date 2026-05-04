import { CalendarDays, MapPin, Users } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

const events = [
  { id: '1', title: 'Spring Product Expo', date: 'May 14, 2026', location: 'Ahmedabad Convention Hall', attendees: 420, status: 'Live' },
  { id: '2', title: 'Founders Networking Night', date: 'May 21, 2026', location: 'Riverfront Pavilion', attendees: 185, status: 'Draft' },
  { id: '3', title: 'Design Systems Summit', date: 'June 02, 2026', location: 'Hybrid Event', attendees: 760, status: 'Open' },
];

function OrganizerEventsPage() {
  return (
    <section className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-3">
        {events.map((event) => (
          <Card key={event.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-600">Event</p>
                <h2 className="mt-3 text-xl font-bold text-slate-950">{event.title}</h2>
              </div>
              <Badge color={event.status === 'Live' ? 'green' : event.status === 'Open' ? 'blue' : 'amber'}>{event.status}</Badge>
            </div>
            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-4 w-4 text-indigo-500" />
                <span>{event.date}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-indigo-500" />
                <span>{event.location}</span>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-indigo-500" />
                <span>{event.attendees} expected attendees</span>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <Button className="bg-indigo-600 hover:bg-indigo-700">Open</Button>
              <Button variant="secondary">Edit</Button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

export default OrganizerEventsPage;
