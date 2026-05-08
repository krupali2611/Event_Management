import { Router } from 'express';
import {
  createEventController,
  deleteEventController,
  getEventController,
  getEventsController,
  getPublicEventController,
  getPublicEventsController,
  updateEventController,
  updateEventStatusController,
} from '../controllers/event.controller';
import { authenticate, authorizeEventOwnership } from '../middleware/auth.middleware';
import { eventImageUpload } from '../middleware/upload';
import { requireRole } from '../middleware/role.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const eventRouter = Router();

eventRouter.get('/public', asyncHandler(getPublicEventsController));
eventRouter.get('/public/:id', asyncHandler(getPublicEventController));

eventRouter.use(authenticate);
eventRouter.get('/', requireRole('ADMIN', 'SUPER_ADMIN', 'ORGANIZER', 'ATTENDEE'), asyncHandler(getEventsController));
eventRouter.post(
  '/',
  requireRole('ADMIN', 'SUPER_ADMIN', 'ORGANIZER'),
  eventImageUpload.fields([
    { name: 'bannerImageFile', maxCount: 1 },
    { name: 'galleryImageFiles', maxCount: 8 },
  ]),
  asyncHandler(createEventController),
);
eventRouter.get('/:id', requireRole('ADMIN', 'SUPER_ADMIN', 'ORGANIZER', 'ATTENDEE'), asyncHandler(getEventController));
eventRouter.put(
  '/:id',
  requireRole('ADMIN', 'SUPER_ADMIN', 'ORGANIZER'),
  asyncHandler(authorizeEventOwnership),
  eventImageUpload.fields([
    { name: 'bannerImageFile', maxCount: 1 },
    { name: 'galleryImageFiles', maxCount: 8 },
  ]),
  asyncHandler(updateEventController),
);
eventRouter.patch('/:id/status', requireRole('ADMIN', 'SUPER_ADMIN', 'ORGANIZER'), asyncHandler(authorizeEventOwnership), asyncHandler(updateEventStatusController));
eventRouter.delete('/:id', requireRole('ADMIN', 'SUPER_ADMIN', 'ORGANIZER'), asyncHandler(authorizeEventOwnership), asyncHandler(deleteEventController));

export default eventRouter;
