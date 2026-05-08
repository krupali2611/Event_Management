import { ArrowLeft, BellRing, CheckCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { notificationService } from '@/services/notification.service';
import type { NotificationItem, NotificationListData } from '@/types/notification.types';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

function getBackLink(role: string | undefined): string {
  switch (role) {
    case 'ADMIN':
    case 'SUPER_ADMIN':
      return '/admin';
    case 'ORGANIZER':
      return '/organizer';
    default:
      return '/events';
  }
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function NotificationsPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { unreadCount, markAsRead, markAllAsRead, refresh } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'read' | 'unread'>('all');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<NotificationListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        const response = await notificationService.getNotifications({ page, limit: 12, filter });
        setData(response.data ?? null);
      } catch (requestError) {
        setError(getApiErrorMessage(requestError));
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [filter, page]);

  const openNotification = async (notification: NotificationItem) => {
    try {
      if (!notification.isRead) {
        await markAsRead(notification.id);
      }

      if (notification.link) {
        navigate(notification.link);
      }
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    }
  };

  const handleMarkAll = async () => {
    try {
      setSubmitting(true);
      await markAllAsRead();
      await refresh();
      const response = await notificationService.getNotifications({ page, limit: 12, filter });
      setData(response.data ?? null);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.14),transparent_26%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link to={getBackLink(currentUser?.role)} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" />
              Back to workspace
            </Link>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.28em] text-blue-700">Notification Center</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Stay on top of event and ticket updates.</h1>
            <p className="mt-2 text-sm text-slate-600">{unreadCount} unread notifications across your account.</p>
          </div>
          <Button variant="secondary" onClick={() => void handleMarkAll()} disabled={submitting || unreadCount === 0} icon={<CheckCheck className="h-4 w-4" />}>
            {submitting ? 'Updating...' : 'Mark all as read'}
          </Button>
        </div>

        <Card className="overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div className="flex flex-wrap gap-2">
              {(['all', 'unread', 'read'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setFilter(option);
                    setPage(1);
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${filter === option ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  {option === 'all' ? 'All' : option === 'unread' ? 'Unread' : 'Read'}
                </button>
              ))}
            </div>
            <Button variant="ghost" onClick={() => void refresh()}>
              Refresh preview
            </Button>
          </div>

          {error ? <div className="border-b border-rose-200 bg-rose-50 px-5 py-3 text-sm text-rose-700">{error}</div> : null}

          {loading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-24 animate-pulse rounded-3xl bg-slate-100" />
              ))}
            </div>
          ) : null}

          {!loading && (data?.notifications.length ?? 0) === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-blue-50 text-blue-600">
                <BellRing className="h-7 w-7" />
              </div>
              <h2 className="mt-5 text-xl font-semibold text-slate-950">No notifications in this view</h2>
              <p className="mt-2 text-sm text-slate-600">When new event, reminder, or ticket activity happens, it will appear here.</p>
            </div>
          ) : null}

          {!loading ? (
            <div className="divide-y divide-slate-100">
              {data?.notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => void openNotification(notification)}
                  className={`flex w-full flex-col gap-3 px-5 py-4 text-left transition hover:bg-slate-50 sm:flex-row sm:items-start sm:justify-between ${notification.isRead ? 'bg-white' : 'bg-blue-50/60'}`}
                >
                  <div className="max-w-3xl">
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-semibold text-slate-950">{notification.title}</p>
                      {!notification.isRead ? <span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> : null}
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{notification.message}</p>
                  </div>
                  <div className="shrink-0 text-xs font-medium text-slate-500">{formatDateTime(notification.createdAt)}</div>
                </button>
              ))}
            </div>
          ) : null}

          {!loading && data ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4">
              <p className="text-sm text-slate-500">
                Page {data.pagination.page} of {data.pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}>
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setPage((current) => current + 1)}
                  disabled={page >= data.pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}

export default NotificationsPage;
