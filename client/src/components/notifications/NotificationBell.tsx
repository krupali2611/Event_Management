import { Bell, CheckCheck, LoaderCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationBellProps {
  theme: 'dark' | 'light' | 'visual';
}

function formatRelativeTime(value: string): string {
  const date = new Date(value);
  const minutes = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  return `${Math.round(hours / 24)}d ago`;
}

function NotificationBell({ theme }: NotificationBellProps) {
  const isDark = theme === 'dark';
  const isVisual = theme === 'visual';
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, refreshing, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenNotification = async (id: string, link: string | null) => {
    await markAsRead(id);
    setOpen(false);

    if (link) {
      navigate(link);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`relative inline-flex h-11 w-11 items-center justify-center rounded-2xl transition ${
          isDark
            ? 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            : isVisual
              ? 'border border-white/80 bg-white/80 text-slate-600 shadow-[0_20px_40px_-32px_rgba(15,23,42,0.45)] hover:bg-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute right-1 top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className={`absolute right-0 top-12 z-50 w-[22rem] overflow-hidden rounded-[1.75rem] border shadow-2xl ${
            isDark
              ? 'border-slate-800 bg-slate-950 text-slate-100 shadow-slate-950/40'
              : isVisual
                ? 'border-white/70 bg-white/95 text-slate-900 shadow-slate-300/45'
                : 'border-slate-200 bg-white text-slate-900 shadow-slate-200/80'
          }`}
        >
          <div className={`flex items-center justify-between px-4 py-4 ${isDark ? 'border-b border-slate-800' : 'border-b border-slate-100'}`}>
            <div>
              <p className="text-sm font-semibold">Notifications</p>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{unreadCount} unread</p>
            </div>
            <button
              type="button"
              onClick={() => void markAllAsRead()}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition ${isDark ? 'bg-slate-900 text-slate-200 hover:bg-slate-800' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Read all
            </button>
          </div>

          <div className="max-h-[26rem] overflow-y-auto p-2">
            {loading ? <div className="px-4 py-8 text-center text-sm text-slate-500">Loading notifications...</div> : null}

            {!loading && notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm font-semibold">No notifications yet</p>
                <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>We’ll show updates here as events and tickets change.</p>
              </div>
            ) : null}

            {!loading &&
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => void handleOpenNotification(notification.id, notification.link)}
                  className={`mb-2 w-full rounded-2xl border px-4 py-3 text-left transition ${
                    notification.isRead
                      ? isDark
                        ? 'border-slate-900 bg-slate-900/60 hover:bg-slate-900'
                        : 'border-slate-100 bg-slate-50/70 hover:bg-slate-100'
                      : isVisual
                        ? 'border-orange-200 bg-orange-50/80 hover:bg-orange-100/80'
                        : 'border-blue-200 bg-blue-50/80 hover:bg-blue-100/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{notification.title}</p>
                      <p className={`mt-1 text-xs leading-5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{notification.message}</p>
                    </div>
                    {!notification.isRead ? <span className={`mt-1 h-2.5 w-2.5 rounded-full ${isVisual ? 'bg-orange-500' : 'bg-blue-500'}`} /> : null}
                  </div>
                  <p className={`mt-2 text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{formatRelativeTime(notification.createdAt)}</p>
                </button>
              ))}
          </div>

          <div className={`flex items-center justify-end px-4 py-3 ${isDark ? 'border-t border-slate-800' : 'border-t border-slate-100'}`}>
            {refreshing ? <LoaderCircle className="h-4 w-4 animate-spin text-slate-400" /> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default NotificationBell;
