import { CalendarDays, DollarSign, MessageSquareQuote, Star, Ticket, TrendingDown, TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import RatingStars from '@/components/feedback/RatingStars';
import ChartContainer from '@/components/organizer/dashboard/ChartContainer';
import DashboardTable from '@/components/organizer/dashboard/DashboardTable';
import StatCard from '@/components/organizer/dashboard/StatCard';
import Card from '@/components/ui/Card';
import { useOrganizerDashboardAnalytics } from '@/hooks/useOrganizerDashboardAnalytics';

function OrganizerPage() {
  const { stats, revenue, ticketSales, feedbackAnalytics, upcomingEvents, loading, error, hasAnyAnalytics } = useOrganizerDashboardAnalytics();

  const currencyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });

  const numberFormatter = new Intl.NumberFormat('en-IN');

  const analyticsCards = [
    { label: 'Total Events', value: numberFormatter.format(stats.totalEvents), helper: 'All events in your workspace', icon: CalendarDays },
    { label: 'Total Revenue', value: currencyFormatter.format(stats.totalRevenue), helper: 'Confirmed and used bookings only', icon: DollarSign },
    { label: 'Tickets Sold', value: numberFormatter.format(stats.ticketsSold), helper: 'Seat volume across booked events', icon: Ticket },
  ];

  const feedbackCards = [
    {
      label: 'Average Rating',
      value: feedbackAnalytics.totalReviews > 0 ? `${feedbackAnalytics.averageRating.toFixed(1)} / 5` : 'No ratings yet',
      helper: 'Across all reviewed organizer events',
      icon: Star,
    },
    {
      label: 'Total Reviews',
      value: numberFormatter.format(feedbackAnalytics.totalReviews),
      helper: 'Submitted by completed-event attendees',
      icon: MessageSquareQuote,
    },
  ];

  const revenueChartEmpty = revenue.months.every((item) => item.revenue === 0);
  const ticketSalesChartEmpty = ticketSales.events.length === 0;

  function formatDate(value: string): string {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));
  }

  return (
    <section className="space-y-6">
      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {analyticsCards.map((card) => (
          <StatCard key={card.label} label={card.label} value={card.value} helper={card.helper} icon={card.icon} loading={loading} />
        ))}
      </div>

      {!loading && !hasAnyAnalytics ? (
        <Card className="p-10 text-center">
          <h3 className="text-xl font-semibold text-slate-950">No organizer analytics yet</h3>
          <p className="mt-2 text-sm text-slate-600">
            Publish events and start receiving bookings to populate your dashboard with revenue, attendee, and ticket sales insights.
          </p>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartContainer
          title="Revenue by Month"
          description="Monthly booking revenue from confirmed and used ticket purchases."
          loading={loading}
          empty={revenueChartEmpty}
          emptyMessage="Monthly revenue will appear here once paid attendance starts coming in."
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenue.months} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickFormatter={(value: number) => `Rs ${numberFormatter.format(value)}`}
              />
              <Tooltip
                formatter={(value) => currencyFormatter.format(typeof value === 'number' ? value : Number(value ?? 0))}
                contentStyle={{ borderRadius: '16px', borderColor: '#cbd5e1' }}
              />
              <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer
          title="Ticket Sales by Event"
          description="Compare ticket volume across your highest-performing events."
          loading={loading}
          empty={ticketSalesChartEmpty}
          emptyMessage="Event-wise ticket sales will show up after your first bookings."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ticketSales.events} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="eventTitle"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                interval={0}
                angle={ticketSales.events.length > 4 ? -20 : 0}
                textAnchor={ticketSales.events.length > 4 ? 'end' : 'middle'}
                height={ticketSales.events.length > 4 ? 70 : 40}
              />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip
                formatter={(value) => numberFormatter.format(typeof value === 'number' ? value : Number(value ?? 0))}
                contentStyle={{ borderRadius: '16px', borderColor: '#cbd5e1' }}
              />
              <Bar dataKey="ticketsSold" fill="#0f766e" radius={[12, 12, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      <div className="grid gap-6">
        <DashboardTable
          title="Upcoming Events"
          description="Your next scheduled events, sorted by start date."
          headers={['Event', 'Date', 'Venue', 'Tickets Sold', 'Seats Left']}
          loading={loading}
          empty={upcomingEvents.length === 0}
          emptyMessage="No upcoming events are scheduled yet."
          rows={upcomingEvents.map((event) => (
            <tr key={event.id} className="align-top">
              <td className="px-5 py-4 sm:px-6">
                <p className="font-medium text-slate-950">{event.title}</p>
                <p className="mt-1 text-sm text-slate-500">{event.category}</p>
              </td>
              <td className="px-5 py-4 text-sm text-slate-700 sm:px-6">{formatDate(event.startDate)}</td>
              <td className="px-5 py-4 text-sm text-slate-700 sm:px-6">{event.venue?.name ?? 'Venue pending'}</td>
              <td className="px-5 py-4 text-sm text-slate-700 sm:px-6">{numberFormatter.format(event.soldTickets)}</td>
              <td className="px-5 py-4 text-sm font-medium text-slate-900 sm:px-6">{numberFormatter.format(event.remainingSeats)}</td>
            </tr>
          ))}
        />
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-slate-950">Feedback Analytics</h3>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {feedbackCards.map((card) => (
            <StatCard key={card.label} label={card.label} value={card.value} helper={card.helper} icon={card.icon} loading={loading} />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="rounded-[2rem] p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-slate-950">Highest Rated Events</h4>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              {feedbackAnalytics.highestRatedEvents.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                  No rated events yet.
                </div>
              ) : (
                feedbackAnalytics.highestRatedEvents.map((event) => (
                  <div key={`high-${event.eventId}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{event.eventTitle}</p>
                        <p className="mt-1 text-sm text-slate-500">{event.totalReviews} review{event.totalReviews > 1 ? 's' : ''}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-950">{event.averageRating.toFixed(1)}</p>
                        <RatingStars value={Math.round(event.averageRating)} size="sm" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="rounded-[2rem] p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-rose-100 p-3 text-rose-700">
                <TrendingDown className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-slate-950">Lowest Rated Events</h4>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              {feedbackAnalytics.lowestRatedEvents.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                  No rated events yet.
                </div>
              ) : (
                feedbackAnalytics.lowestRatedEvents.map((event) => (
                  <div key={`low-${event.eventId}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{event.eventTitle}</p>
                        <p className="mt-1 text-sm text-slate-500">{event.totalReviews} review{event.totalReviews > 1 ? 's' : ''}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-950">{event.averageRating.toFixed(1)}</p>
                        <RatingStars value={Math.round(event.averageRating)} size="sm" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <Card className="rounded-[2rem] p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
              <MessageSquareQuote className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-slate-950">Recent Attendee Reviews</h4>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {feedbackAnalytics.recentReviews.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                Recent reviews will appear here after attendees submit feedback.
              </div>
            ) : (
              feedbackAnalytics.recentReviews.map((feedback) => (
                <div key={feedback.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{feedback.attendee.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{feedback.event.title}</p>
                    </div>
                    <div className="space-y-2">
                      <RatingStars value={feedback.rating} size="sm" />
                      <p className="text-xs text-slate-400">{formatDate(feedback.createdAt)}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{feedback.review}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </section>
  );
}

export default OrganizerPage;
