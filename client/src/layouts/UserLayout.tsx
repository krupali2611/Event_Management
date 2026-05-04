import { Outlet } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';

function UserLayout() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.12),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#fff7ed_100%)] text-slate-900">
      <Navbar title="Discover Events" subtitle="Attendee Experience" theme="visual" />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}

export default UserLayout;
