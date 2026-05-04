import { Building2, Shield, Users } from 'lucide-react';
import Card from '@/components/ui/Card';

const stats = [
  { label: 'Users', icon: Users },
  { label: 'Venues', icon: Building2 },
  { label: 'Roles', icon: Shield },
];

function AdminDashboardPage() {
  return (
    <section className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card key={stat.label} className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{stat.label}</p>
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
            <p className="mt-2 text-lg font-semibold text-slate-900">Manage roles and status</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Venues</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">Create and update venues</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Access</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">Protected admin routes</p>
          </div>
        </div>
      </Card>
    </section>
  );
}

export default AdminDashboardPage;
