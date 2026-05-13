import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  getAdminFeedbackAnalyticsController,
  getAdminFeedbackReviewsController,
} from './feedback.controller';

const adminFeedbackRouter = Router();

adminFeedbackRouter.use(authenticate);
adminFeedbackRouter.use(requireRole('ADMIN', 'SUPER_ADMIN'));

adminFeedbackRouter.get('/feedback', asyncHandler(getAdminFeedbackReviewsController));
adminFeedbackRouter.get('/feedback/analytics', asyncHandler(getAdminFeedbackAnalyticsController));

export default adminFeedbackRouter;
