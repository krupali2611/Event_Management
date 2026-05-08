import { Router } from 'express';
import authRouter from './auth.routes';
import eventRouter from './event.routes';
import healthRouter from './healthRoutes';
import ticketRouter from '../modules/tickets/ticket.routes';
import userRouter from './user.routes';
import venueBookingRouter from './venue-booking.routes';
import venueRouter from './venue.routes';

const apiRouter = Router();

apiRouter.use('/', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/events', eventRouter);
apiRouter.use('/tickets', ticketRouter);
apiRouter.use('/venues', venueRouter);
apiRouter.use('/venue-bookings', venueBookingRouter);

export default apiRouter;
