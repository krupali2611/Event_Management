import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  getOrganizerDashboardRecentPurchasesController,
  getOrganizerDashboardRevenueController,
  getOrganizerDashboardStatsController,
  getOrganizerDashboardTicketSalesController,
} from './dashboard.controller';

const organizerDashboardRouter = Router();

organizerDashboardRouter.use(authenticate);
organizerDashboardRouter.use(requireRole('ORGANIZER'));

organizerDashboardRouter.get('/stats', asyncHandler(getOrganizerDashboardStatsController));
organizerDashboardRouter.get('/revenue', asyncHandler(getOrganizerDashboardRevenueController));
organizerDashboardRouter.get('/ticket-sales', asyncHandler(getOrganizerDashboardTicketSalesController));
organizerDashboardRouter.get('/recent-purchases', asyncHandler(getOrganizerDashboardRecentPurchasesController));

export default organizerDashboardRouter;
