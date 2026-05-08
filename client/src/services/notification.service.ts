import { httpClient } from '@/api/httpClient';
import type {
  NotificationListResponse,
  NotificationMarkAllResponse,
  NotificationQuery,
  NotificationUnreadCountResponse,
} from '@/types/notification.types';

export const notificationService = {
  async getNotifications(query: NotificationQuery): Promise<NotificationListResponse> {
    const response = await httpClient.get<NotificationListResponse>('/notifications', {
      params: {
        page: query.page,
        limit: query.limit,
        ...(query.filter ? { filter: query.filter } : {}),
      },
    });

    return response.data;
  },

  async getUnreadCount(): Promise<NotificationUnreadCountResponse> {
    const response = await httpClient.get<NotificationUnreadCountResponse>('/notifications/unread-count');
    return response.data;
  },

  async markAsRead(id: string): Promise<void> {
    await httpClient.patch(`/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<NotificationMarkAllResponse> {
    const response = await httpClient.patch<NotificationMarkAllResponse>('/notifications/read-all');
    return response.data;
  },
};
