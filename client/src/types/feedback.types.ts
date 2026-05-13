import type { ApiResponse } from '@/types/api';

export interface FeedbackEventSummary {
  id: string;
  title: string;
  bannerImage: string | null;
  category: string;
  startDate: string;
  endDate: string;
  venue: {
    id: string;
    name: string;
    location: string;
  } | null;
}

export interface FeedbackAttendeeSummary {
  id: string;
  name: string;
  email: string;
}

export interface FeedbackItem {
  id: string;
  eventId: string;
  attendeeId: string;
  rating: number;
  review: string;
  createdAt: string;
  updatedAt: string;
  event: FeedbackEventSummary;
  attendee: FeedbackAttendeeSummary;
}

export interface FeedbackListData {
  feedbacks: FeedbackItem[];
}

export interface OrganizerFeedbackListData {
  feedbacks: FeedbackItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface OrganizerFeedbackAnalyticsEvent {
  eventId: string;
  eventTitle: string;
  bannerImage: string | null;
  averageRating: number;
  totalReviews: number;
}

export interface OrganizerFeedbackAnalyticsData {
  averageRating: number;
  totalReviews: number;
  highestRatedEvents: OrganizerFeedbackAnalyticsEvent[];
  lowestRatedEvents: OrganizerFeedbackAnalyticsEvent[];
  recentReviews: FeedbackItem[];
}

export interface AttendeePastEventItem {
  eventId: string;
  ticketBookingId: string;
  ticketStatus: 'confirmed' | 'used';
  quantity: number;
  event: FeedbackEventSummary;
  feedbackSubmitted: boolean;
  feedback: {
    id: string;
    rating: number;
    review: string;
    createdAt: string;
  } | null;
}

export interface AttendeePastEventsData {
  events: AttendeePastEventItem[];
}

export interface SubmitFeedbackPayload {
  eventId: string;
  rating: number;
  review: string;
}

export interface OrganizerFeedbackFilters {
  page: number;
  limit: number;
  eventId?: string;
}

export type FeedbackResponse = ApiResponse<FeedbackItem>;
export type FeedbackListResponse = ApiResponse<FeedbackListData>;
export type OrganizerFeedbackListResponse = ApiResponse<OrganizerFeedbackListData>;
export type OrganizerFeedbackAnalyticsResponse = ApiResponse<OrganizerFeedbackAnalyticsData>;
export type AttendeePastEventsResponse = ApiResponse<AttendeePastEventsData>;
