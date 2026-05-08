import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  getNotificationsController,
  getUnreadNotificationCountController,
  markAllNotificationsAsReadController,
  markNotificationAsReadController,
} from './notification.controller';

const notificationRouter = Router();

notificationRouter.use(authenticate);
notificationRouter.get('/', asyncHandler(getNotificationsController));
notificationRouter.get('/unread-count', asyncHandler(getUnreadNotificationCountController));
notificationRouter.patch('/read-all', asyncHandler(markAllNotificationsAsReadController));
notificationRouter.patch('/:id/read', asyncHandler(markNotificationAsReadController));

export default notificationRouter;
