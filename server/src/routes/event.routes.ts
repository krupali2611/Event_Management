import { Router } from 'express';
import {
  createEventController,
  deleteEventController,
  getEventController,
  getEventsController,
  updateEventController,
} from '../controllers/event.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const eventRouter = Router();

eventRouter.use(authenticate);
eventRouter.get('/', requireRole('ADMIN', 'SUPER_ADMIN', 'ORGANIZER', 'ATTENDEE'), asyncHandler(getEventsController));
eventRouter.post('/', requireRole('ADMIN', 'SUPER_ADMIN', 'ORGANIZER'), asyncHandler(createEventController));
eventRouter.get('/:id', requireRole('ADMIN', 'SUPER_ADMIN', 'ORGANIZER', 'ATTENDEE'), asyncHandler(getEventController));
eventRouter.put('/:id', requireRole('ADMIN', 'SUPER_ADMIN', 'ORGANIZER'), asyncHandler(updateEventController));
eventRouter.delete('/:id', requireRole('ADMIN', 'SUPER_ADMIN', 'ORGANIZER'), asyncHandler(deleteEventController));

export default eventRouter;
