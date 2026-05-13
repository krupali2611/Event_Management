import type { Response } from 'express';
import type { ApiResponse } from '../../types/api';
import type { AuthenticatedRequest } from '../../types/auth.types';
import { sendSuccess } from '../../utils/response';
import {
  createFeedbackBodySchema,
  organizerFeedbackQuerySchema,
} from './feedback.validation';
import {
  getAttendeePastEvents,
  getMyFeedback,
  getOrganizerFeedback,
  getOrganizerFeedbackAnalytics,
  submitFeedback,
  type AttendeePastEventsDto,
  type FeedbackDto,
  type FeedbackListDto,
  type OrganizerFeedbackAnalyticsDto,
  type OrganizerFeedbackListDto,
} from './feedback.service';

export async function submitFeedbackController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<FeedbackDto>>,
): Promise<void> {
  const payload = createFeedbackBodySchema.parse(request.body);
  const feedback = await submitFeedback(payload, request.user!);
  sendSuccess(response, 201, 'Feedback submitted successfully', feedback);
}

export async function getMyFeedbackController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<FeedbackListDto>>,
): Promise<void> {
  const feedbacks = await getMyFeedback(request.user!);
  sendSuccess(response, 200, 'Submitted feedback fetched successfully', feedbacks);
}

export async function getOrganizerFeedbackController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<OrganizerFeedbackListDto>>,
): Promise<void> {
  const query = organizerFeedbackQuerySchema.parse(request.query);
  const feedbacks = await getOrganizerFeedback(request.user!, query);
  sendSuccess(response, 200, 'Organizer feedback fetched successfully', feedbacks);
}

export async function getOrganizerFeedbackAnalyticsController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<OrganizerFeedbackAnalyticsDto>>,
): Promise<void> {
  const analytics = await getOrganizerFeedbackAnalytics(request.user!);
  sendSuccess(response, 200, 'Organizer feedback analytics fetched successfully', analytics);
}

export async function getAttendeePastEventsController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<AttendeePastEventsDto>>,
): Promise<void> {
  const events = await getAttendeePastEvents(request.user!);
  sendSuccess(response, 200, 'Past attended events fetched successfully', events);
}
