import { BadgeDollarSign, CalendarRange, MessageSquareQuote, Star, Ticket, TrendingDown, TrendingUp, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import RatingStars from '@/components/feedback/RatingStars';
import { usePlatformDashboardAnalytics } from '@/hooks/usePlatformDashboardAnalytics';
import ChartContainer from '@/components/organizer/dashboard/ChartContainer';
import DashboardTable from '@/components/organizer/dashboard/DashboardTable';
import StatCard from '@/components/organizer/dashboard/StatCard';
import Card from '@/components/ui/Card';

function SuperAdminAnalyticsView() {
  const { stats, revenue, userGrowth, eventAnalytics, roleDistribution, eventStatus, topOrganizers, topEvents, feedbackAnalytics, loading, error, hasAnyAnalytics } =
    usePlatformDashboardAnalytics();

  const numberFormatter = new Intl.NumberFormat('en-IN');
  const currencyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });

  const analyticsCards = [
    { label: 'Total Users', value: numberFormatter.format(stats.totalUsers), helper: 'All accounts across the platform', icon: Users },
    { label: 'Total Events', value: numberFormatter.format(stats.totalEvents), helper: 'All platform events', icon: CalendarRange },
    { label: 'Platform Revenue', value: currencyFormatter.format(stats.totalPlatformRevenue), helper: 'Confirmed and used ticket revenue', icon: BadgeDollarSign },
    { label: 'Tickets Sold', value: numberFormatter.format(stats.totalTicketsSold), helper: 'Confirmed and used ticket volume', icon: Ticket },
  ];

  const roleDistributionData = [
    { name: 'Admins', value: roleDistribution.admins, color: '#4f46e5' },
    { name: 'Organizers', value: roleDistribution.organizers, color: '#0f766e' },
    { name: 'Attendees', value: roleDistribution.attendees, color: '#d97706' },
  ];

  const eventStatusData = [
    { name: 'Published', value: eventStatus.approved, color: '#0f766e' },
    { name: 'Draft', value: eventStatus.pending, color: '#d97706' },
    { name: 'Cancelled', value: eventStatus.cancelled, color: '#475569' },
  ];

  const feedbackCards = [
    {
      label: 'Average Rating',
      value: feedbackAnalytics.totalReviews > 0 ? `${feedbackAnalytics.averageRating.toFixed(1)} / 5` : 'No ratings yet',
      helper: 'Platform-wide feedback score',
      icon: Star,
    },
    {
      label: 'Total Reviews',
      value: numberFormatter.format(feedbackAnalytics.totalReviews),
      helper: 'All attendee feedback submissions',
      icon: MessageSquareQuote,
    },
  ];

  return (
    <section className="space-y-6">
      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {analyticsCards.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} helper={stat.helper} icon={stat.icon} loading={loading} />
        ))}
      </div>

      {!loading && !hasAnyAnalytics ? (
        <Card className="p-10 text-center">
          <h3 className="text-xl font-semibold text-slate-950">No platform analytics yet</h3>
          <p className="mt-2 text-sm text-slate-600">Platform-level insights will appear here as users register, organizers publish events, and bookings start coming in.</p>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <ChartContainer
          title="Monthly Platform Revenue"
          description="Revenue trend from confirmed and used ticket bookings over the last 12 months."
          loading={loading}
          empty={revenue.months.every((item) => item.revenue === 0)}
          emptyMessage="Platform revenue will appear here once paid bookings are recorded."
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenue.months} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value: number) => `Rs ${numberFormatter.format(value)}`} />
              <Tooltip formatter={(value) => currencyFormatter.format(typeof value === 'number' ? value : Number(value ?? 0))} contentStyle={{ borderRadius: '16px', borderColor: '#cbd5e1' }} />
              <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer
          title="User Growth Analytics"
          description="Monthly user registration growth across the platform."
          loading={loading}
          empty={userGrowth.months.every((item) => item.count === 0)}
          emptyMessage="User growth analytics will appear here once accounts start getting created."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={userGrowth.months} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip formatter={(value) => numberFormatter.format(typeof value === 'number' ? value : Number(value ?? 0))} contentStyle={{ borderRadius: '16px', borderColor: '#cbd5e1' }} />
              <Bar dataKey="count" fill="#0f766e" radius={[12, 12, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer
          title="Monthly Event Creation"
          description="Platform-wide event creation volume for the last 12 months."
          loading={loading}
          empty={eventAnalytics.months.every((item) => item.count === 0)}
          emptyMessage="Monthly event creation data will appear here as events are added."
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={eventAnalytics.months} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip formatter={(value) => numberFormatter.format(typeof value === 'number' ? value : Number(value ?? 0))} contentStyle={{ borderRadius: '16px', borderColor: '#cbd5e1' }} />
              <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartContainer
          title="Role Distribution"
          description="User distribution across admins, organizers, and attendees."
          loading={loading}
          empty={roleDistributionData.every((item) => item.value === 0)}
          emptyMessage="Role distribution will appear here once users exist in the platform."
          contentHeightClassName="h-[380px] sm:h-[400px]"
        >
          <div className="flex h-full flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_200px] lg:items-center">
            <div className="h-[240px] sm:h-[260px] lg:h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 16, right: 16, bottom: 16, left: 16 }}>
                  <Pie data={roleDistributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="50%" outerRadius="78%" paddingAngle={3}>
                    {roleDistributionData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => numberFormatter.format(typeof value === 'number' ? value : Number(value ?? 0))} contentStyle={{ borderRadius: '16px', borderColor: '#cbd5e1' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {roleDistributionData.map((item) => (
                <div key={item.name} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">{item.name}</p>
                    <p className="text-sm text-slate-500">{numberFormatter.format(item.value)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ChartContainer>

        <ChartContainer
          title="Event Status Distribution"
          description="Current status breakdown for all events."
          loading={loading}
          empty={eventStatusData.every((item) => item.value === 0)}
          emptyMessage="Event status distribution will appear here once events exist."
          contentHeightClassName="h-[380px] sm:h-[400px]"
        >
          <div className="flex h-full flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_200px] lg:items-center">
            <div className="h-[240px] sm:h-[260px] lg:h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 16, right: 16, bottom: 16, left: 16 }}>
                  <Pie data={eventStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="50%" outerRadius="78%" paddingAngle={3}>
                    {eventStatusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => numberFormatter.format(typeof value === 'number' ? value : Number(value ?? 0))} contentStyle={{ borderRadius: '16px', borderColor: '#cbd5e1' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {eventStatusData.map((item) => (
                <div key={item.name} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">{item.name}</p>
                    <p className="text-sm text-slate-500">{numberFormatter.format(item.value)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ChartContainer>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <DashboardTable
          title="Top Organizers"
          description="Organizers ranked by revenue, then tickets sold and event count."
          headers={['Organizer', 'Revenue', 'Tickets Sold', 'Events']}
          loading={loading}
          empty={topOrganizers.organizers.length === 0}
          emptyMessage="Top organizers will appear here once bookings are recorded."
          rows={topOrganizers.organizers.map((organizer) => (
            <tr key={organizer.organizerId} className="align-top">
              <td className="px-5 py-4 sm:px-6">
                <p className="font-medium text-slate-950">{organizer.organizerName}</p>
                <p className="mt-1 text-sm text-slate-500">{organizer.organizerEmail}</p>
              </td>
              <td className="px-5 py-4 text-sm font-medium text-slate-900 sm:px-6">{currencyFormatter.format(organizer.revenue)}</td>
              <td className="px-5 py-4 text-sm text-slate-700 sm:px-6">{numberFormatter.format(organizer.ticketsSold)}</td>
              <td className="px-5 py-4 text-sm text-slate-700 sm:px-6">{numberFormatter.format(organizer.eventsCount)}</td>
            </tr>
          ))}
        />

        <DashboardTable
          title="Top Events"
          description="Highest-performing events based on revenue and tickets sold."
          headers={['Event', 'Organizer', 'Revenue', 'Tickets Sold']}
          loading={loading}
          empty={topEvents.events.length === 0}
          emptyMessage="Top events will appear here once ticket bookings are recorded."
          rows={topEvents.events.map((event) => (
            <tr key={event.eventId} className="align-top">
              <td className="px-5 py-4 sm:px-6">
                <p className="font-medium text-slate-950">{event.eventTitle}</p>
              </td>
              <td className="px-5 py-4 text-sm text-slate-700 sm:px-6">{event.organizerName}</td>
              <td className="px-5 py-4 text-sm font-medium text-slate-900 sm:px-6">{currencyFormatter.format(event.revenue)}</td>
              <td className="px-5 py-4 text-sm text-slate-700 sm:px-6">{numberFormatter.format(event.ticketsSold)}</td>
            </tr>
          ))}
        />
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-slate-950">Feedback Analytics</h3>
          <p className="mt-1 text-sm text-slate-600">Monitor event ratings and organizer quality signals from attendee reviews.</p>
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
                <p className="text-sm text-slate-500">Platform events with the strongest ratings.</p>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              {feedbackAnalytics.highestRatedEvents.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500">No rated events yet.</div>
              ) : (
                feedbackAnalytics.highestRatedEvents.map((event) => (
                  <div key={`super-high-${event.eventId}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{event.eventName}</p>
                        <p className="mt-1 text-sm text-slate-500">{event.organizerName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-950">{event.averageRating.toFixed(1)}</p>
                        <p className="mt-1 text-xs text-slate-500">{event.totalReviews} review{event.totalReviews > 1 ? 's' : ''}</p>
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
                <p className="text-sm text-slate-500">Use these to identify attendee experience gaps quickly.</p>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              {feedbackAnalytics.lowestRatedEvents.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500">No rated events yet.</div>
              ) : (
                feedbackAnalytics.lowestRatedEvents.map((event) => (
                  <div key={`super-low-${event.eventId}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{event.eventName}</p>
                        <p className="mt-1 text-sm text-slate-500">{event.organizerName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-950">{event.averageRating.toFixed(1)}</p>
                        <p className="mt-1 text-xs text-slate-500">{event.totalReviews} review{event.totalReviews > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <DashboardTable
          title="Organizer Ratings"
          description="Organizer-wise rating based on feedback received across their events."
          headers={['Organizer', 'Average Rating', 'Reviews', 'Rated Events']}
          loading={loading}
          empty={feedbackAnalytics.organizerRatings.length === 0}
          emptyMessage="Organizer ratings will appear here after attendee feedback starts coming in."
          rows={feedbackAnalytics.organizerRatings.map((organizer) => (
            <tr key={organizer.organizerId} className="align-top">
              <td className="px-5 py-4 sm:px-6">
                <p className="font-medium text-slate-950">{organizer.organizerName}</p>
                <p className="mt-1 text-sm text-slate-500">{organizer.organizerEmail}</p>
              </td>
              <td className="px-5 py-4 sm:px-6">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-900">{organizer.averageRating.toFixed(1)} / 5</p>
                  <RatingStars value={Math.round(organizer.averageRating)} size="sm" />
                </div>
              </td>
              <td className="px-5 py-4 text-sm text-slate-700 sm:px-6">{numberFormatter.format(organizer.totalReviews)}</td>
              <td className="px-5 py-4 text-sm text-slate-700 sm:px-6">{numberFormatter.format(organizer.ratedEvents)}</td>
            </tr>
          ))}
        />
      </div>
    </section>
  );
}

export default SuperAdminAnalyticsView;
