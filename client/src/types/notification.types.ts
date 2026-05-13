import type { ApiResponse } from '@/types/api';

export type NotificationType =
  | 'USER_REGISTERED'
  | 'EVENT_UPDATED'
  | 'EVENT_CANCELLED'
  | 'TICKET_GENERATED'
  | 'TICKET_STATUS_CHANGED'
  | 'EVENT_REMINDER_24H'
  | 'EVENT_REMINDER_1H'
  | 'NEW_EVENT_CREATED'
  | 'EVENT_SEATS_FULL';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  readAt: string | null;
  link: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface NotificationListData {
  notifications: NotificationItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface NotificationQuery {
  page: number;
  limit: number;
  filter?: 'all' | 'read' | 'unread';
}

export type NotificationListResponse = ApiResponse<NotificationListData>;
export type NotificationUnreadCountResponse = ApiResponse<{ count: number }>;
export type NotificationMarkAllResponse = ApiResponse<{ updatedCount: number }>;
