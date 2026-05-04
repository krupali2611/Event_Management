import { BarChart3, CalendarCheck2, Users } from 'lucide-react';
import Card from '@/components/ui/Card';

function OrganizerPage() {
  return (
    <section className="space-y-6">
      <Card className="p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-600">Protected Route</p>
        <h2 className="mt-4 text-3xl font-bold text-slate-950">Organizer Workspace</h2>
        <p className="mt-3 max-w-2xl text-slate-600">
          This route is available to ORGANIZER, ADMIN, and SUPER_ADMIN accounts for event-management workflows.
        </p>
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5"><CalendarCheck2 className="h-5 w-5 text-indigo-600" /><p className="mt-4 font-semibold">Upcoming launches</p><p className="mt-2 text-sm text-slate-600">Coordinate milestones and event timelines.</p></Card>
        <Card className="p-5"><Users className="h-5 w-5 text-indigo-600" /><p className="mt-4 font-semibold">Audience growth</p><p className="mt-2 text-sm text-slate-600">Track attendance, registrations, and drop-off points.</p></Card>
        <Card className="p-5"><BarChart3 className="h-5 w-5 text-indigo-600" /><p className="mt-4 font-semibold">Operational clarity</p><p className="mt-2 text-sm text-slate-600">Keep forms, tables, and cards balanced for daily work.</p></Card>
      </div>
    </section>
  );
}

export default OrganizerPage;
