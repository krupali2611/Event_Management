import { NavLink, Outlet } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';

function UserLayout() {
  const { currentUser } = useAuth();
  const attendeeNav = [
    { to: '/events', label: 'Browse Events' },
    { to: '/my-tickets', label: 'My Tickets' },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.12),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#fff7ed_100%)] text-slate-900">
      <Navbar title="Discover Events" subtitle="Attendee Experience" theme="visual" />
      {currentUser?.role === 'ATTENDEE' ? (
        <div className="border-b border-white/60 bg-white/60 backdrop-blur">
          <div className="mx-auto flex max-w-7xl gap-2 px-4 py-3 sm:px-6 lg:px-8">
            {attendeeNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isActive ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-600 hover:bg-white hover:text-slate-950'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      ) : null}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}

export default UserLayout;
