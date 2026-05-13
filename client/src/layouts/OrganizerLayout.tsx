import { CalendarDays, LayoutGrid, MapPinned, MessageSquareQuote } from 'lucide-react';
import { useState } from 'react';
import { matchPath, Outlet, useLocation } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import { useAuth } from '@/hooks/useAuth';

const items = [
  { to: '/organizer', label: 'Overview', icon: LayoutGrid },
  { to: '/organizer/events', label: 'Events', icon: CalendarDays },
  { to: '/organizer/venue-bookings', label: 'Venue Bookings', icon: MapPinned },
  { to: '/organizer/feedback-reviews', label: 'Feedback Reviews', icon: MessageSquareQuote },
];

const headerTitleMap = [
  { pattern: '/organizer/events/new', title: 'Create Event' },
  { pattern: '/organizer/events/:id/attendees', title: 'Event Attendees' },
  { pattern: '/organizer/events/:id/edit', title: 'Edit Event' },
  { pattern: '/organizer/events/:id', title: 'Event Details' },
  { pattern: '/organizer/events', title: 'Events' },
  { pattern: '/organizer/venue-bookings', title: 'Venue Bookings' },
  { pattern: '/organizer/feedback-reviews', title: 'Feedback Reviews' },
  { pattern: '/organizer', title: 'Organizer Dashboard' },
];

function OrganizerLayout() {
  const { currentUser } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const currentTitle = headerTitleMap.find(({ pattern }) => matchPath({ path: pattern, end: true }, location.pathname))?.title ?? 'Organizer Dashboard';

  return (
    <div className="min-h-screen bg-transparent text-slate-900">
      <div className="flex min-h-screen">
        <Sidebar
          items={items}
          role={currentUser?.role ?? 'ORGANIZER'}
          theme="dark"
          isOpen={sidebarOpen}
          isDesktopCollapsed={sidebarCollapsed}
          onOpenChange={setSidebarOpen}
          onDesktopCollapseChange={setSidebarCollapsed}
          onCollapseChange={setSidebarCollapsed}
        />
        <div className={`flex min-w-0 flex-1 flex-col transition-[padding] duration-300 ${sidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'}`}>
          <Navbar
            title={currentTitle}
            subtitle="Operations"
            theme="light"
            sidebarOpen={sidebarOpen}
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={() => {
              if (window.matchMedia('(min-width: 1024px)').matches) {
                setSidebarCollapsed((current) => !current);
                setSidebarOpen(true);
                return;
              }

              setSidebarOpen((current) => !current);
            }}
          />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export default OrganizerLayout;
