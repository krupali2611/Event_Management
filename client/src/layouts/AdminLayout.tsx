import { BarChart3, Users } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import { useAuth } from '@/hooks/useAuth';

const items = [
  { to: '/admin', label: 'Dashboard', icon: BarChart3 },
  { to: '/admin/users', label: 'Users', icon: Users },
];

function AdminLayout() {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen bg-[#0B1220] text-[#E5E7EB]">
      <div className="flex min-h-screen">
        <Sidebar
          items={items}
          title="Admin Console"
          subtitle="Minimal data-first workspace"
          role={currentUser?.role ?? 'ADMIN'}
          theme="dark"
        />
        <div className="flex min-w-0 flex-1 flex-col lg:pl-72">
          <Navbar title="Admin Dashboard" subtitle="Operations" theme="dark" />
          <main className="flex-1 bg-[#0B1220] px-4 py-5 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;
