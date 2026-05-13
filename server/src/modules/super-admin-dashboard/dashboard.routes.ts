import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  getSuperAdminDashboardRevenueController,
  getSuperAdminDashboardRoleDistributionController,
  getSuperAdminDashboardStatsController,
  getSuperAdminDashboardTopEventsController,
  getSuperAdminDashboardTopOrganizersController,
  getSuperAdminDashboardUserGrowthController,
} from './dashboard.controller';

const superAdminDashboardRouter = Router();

superAdminDashboardRouter.use(authenticate);
superAdminDashboardRouter.use(requireRole('ADMIN', 'SUPER_ADMIN'));

superAdminDashboardRouter.get('/stats', asyncHandler(getSuperAdminDashboardStatsController));
superAdminDashboardRouter.get('/revenue', asyncHandler(getSuperAdminDashboardRevenueController));
superAdminDashboardRouter.get('/user-growth', asyncHandler(getSuperAdminDashboardUserGrowthController));
superAdminDashboardRouter.get('/role-distribution', asyncHandler(getSuperAdminDashboardRoleDistributionController));
superAdminDashboardRouter.get('/top-organizers', asyncHandler(getSuperAdminDashboardTopOrganizersController));
superAdminDashboardRouter.get('/top-events', asyncHandler(getSuperAdminDashboardTopEventsController));

export default superAdminDashboardRouter;
