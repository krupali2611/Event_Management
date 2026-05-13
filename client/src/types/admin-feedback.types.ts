import type { ApiResponse } from '@/types/api';

export interface AdminFeedbackReviewItem {
  id: string;
  attendee: {
    id: string;
    name: string;
    email: string;
  };
  organizer: {
    id: string;
    name: string;
    email: string;
  };
  event: {
    id: string;
    name: string;
  };
  rating: number;
  review: string;
  reviewDate: string;
}

export interface AdminFeedbackReviewsData {
  reviews: AdminFeedbackReviewItem[];
}

export interface AdminFeedbackRatedEventItem {
  eventId: string;
  eventName: string;
  organizerName: string;
  averageRating: number;
  totalReviews: number;
}

export interface AdminFeedbackOrganizerRatingItem {
  organizerId: string;
  organizerName: string;
  organizerEmail: string;
  averageRating: number;
  totalReviews: number;
  ratedEvents: number;
}

export interface AdminFeedbackAnalyticsData {
  totalReviews: number;
  averageRating: number;
  highestRatedEvents: AdminFeedbackRatedEventItem[];
  lowestRatedEvents: AdminFeedbackRatedEventItem[];
  organizerRatings: AdminFeedbackOrganizerRatingItem[];
}

export type AdminFeedbackReviewsResponse = ApiResponse<AdminFeedbackReviewsData>;
export type AdminFeedbackAnalyticsResponse = ApiResponse<AdminFeedbackAnalyticsData>;
