import { BarChart3, Building2, CalendarDays, CalendarRange, Users } from 'lucide-react';
import { useState } from 'react';
import { matchPath, Outlet, useLocation } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import { useAuth } from '@/hooks/useAuth';

const items = [
  { to: '/admin', label: 'Dashboard', icon: BarChart3 },
  { to: '/admin/events', label: 'Events', icon: CalendarDays },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/venues', label: 'Venues', icon: Building2 },
  { to: '/admin/venue-bookings', label: 'Venue Booking', icon: CalendarRange },
];

const headerTitleMap = [
  { pattern: '/admin/events/new', title: 'Create Event' },
  { pattern: '/admin/events/:id/edit', title: 'Edit Event' },
  { pattern: '/admin/events/:id', title: 'Event Details' },
  { pattern: '/admin/events', title: 'Events' },
  { pattern: '/admin/users/:id', title: 'User Details' },
  { pattern: '/admin/users', title: 'User Management' },
  { pattern: '/admin/venues/new', title: 'Add Venue' },
  { pattern: '/admin/venues/:id/edit', title: 'Edit Venue' },
  { pattern: '/admin/venues/:id', title: 'Venue Details' },
  { pattern: '/admin/venues', title: 'Venues' },
  { pattern: '/admin/venue-bookings', title: 'Venue Bookings' },
];

function AdminLayout() {
  const { currentUser } = useAuth();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const defaultDashboardTitle = currentUser?.role === 'SUPER_ADMIN' ? 'Super Admin Dashboard' : 'Admin Dashboard';
  const currentTitle =
    location.pathname === '/admin'
      ? defaultDashboardTitle
      : headerTitleMap.find(({ pattern }) => matchPath({ path: pattern, end: true }, location.pathname))?.title ?? defaultDashboardTitle;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <Sidebar items={items} role={currentUser?.role ?? 'ADMIN'} theme="light" onCollapseChange={setSidebarCollapsed} />
        <div className={`flex min-w-0 flex-1 flex-col transition-[padding] duration-300 ${sidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'}`}>
          <Navbar title={currentTitle} subtitle="Operations" theme="light" />
          <main className="flex-1 bg-[radial-gradient(circle_at_top_right,rgba(79,70,229,0.08),transparent_30%),linear-gradient(180deg,#f9fafb_0%,#eef2ff_100%)] px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;
