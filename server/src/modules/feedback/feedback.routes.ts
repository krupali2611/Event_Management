import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  getAttendeePastEventsController,
  getMyFeedbackController,
  getOrganizerFeedbackAnalyticsController,
  getOrganizerFeedbackController,
  submitFeedbackController,
} from './feedback.controller';

const feedbackRouter = Router();

feedbackRouter.use(authenticate);

feedbackRouter.post('/feedback', requireRole('ATTENDEE'), asyncHandler(submitFeedbackController));
feedbackRouter.get('/feedback/my-feedback', requireRole('ATTENDEE'), asyncHandler(getMyFeedbackController));
feedbackRouter.get('/attendee/dashboard/past-events', requireRole('ATTENDEE'), asyncHandler(getAttendeePastEventsController));
feedbackRouter.get('/organizer/feedback/analytics', requireRole('ORGANIZER'), asyncHandler(getOrganizerFeedbackAnalyticsController));
feedbackRouter.get('/organizer/feedback', requireRole('ORGANIZER'), asyncHandler(getOrganizerFeedbackController));

export default feedbackRouter;
