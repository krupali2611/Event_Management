import { httpClient } from '@/api/httpClient';
import type {
  AttendeePastEventsResponse,
  FeedbackListResponse,
  FeedbackResponse,
  OrganizerFeedbackAnalyticsResponse,
  OrganizerFeedbackFilters,
  OrganizerFeedbackListResponse,
  SubmitFeedbackPayload,
} from '@/types/feedback.types';

export const feedbackService = {
  async submitFeedback(payload: SubmitFeedbackPayload): Promise<FeedbackResponse> {
    const response = await httpClient.post<FeedbackResponse>('/feedback', payload);
    return response.data;
  },

  async getMyFeedback(): Promise<FeedbackListResponse> {
    const response = await httpClient.get<FeedbackListResponse>('/feedback/my-feedback');
    return response.data;
  },

  async getOrganizerFeedback(filters: OrganizerFeedbackFilters): Promise<OrganizerFeedbackListResponse> {
    const response = await httpClient.get<OrganizerFeedbackListResponse>('/organizer/feedback', {
      params: {
        page: filters.page,
        limit: filters.limit,
        ...(filters.eventId ? { eventId: filters.eventId } : {}),
      },
    });
    return response.data;
  },

  async getOrganizerFeedbackAnalytics(): Promise<OrganizerFeedbackAnalyticsResponse> {
    const response = await httpClient.get<OrganizerFeedbackAnalyticsResponse>('/organizer/feedback/analytics');
    return response.data;
  },

  async getPastEvents(): Promise<AttendeePastEventsResponse> {
    const response = await httpClient.get<AttendeePastEventsResponse>('/attendee/dashboard/past-events');
    return response.data;
  },
};
