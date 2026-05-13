import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  getAdminDashboardEventStatusController,
  getAdminDashboardEventsAnalyticsController,
  getAdminDashboardRecentEventsController,
  getAdminDashboardRecentUsersController,
  getAdminDashboardStatsController,
  getAdminDashboardUserAnalyticsController,
} from './dashboard.controller';

const adminDashboardRouter = Router();

adminDashboardRouter.use(authenticate);
adminDashboardRouter.use(requireRole('ADMIN', 'SUPER_ADMIN'));

adminDashboardRouter.get('/stats', asyncHandler(getAdminDashboardStatsController));
adminDashboardRouter.get('/events-analytics', asyncHandler(getAdminDashboardEventsAnalyticsController));
adminDashboardRouter.get('/user-analytics', asyncHandler(getAdminDashboardUserAnalyticsController));
adminDashboardRouter.get('/event-status', asyncHandler(getAdminDashboardEventStatusController));
adminDashboardRouter.get('/recent-events', asyncHandler(getAdminDashboardRecentEventsController));
adminDashboardRouter.get('/recent-users', asyncHandler(getAdminDashboardRecentUsersController));

export default adminDashboardRouter;
