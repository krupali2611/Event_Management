import type { Response } from 'express';
import type { ApiResponse } from '../../types/api';
import type { AuthenticatedRequest } from '../../types/auth.types';
import { sendSuccess } from '../../utils/response';
import {
  getNotificationList,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type NotificationListData,
} from './notification.service';
import { notificationIdParamSchema, notificationQuerySchema } from './notification.validation';

export async function getNotificationsController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<NotificationListData>>,
): Promise<void> {
  const query = notificationQuerySchema.parse(request.query);
  const data = await getNotificationList(request.user!.id, query);
  sendSuccess(response, 200, 'Notifications fetched successfully', data);
}

export async function getUnreadNotificationCountController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<{ count: number }>>,
): Promise<void> {
  const data = await getUnreadNotificationCount(request.user!.id);
  sendSuccess(response, 200, 'Unread notification count fetched successfully', data);
}

export async function markNotificationAsReadController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse>,
): Promise<void> {
  const { id } = notificationIdParamSchema.parse(request.params);
  await markNotificationAsRead(id, request.user!.id);
  sendSuccess(response, 200, 'Notification marked as read');
}

export async function markAllNotificationsAsReadController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<{ updatedCount: number }>>,
): Promise<void> {
  const data = await markAllNotificationsAsRead(request.user!.id);
  sendSuccess(response, 200, 'All notifications marked as read', data);
}
