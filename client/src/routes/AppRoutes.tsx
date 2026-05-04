import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from '@/layouts/AdminLayout';
import MainLayout from '@/layouts/MainLayout';
import OrganizerLayout from '@/layouts/OrganizerLayout';
import UserLayout from '@/layouts/UserLayout';
import ProtectedRoute from '@/routes/ProtectedRoute';
import RoleHomeRedirect from '@/routes/RoleHomeRedirect';

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));
const UserManagementPage = lazy(() => import('@/pages/admin/UserManagementPage'));
const UserDetailsPage = lazy(() => import('@/pages/admin/UserDetailsPage'));
const OrganizerPage = lazy(() => import('@/pages/OrganizerPage'));
const OrganizerEventsPage = lazy(() => import('@/pages/organizer/OrganizerEventsPage'));
const AttendeePage = lazy(() => import('@/pages/AttendeePage'));

function AppRoutes() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-3 text-sm font-semibold">Loading workspace...</div>
        </div>
      }
    >
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<RoleHomeRedirect />} />
          <Route path="home" element={<Navigate to="/" replace />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']} />}>
          <Route element={<AdminLayout />}>
            <Route path="admin" element={<AdminDashboardPage />} />
            <Route path="admin/users" element={<UserManagementPage />} />
            <Route path="admin/users/:id" element={<UserDetailsPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN', 'SUPER_ADMIN']} />}>
          <Route element={<OrganizerLayout />}>
            <Route path="organizer" element={<OrganizerPage />} />
            <Route path="organizer/events" element={<OrganizerEventsPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['ATTENDEE', 'ORGANIZER', 'ADMIN', 'SUPER_ADMIN']} />}>
          <Route element={<UserLayout />}>
            <Route path="attendee" element={<AttendeePage />} />
          </Route>
        </Route>

        <Route element={<MainLayout />}>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
