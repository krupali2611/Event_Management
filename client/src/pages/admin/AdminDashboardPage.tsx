import { Activity, Shield, Users } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

const stats = [
  { label: 'Active operators', value: '128', icon: Users },
  { label: 'Open escalations', value: '06', icon: Shield },
  { label: 'Live sessions', value: '1.2k', icon: Activity },
];

function AdminDashboardPage() {
  return (
    <section className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card key={stat.label} tone="dark" className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">{stat.label}</p>
                  <p className="mt-3 text-3xl font-bold text-white">{stat.value}</p>
                </div>
                <div className="rounded-2xl bg-blue-500/15 p-3 text-blue-300">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card tone="dark" className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-300">Security Posture</p>
            <h2 className="mt-3 text-2xl font-bold text-white">Role-aware governance stays active across the platform.</h2>
          </div>
          <Badge color="green">Stable</Badge>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-sm text-slate-400">Privileges segmented</p>
            <p className="mt-2 text-lg font-semibold text-slate-100">SUPER_ADMIN controls status changes</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-sm text-slate-400">Audit-friendly actions</p>
            <p className="mt-2 text-lg font-semibold text-slate-100">Compact, data-first management flow</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-sm text-slate-400">Performance</p>
            <p className="mt-2 text-lg font-semibold text-slate-100">Paginated queries with filtered retrieval</p>
          </div>
        </div>
      </Card>
    </section>
  );
}

export default AdminDashboardPage;
