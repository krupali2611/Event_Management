import { Router } from 'express';
import {
  createVenueController,
  deactivateVenueController,
  getVenueAvailabilityController,
  getVenueController,
  getVenuesController,
  toggleVenueStatusController,
  uploadVenueImageController,
  updateVenueController,
} from '../controllers/venue.controller';
import { authenticate } from '../middleware/auth.middleware';
import { venueImageUpload } from '../middleware/upload';
import { requireRole } from '../middleware/role.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const venueRouter = Router();

venueRouter.use(authenticate);
venueRouter.get('/', requireRole('ADMIN', 'SUPER_ADMIN', 'ORGANIZER', 'ATTENDEE'), asyncHandler(getVenuesController));
venueRouter.post('/', requireRole('ADMIN', 'SUPER_ADMIN'), asyncHandler(createVenueController));
venueRouter.post(
  '/upload-image',
  requireRole('ADMIN', 'SUPER_ADMIN'),
  venueImageUpload.single('image'),
  asyncHandler(uploadVenueImageController),
);
venueRouter.get('/:id', requireRole('ADMIN', 'SUPER_ADMIN', 'ORGANIZER'), asyncHandler(getVenueController));
venueRouter.get('/:id/availability', requireRole('ADMIN', 'SUPER_ADMIN', 'ORGANIZER'), asyncHandler(getVenueAvailabilityController));
venueRouter.put('/:id', requireRole('ADMIN', 'SUPER_ADMIN'), asyncHandler(updateVenueController));
venueRouter.patch('/:id/status', requireRole('ADMIN', 'SUPER_ADMIN'), asyncHandler(toggleVenueStatusController));
venueRouter.delete('/:id', requireRole('ADMIN', 'SUPER_ADMIN'), asyncHandler(deactivateVenueController));

export default venueRouter;
