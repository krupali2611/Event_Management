import {
  ArrowLeft,
  BellRing,
  CalendarCheck2,
  CalendarPlus2,
  Check,
  CheckCheck,
  CircleAlert,
  ExternalLink,
  RefreshCcw,
  Ticket,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { notificationService } from '@/services/notification.service';
import type { NotificationItem, NotificationListData, NotificationType } from '@/types/notification.types';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

const PAGE_REFRESH_INTERVAL_MS = 30_000;

type ReadFilter = 'all' | 'read' | 'unread';
type CategoryFilter = 'all' | 'events' | 'bookings' | 'tickets' | 'system';

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

function formatRelativeTime(value: string): string {
  const now = new Date().getTime();
  const then = new Date(value).getTime();
  const diffMinutes = Math.max(1, Math.round((now - then) / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hr ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

function getDayBucket(value: string): 'Today' | 'Yesterday' | 'Earlier' {
  const target = new Date(value);
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(todayStart.getDate() - 1);
  const targetStart = new Date(target.getFullYear(), target.getMonth(), target.getDate());

  if (targetStart.getTime() === todayStart.getTime()) {
    return 'Today';
  }

  if (targetStart.getTime() === yesterdayStart.getTime()) {
    return 'Yesterday';
  }

  return 'Earlier';
}

function getNotificationMeta(type: NotificationType): {
  category: Exclude<CategoryFilter, 'all'>;
  badge: string;
  icon: typeof CalendarPlus2;
  iconWrapClass: string;
  badgeClass: string;
} {
  switch (type) {
    case 'NEW_EVENT_CREATED':
      return {
        category: 'events',
        badge: 'Events',
        icon: CalendarPlus2,
        iconWrapClass: 'bg-blue-50 text-blue-600 ring-1 ring-blue-100',
        badgeClass: 'bg-blue-50 text-blue-700',
      };
    case 'EVENT_UPDATED':
    case 'EVENT_REMINDER_24H':
    case 'EVENT_REMINDER_1H':
      return {
        category: 'events',
        badge: 'Events',
        icon: CalendarCheck2,
        iconWrapClass: 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100',
        badgeClass: 'bg-indigo-50 text-indigo-700',
      };
    case 'EVENT_CANCELLED':
    case 'EVENT_SEATS_FULL':
      return {
        category: 'events',
        badge: 'Events',
        icon: CircleAlert,
        iconWrapClass: 'bg-rose-50 text-rose-600 ring-1 ring-rose-100',
        badgeClass: 'bg-rose-50 text-rose-700',
      };
    case 'TICKET_GENERATED':
    case 'TICKET_STATUS_CHANGED':
      return {
        category: 'tickets',
        badge: 'Tickets',
        icon: Ticket,
        iconWrapClass: 'bg-amber-50 text-amber-600 ring-1 ring-amber-100',
        badgeClass: 'bg-amber-50 text-amber-700',
      };
    case 'USER_REGISTERED':
      return {
        category: 'system',
        badge: 'System',
        icon: BellRing,
        iconWrapClass: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100',
        badgeClass: 'bg-emerald-50 text-emerald-700',
      };
    default:
      return {
        category: 'bookings',
        badge: 'Bookings',
        icon: CheckCheck,
        iconWrapClass: 'bg-teal-50 text-teal-600 ring-1 ring-teal-100',
        badgeClass: 'bg-teal-50 text-teal-700',
      };
  }
}

function NotificationsPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { unreadCount, markAsRead, markAllAsRead, refresh } = useNotifications();
  const [filter, setFilter] = useState<ReadFilter>('all');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<NotificationListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = async (showLoader = false): Promise<void> => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      setError(null);
      const response = await notificationService.getNotifications({ page, limit: 12, filter });
      setData(response.data ?? null);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadNotifications(true);

    const intervalId = window.setInterval(() => {
      void Promise.all([loadNotifications(), refresh()]);
    }, PAGE_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [filter, page, refresh]);

  const openNotification = async (notification: NotificationItem) => {
    try {
      if (!notification.isRead) {
        await markAsRead(notification.id);
        setData((current) =>
          current
            ? {
                ...current,
                notifications: current.notifications.map((item) =>
                  item.id === notification.id
                    ? {
                        ...item,
                        isRead: true,
                        readAt: new Date().toISOString(),
                      }
                    : item,
                ),
              }
            : current,
        );
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
      await Promise.all([refresh(), loadNotifications()]);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredNotifications = useMemo(() => {
    const notifications = data?.notifications ?? [];

    if (category === 'all') {
      return notifications;
    }

    return notifications.filter((notification) => getNotificationMeta(notification.type).category === category);
  }, [category, data?.notifications]);

  const groupedNotifications = useMemo(() => {
    const buckets: Array<'Today' | 'Yesterday' | 'Earlier'> = ['Today', 'Yesterday', 'Earlier'];

    return buckets
      .map((label) => ({
        label,
        items: filteredNotifications.filter((notification) => getDayBucket(notification.createdAt) === label),
      }))
      .filter((group) => group.items.length > 0);
  }, [filteredNotifications]);

  const topMessage =
    unreadCount === 0
      ? "You're all caught up today!"
      : `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'} waiting for you.`;

  const topSubMessage =
    unreadCount === 0
      ? 'No urgent updates pending. Check back later for more activity.'
      : 'Review important event, booking, ticket, and system updates from one place.';

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_24%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.12),transparent_18%),linear-gradient(180deg,#f6f9ff_0%,#edf3ff_46%,#f9fbff_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link to={getBackLink(currentUser?.role)} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" />
              Back to workspace
            </Link>
          </div>

          <Button variant="secondary" onClick={() => void handleMarkAll()} disabled={submitting || unreadCount === 0} icon={<CheckCheck className="h-4 w-4" />}>
            {submitting ? 'Updating...' : 'Mark all as read'}
          </Button>
        </div>

        <div className="overflow-hidden rounded-[1.75rem] bg-[linear-gradient(135deg,#1f4fe0_0%,#2f64ff_42%,#4d86ff_100%)] px-6 py-6 text-white shadow-[0_30px_90px_-35px_rgba(31,79,224,0.78)] sm:px-8">
          <div className="flex flex-col gap-5">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/18 ring-1 ring-white/35 backdrop-blur">
                <BellRing className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">{topMessage}</h2>
                <p className="mt-1 text-sm text-blue-50/95">{topSubMessage}</p>
              </div>
            </div>
          </div>
        </div>

        <Card className="overflow-hidden border-white/70 bg-white/80 p-0 shadow-[0_24px_70px_-35px_rgba(15,23,42,0.28)] backdrop-blur">
          <div className="flex flex-col gap-4 px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                {([
                  ['all', 'All'],
                  ['unread', 'Unread'],
                  ['read', 'Read'],
                ] as const).map(([option, label]) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setFilter(option);
                      setPage(1);
                    }}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      filter === option ? 'bg-brand-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm font-medium text-slate-500">Filter by</p>
                <div className="rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value as CategoryFilter)}
                    className="border-0 bg-transparent pr-7 text-sm font-semibold text-slate-700 outline-none"
                  >
                    <option value="all">All Types</option>
                    <option value="events">Events</option>
                    <option value="bookings">Bookings</option>
                    <option value="tickets">Tickets</option>
                    <option value="system">System</option>
                  </select>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => {
                    void Promise.all([refresh(), loadNotifications()]);
                  }}
                  icon={<RefreshCcw className="h-4 w-4" />}
                  className="rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                >
                  Refresh
                </Button>
              </div>
            </div>

            {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
          </div>

          {loading ? (
            <div className="space-y-4 px-4 pb-5 sm:px-5">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-28 animate-pulse rounded-[1.5rem] bg-slate-100" />
              ))}
            </div>
          ) : null}

          {!loading && filteredNotifications.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-blue-50 text-blue-600">
                <BellRing className="h-7 w-7" />
              </div>
              <h2 className="mt-5 text-xl font-semibold text-slate-950">No notifications in this view</h2>
              <p className="mt-2 text-sm text-slate-600">When new event, reminder, or ticket activity happens, it will appear here.</p>
            </div>
          ) : null}

          {!loading ? (
            <div className="space-y-6 px-4 pb-5 sm:px-5">
              {groupedNotifications.map((group) => (
                <section key={group.label} className="space-y-3">
                  <h2 className="px-2 text-sm font-bold text-slate-700">{group.label}</h2>

                  <div className="overflow-hidden rounded-[1.7rem] border border-slate-100 bg-white shadow-[0_22px_60px_-42px_rgba(15,23,42,0.32)]">
                    {group.items.map((notification, index) => {
                      const meta = getNotificationMeta(notification.type);
                      const Icon = meta.icon;

                      return (
                        <div
                          key={notification.id}
                          className={`flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5 ${
                            index !== group.items.length - 1 ? 'border-b border-slate-100' : ''
                          } ${notification.isRead ? 'bg-white' : 'bg-[linear-gradient(90deg,rgba(239,246,255,0.76),rgba(255,255,255,0.98))]'}`}
                        >
                          <button type="button" onClick={() => void openNotification(notification)} className="flex min-w-0 flex-1 items-start gap-4 text-left">
                            <div className={`mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${meta.iconWrapClass}`}>
                              <Icon className="h-5 w-5" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-3">
                                <p className="text-base font-bold text-slate-900">{notification.title}</p>
                                {!notification.isRead ? <span className="h-2.5 w-2.5 rounded-full bg-brand-500" /> : null}
                              </div>

                              <p className="mt-1 text-sm leading-6 text-slate-600">{notification.message}</p>

                              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
                                <span className={`rounded-full px-2.5 py-1 ${meta.badgeClass}`}>{meta.badge}</span>
                                <span className="text-slate-400">•</span>
                                <span className="text-slate-500">{notification.type.replaceAll('_', ' ')}</span>
                              </div>
                            </div>
                          </button>

                          <div className="flex shrink-0 items-center justify-between gap-4 sm:justify-end">
                            <div className="text-right">
                              <p className="text-xs font-semibold text-slate-700">{formatDateTime(notification.createdAt)}</p>
                              <p className="mt-1 text-xs text-slate-500">{formatRelativeTime(notification.createdAt)}</p>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => void openNotification(notification)}
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-brand-200 hover:text-brand-600"
                                aria-label={notification.isRead ? 'Open notification' : 'Mark as read and open notification'}
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              {notification.link ? (
                                <button
                                  type="button"
                                  onClick={() => void openNotification(notification)}
                                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-brand-200 hover:text-brand-600"
                                  aria-label="Open linked page"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
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
                <Button variant="secondary" onClick={() => setPage((current) => current + 1)} disabled={page >= data.pagination.totalPages}>
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
