import { httpClient } from '@/api/httpClient';
import type { AdminFeedbackAnalyticsResponse, AdminFeedbackReviewsResponse } from '@/types/admin-feedback.types';

export const adminFeedbackService = {
  async getReviews(): Promise<AdminFeedbackReviewsResponse> {
    const response = await httpClient.get<AdminFeedbackReviewsResponse>('/admin/feedback');
    return response.data;
  },

  async getAnalytics(): Promise<AdminFeedbackAnalyticsResponse> {
    const response = await httpClient.get<AdminFeedbackAnalyticsResponse>('/admin/feedback/analytics');
    return response.data;
  },
};
