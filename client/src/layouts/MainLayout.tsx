import { Outlet } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';

function MainLayout() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.12),transparent_30%),linear-gradient(180deg,#f8fafc_0%,#e2e8f0_100%)] text-slate-900">
      <Navbar title="Event Management" subtitle="Modern SaaS Platform" theme="light" />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
