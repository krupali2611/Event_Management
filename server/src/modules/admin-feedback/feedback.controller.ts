import type { Response } from 'express';
import type { ApiResponse } from '../../types/api';
import type { AuthenticatedRequest } from '../../types/auth.types';
import { sendSuccess } from '../../utils/response';
import {
  getAdminFeedbackAnalytics,
  getAdminFeedbackReviews,
  type AdminFeedbackAnalyticsDto,
  type AdminFeedbackReviewsDto,
} from './feedback.service';

export async function getAdminFeedbackReviewsController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<AdminFeedbackReviewsDto>>,
): Promise<void> {
  const reviews = await getAdminFeedbackReviews(request.user!);
  sendSuccess(response, 200, 'Admin feedback reviews fetched successfully', reviews);
}

export async function getAdminFeedbackAnalyticsController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<AdminFeedbackAnalyticsDto>>,
): Promise<void> {
  const analytics = await getAdminFeedbackAnalytics(request.user!);
  sendSuccess(response, 200, 'Admin feedback analytics fetched successfully', analytics);
}
