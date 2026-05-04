import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { userService } from '@/services/user.service';
import type { AuthUser } from '@/types/api';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

function UserDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async (): Promise<void> => {
      if (!id) {
        setError('User id is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await userService.getUserById(id);
        setUser(response.data ?? null);
      } catch (requestError) {
        setError(getApiErrorMessage(requestError));
      } finally {
        setLoading(false);
      }
    };

    void loadUser();
  }, [id]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-10 text-center shadow-panel">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-500" />
        <p className="mt-4 text-sm text-slate-600">Loading user details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-rose-700">
        <p className="font-semibold">Unable to load user</p>
        <p className="mt-2 text-sm">{error}</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-700">User Details</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{user.name}</h2>
        </div>
        <Link
          to="/admin/users"
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Back to users
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-panel">
          <p className="text-sm font-semibold text-slate-500">Profile</p>
          <dl className="mt-5 space-y-4">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Email</dt>
              <dd className="mt-1 text-sm text-slate-900">{user.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Role</dt>
              <dd className="mt-1 text-sm text-slate-900">{user.role}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Status</dt>
              <dd className="mt-1 text-sm text-slate-900">{user.isActive ? 'Active' : 'Disabled'}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-panel">
          <p className="text-sm font-semibold text-slate-500">Audit</p>
          <dl className="mt-5 space-y-4">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Created</dt>
              <dd className="mt-1 text-sm text-slate-900">{new Date(user.createdAt).toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Updated</dt>
              <dd className="mt-1 text-sm text-slate-900">{new Date(user.updatedAt).toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">User ID</dt>
              <dd className="mt-1 break-all text-sm text-slate-900">{user.id}</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}

export default UserDetailsPage;
