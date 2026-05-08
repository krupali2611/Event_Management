import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  cancelTicketBookingController,
  createTicketBookingController,
  getEventTicketBookingsController,
  getEventTicketStatsController,
  getTicketDashboardSummaryController,
  getMyTicketBookingsController,
  getTicketBookingController,
} from './ticket.controller';

const ticketRouter = Router();

ticketRouter.use(authenticate);

ticketRouter.get('/dashboard/summary', requireRole('ORGANIZER', 'ADMIN', 'SUPER_ADMIN'), asyncHandler(getTicketDashboardSummaryController));
ticketRouter.get('/event/:eventId/stats', requireRole('ORGANIZER', 'ADMIN', 'SUPER_ADMIN'), asyncHandler(getEventTicketStatsController));
ticketRouter.get('/event/:eventId', requireRole('ORGANIZER', 'ADMIN', 'SUPER_ADMIN'), asyncHandler(getEventTicketBookingsController));

ticketRouter.use(requireRole('ATTENDEE'));
ticketRouter.post('/book', asyncHandler(createTicketBookingController));
ticketRouter.get('/my', asyncHandler(getMyTicketBookingsController));
ticketRouter.get('/:id', asyncHandler(getTicketBookingController));
ticketRouter.delete('/:id', asyncHandler(cancelTicketBookingController));

export default ticketRouter;
