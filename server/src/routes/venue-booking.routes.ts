import { Router } from 'express';
import {
  cancelVenueBookingController,
  checkVenueBookingAvailabilityController,
  createVenueBookingController,
  getVenueBookingController,
  getVenueBookingsController,
} from '../controllers/venue-booking.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const venueBookingRouter = Router();

venueBookingRouter.use(authenticate);
venueBookingRouter.get('/', requireRole('ADMIN', 'SUPER_ADMIN', 'ORGANIZER'), asyncHandler(getVenueBookingsController));
venueBookingRouter.post('/', requireRole('ADMIN', 'SUPER_ADMIN', 'ORGANIZER'), asyncHandler(createVenueBookingController));
venueBookingRouter.post(
  '/check-availability',
  requireRole('ADMIN', 'SUPER_ADMIN', 'ORGANIZER'),
  asyncHandler(checkVenueBookingAvailabilityController),
);
venueBookingRouter.get('/:id', requireRole('ADMIN', 'SUPER_ADMIN', 'ORGANIZER'), asyncHandler(getVenueBookingController));
venueBookingRouter.put('/:id/cancel', requireRole('ADMIN', 'SUPER_ADMIN', 'ORGANIZER'), asyncHandler(cancelVenueBookingController));

export default venueBookingRouter;
