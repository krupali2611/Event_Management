import { CalendarDays, MapPin, Ticket } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

const events = [
  {
    id: 'a1',
    title: 'Summer Music Festival',
    date: 'May 16, 2026',
    location: 'Mumbai Waterfront',
    image:
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'a2',
    title: 'Startup Demo Day',
    date: 'May 25, 2026',
    location: 'Ahmedabad Tech Hub',
    image:
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'a3',
    title: 'Food & Culture Carnival',
    date: 'June 08, 2026',
    location: 'Jaipur City Grounds',
    image:
      'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=900&q=80',
  },
];

function AttendeePage() {
  return (
    <section className="space-y-8">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-600">Protected Route</p>
        <h2 className="mt-4 text-4xl font-bold tracking-tight text-slate-950">Find events worth showing up for.</h2>
        <p className="mt-3 text-base text-slate-600">
          A visual attendee experience with simple navigation, large actions, and clear event details.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {events.map((event) => (
          <Card key={event.id} className="overflow-hidden p-0">
            <img src={event.image} alt={event.title} className="h-52 w-full object-cover" />
            <div className="p-5">
              <h3 className="text-xl font-bold text-slate-950">{event.title}</h3>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-orange-500" />{event.date}</div>
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-orange-500" />{event.location}</div>
              </div>
              <Button className="mt-5 w-full bg-orange-500 hover:bg-orange-600" size="lg" icon={<Ticket className="h-4 w-4" />}>
                Register
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

export default AttendeePage;
