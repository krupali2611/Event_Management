import { createContext, useEffect, useState, type PropsWithChildren } from 'react';
import { notificationService } from '@/services/notification.service';
import type { NotificationItem } from '@/types/notification.types';
import { useAuth } from '@/hooks/useAuth';

interface NotificationContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  refreshing: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

const POLLING_INTERVAL_MS = 30_000;

function markNotificationRead(notification: NotificationItem): NotificationItem {
  if (notification.isRead) {
    return notification;
  }

  return {
    ...notification,
    isRead: true,
    readAt: new Date().toISOString(),
  };
}

export function NotificationProvider({ children }: PropsWithChildren) {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPreview = async (isInitialLoad = false): Promise<void> => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    if (isInitialLoad) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const [notificationResponse, unreadCountResponse] = await Promise.all([
        notificationService.getNotifications({ page: 1, limit: 6, filter: 'all' }),
        notificationService.getUnreadCount(),
      ]);

      setNotifications(notificationResponse.data?.notifications ?? []);
      setUnreadCount(unreadCountResponse.data?.count ?? 0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadPreview(true);

    if (!isAuthenticated) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      void loadPreview();
    }, POLLING_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [isAuthenticated]);

  const markAsRead = async (id: string): Promise<void> => {
    await notificationService.markAsRead(id);
    setNotifications((current) =>
      current.map((notification) => (notification.id === id ? markNotificationRead(notification) : notification)),
    );
    setUnreadCount((current) => Math.max(current - 1, 0));
  };

  const markAllAsRead = async (): Promise<void> => {
    await notificationService.markAllAsRead();
    setNotifications((current) => current.map(markNotificationRead));
    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        refreshing,
        markAsRead,
        markAllAsRead,
        refresh: () => loadPreview(),
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
