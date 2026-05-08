import { BarChart3, CalendarCheck2, Ticket, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import RevenueCard from '@/components/tickets/RevenueCard';
import TicketAnalyticsCard from '@/components/tickets/TicketAnalyticsCard';
import Card from '@/components/ui/Card';
import { ticketService } from '@/services/ticketService';
import type { TicketDashboardSummary } from '@/types/ticket.types';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

const emptySummary: TicketDashboardSummary = {
  totalEvents: 0,
  totalTicketsSold: 0,
  totalRevenue: 0,
  upcomingEvents: 0,
  soldOutEvents: 0,
};

function OrganizerPage() {
  const [summary, setSummary] = useState<TicketDashboardSummary>(emptySummary);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await ticketService.getDashboardSummary();
        setSummary(response.data ?? emptySummary);
      } catch (requestError) {
        setError(getApiErrorMessage(requestError));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const analyticsCards = [
    { label: 'Total Events', value: loading ? '--' : summary.totalEvents, helper: 'Owned or visible in current workspace', icon: CalendarCheck2, tone: 'brand' as const },
    { label: 'Total Tickets Sold', value: loading ? '--' : summary.totalTicketsSold, helper: 'Confirmed tickets only', icon: Ticket, tone: 'emerald' as const },
    { label: 'Upcoming Events', value: loading ? '--' : summary.upcomingEvents, helper: 'Open for future attendance', icon: CalendarCheck2, tone: 'amber' as const },
    { label: 'Sold Out Events', value: loading ? '--' : summary.soldOutEvents, helper: 'Events with no remaining seats', icon: Users, tone: 'rose' as const },
  ];

  return (
    <section className="space-y-6">
      <Card className="p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-700">Ticket Operations</p>
        <h2 className="mt-3 text-3xl font-semibold text-slate-950">Track how your events are performing.</h2>
        <p className="mt-3 max-w-2xl text-slate-600">Monitor ticket demand, revenue, and sold-out momentum across your event portfolio from one compact dashboard.</p>
      </Card>
      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {analyticsCards.map((card) => (
          <TicketAnalyticsCard key={card.label} {...card} />
        ))}
        <RevenueCard label="Total Revenue" value={loading ? 0 : summary.totalRevenue} helper="Confirmed bookings only" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5"><CalendarCheck2 className="h-5 w-5 text-indigo-600" /><p className="mt-4 font-semibold">Upcoming launches</p><p className="mt-2 text-sm text-slate-600">Keep upcoming events visible and protect capacity before launch day.</p></Card>
        <Card className="p-5"><Users className="h-5 w-5 text-indigo-600" /><p className="mt-4 font-semibold">Audience growth</p><p className="mt-2 text-sm text-slate-600">Review attendee patterns and keep exports ready for outreach or check-in flows.</p></Card>
        <Card className="p-5"><BarChart3 className="h-5 w-5 text-indigo-600" /><p className="mt-4 font-semibold">Revenue visibility</p><p className="mt-2 text-sm text-slate-600">Track confirmed booking revenue without disturbing the booking pipeline.</p></Card>
      </div>
    </section>
  );
}

export default OrganizerPage;
