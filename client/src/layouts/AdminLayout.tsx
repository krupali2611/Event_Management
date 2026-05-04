import { BarChart3, Building2, CalendarRange, Users } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import { useAuth } from '@/hooks/useAuth';

const items = [
  { to: '/admin', label: 'Dashboard', icon: BarChart3 },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/venues', label: 'Venues', icon: Building2 },
  { to: '/admin/venue-bookings', label: 'Bookings', icon: CalendarRange },
];

function AdminLayout() {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <Sidebar
          items={items}
          title="Admin Console"
          subtitle="Management"
          role={currentUser?.role ?? 'ADMIN'}
          theme="light"
        />
        <div className="flex min-w-0 flex-1 flex-col lg:pl-72">
          <Navbar title="Admin Dashboard" subtitle="Operations" theme="light" />
          <main className="flex-1 bg-[radial-gradient(circle_at_top_right,rgba(79,70,229,0.08),transparent_30%),linear-gradient(180deg,#f9fafb_0%,#eef2ff_100%)] px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;
