import { Building2, CalendarRange, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import { getEvents, getVenues } from '@/services/api';
import { userService } from '@/services/user.service';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

const defaultCounts = {
  users: 0,
  venues: 0,
  publishedEvents: 0,
};

function AdminDashboardPage() {
  const [counts, setCounts] = useState(defaultCounts);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        setError(null);

        const [usersResponse, venuesResponse, eventsResponse] = await Promise.all([
          userService.getUsers({ page: 1, limit: 1, search: '', role: '' }),
          getVenues({ page: 1, limit: 1, search: '', location: '', minCapacity: '', status: '', includeInactive: true }),
          getEvents({ page: 1, limit: 1, search: '', date: '', status: 'PUBLISHED', includeUnpublished: true }),
        ]);

        setCounts({
          users: usersResponse.data?.pagination.total ?? 0,
          venues: venuesResponse.data?.pagination.total ?? 0,
          publishedEvents: eventsResponse.data?.pagination.total ?? 0,
        });
      } catch (requestError) {
        setError(getApiErrorMessage(requestError));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stats = [
    { label: 'Users', value: counts.users, icon: Users },
    { label: 'Venues', value: counts.venues, icon: Building2 },
    { label: 'Published Events', value: counts.publishedEvents, icon: CalendarRange },
  ];

  return (
    <section className="space-y-6">
      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <div className="grid gap-4 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card key={stat.label} className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-950">{loading ? '--' : stat.value}</p>
                </div>
                <div className="rounded-2xl bg-brand-50 p-3 text-brand-700">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Users</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">Manage roles and status from live records</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Venues</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">Create and update venues from PostgreSQL</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Publishing</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">Monitor attendee-visible published events</p>
          </div>
        </div>
      </Card>
    </section>
  );
}

export default AdminDashboardPage;
