import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getDefaultRouteForRole } from '@/utils/authRedirect';

function RoleHomeRedirect() {
  const { currentUser, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-3 text-sm font-semibold">
          Restoring your workspace...
        </div>
      </div>
    );
  }

  if (isAuthenticated && currentUser) {
    return <Navigate to={getDefaultRouteForRole(currentUser.role)} replace />;
  }

  return <Navigate to="/events" replace />;
}

export default RoleHomeRedirect;
