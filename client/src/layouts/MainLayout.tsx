import { Outlet } from 'react-router-dom';
import Navbar from '@/components/Navbar';

function MainLayout() {
  return (
    <div className="min-h-screen text-slate-900">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
