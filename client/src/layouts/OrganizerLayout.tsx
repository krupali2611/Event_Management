import { CalendarDays, LayoutGrid, MapPinned } from 'lucide-react';
import { useState } from 'react';
import { matchPath, Outlet, useLocation } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import { useAuth } from '@/hooks/useAuth';

const items = [
  { to: '/organizer', label: 'Overview', icon: LayoutGrid },
  { to: '/organizer/events', label: 'Events', icon: CalendarDays },
  { to: '/organizer/venue-bookings', label: 'Venue Bookings', icon: MapPinned },
];

const headerTitleMap = [
  { pattern: '/organizer/events/new', title: 'Create Event' },
  { pattern: '/organizer/events/:id/attendees', title: 'Event Attendees' },
  { pattern: '/organizer/events/:id/edit', title: 'Edit Event' },
  { pattern: '/organizer/events/:id', title: 'Event Details' },
  { pattern: '/organizer/events', title: 'Events' },
  { pattern: '/organizer/venue-bookings', title: 'Venue Bookings' },
  { pattern: '/organizer', title: 'Organizer Dashboard' },
];

function OrganizerLayout() {
  const { currentUser } = useAuth();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const currentTitle = headerTitleMap.find(({ pattern }) => matchPath({ path: pattern, end: true }, location.pathname))?.title ?? 'Organizer Dashboard';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <Sidebar items={items} role={currentUser?.role ?? 'ORGANIZER'} theme="light" onCollapseChange={setSidebarCollapsed} />
        <div className={`flex min-w-0 flex-1 flex-col transition-[padding] duration-300 ${sidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'}`}>
          <Navbar title={currentTitle} subtitle="Event Workspace" theme="light" />
          <main className="flex-1 bg-[radial-gradient(circle_at_top_right,rgba(79,70,229,0.08),transparent_30%),linear-gradient(180deg,#f9fafb_0%,#eef2ff_100%)] px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export default OrganizerLayout;
