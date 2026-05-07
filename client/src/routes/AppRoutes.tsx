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
const VenueManagementPage = lazy(() => import('@/pages/admin/VenueManagementPage'));
const AddVenuePage = lazy(() => import('@/pages/admin/AddVenuePage'));
const VenueDetailsPage = lazy(() => import('@/pages/admin/VenueDetailsPage'));
const EditVenuePage = lazy(() => import('@/pages/admin/EditVenuePage'));
const UserManagementPage = lazy(() => import('@/pages/admin/UserManagementPage'));
const UserDetailsPage = lazy(() => import('@/pages/admin/UserDetailsPage'));
const VenueBookingsAdminPage = lazy(() => import('@/pages/admin/VenueBookingsAdminPage'));
const AdminEventsPage = lazy(() => import('@/pages/organizer/OrganizerEventsPage'));
const AdminCreateEventPage = lazy(() => import('@/pages/organizer/CreateEventPage'));
const AdminEditEventPage = lazy(() => import('@/pages/organizer/EditEventPage'));
const AdminEventDetailPage = lazy(() => import('@/pages/organizer/EventDetailPage'));
const OrganizerPage = lazy(() => import('@/pages/OrganizerPage'));
const OrganizerEventsPage = lazy(() => import('@/pages/organizer/OrganizerEventsPage'));
const VenueBookingPage = lazy(() => import('@/pages/organizer/VenueBookingPage'));
const CreateEventPage = lazy(() => import('@/pages/organizer/CreateEventPage'));
const EditEventPage = lazy(() => import('@/pages/organizer/EditEventPage'));
const EventDetailPage = lazy(() => import('@/pages/organizer/EventDetailPage'));
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
            <Route path="admin/events" element={<AdminEventsPage />} />
            <Route path="admin/events/new" element={<AdminCreateEventPage />} />
            <Route path="admin/events/:id" element={<AdminEventDetailPage />} />
            <Route path="admin/events/:id/edit" element={<AdminEditEventPage />} />
            <Route path="admin/users" element={<UserManagementPage />} />
            <Route path="admin/users/:id" element={<UserDetailsPage />} />
            <Route path="admin/venues" element={<VenueManagementPage />} />
            <Route path="admin/venues/new" element={<AddVenuePage />} />
            <Route path="admin/venues/:id" element={<VenueDetailsPage />} />
            <Route path="admin/venues/:id/edit" element={<EditVenuePage />} />
            <Route path="admin/venue-bookings" element={<VenueBookingsAdminPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN', 'SUPER_ADMIN']} />}>
          <Route element={<OrganizerLayout />}>
            <Route path="organizer" element={<OrganizerPage />} />
            <Route path="organizer/events" element={<OrganizerEventsPage />} />
            <Route path="organizer/events/new" element={<CreateEventPage />} />
            <Route path="organizer/events/:id" element={<EventDetailPage />} />
            <Route path="organizer/events/:id/edit" element={<EditEventPage />} />
            <Route path="organizer/venue-bookings" element={<VenueBookingPage />} />
          </Route>
        </Route>

        <Route element={<UserLayout />}>
          <Route path="events" element={<AttendeePage />} />
          <Route path="events/:id" element={<EventDetailPage />} />
          <Route path="attendee" element={<AttendeePage />} />
          <Route path="attendee/events/:id" element={<EventDetailPage />} />
        </Route>

        <Route element={<MainLayout />}>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
