import { Router } from 'express';
import authRouter from './auth.routes';
import eventRouter from './event.routes';
import healthRouter from './healthRoutes';
import ticketRouter from '../modules/tickets/ticket.routes';
import adminDashboardRouter from '../modules/admin-dashboard/dashboard.routes';
import adminFeedbackRouter from '../modules/admin-feedback/feedback.routes';
import feedbackRouter from '../modules/feedback/feedback.routes';
import notificationRouter from '../modules/notification/notification.routes';
import organizerDashboardRouter from '../modules/organizer-dashboard/dashboard.routes';
import superAdminDashboardRouter from '../modules/super-admin-dashboard/dashboard.routes';
import userRouter from './user.routes';
import venueBookingRouter from './venue-booking.routes';
import venueRouter from './venue.routes';

const apiRouter = Router();

apiRouter.use('/', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/events', eventRouter);
apiRouter.use('/tickets', ticketRouter);
apiRouter.use('/admin/dashboard', adminDashboardRouter);
apiRouter.use('/admin', adminFeedbackRouter);
apiRouter.use('/', feedbackRouter);
apiRouter.use('/notifications', notificationRouter);
apiRouter.use('/organizer/dashboard', organizerDashboardRouter);
apiRouter.use('/super-admin/dashboard', superAdminDashboardRouter);
apiRouter.use('/venues', venueRouter);
apiRouter.use('/venue-bookings', venueBookingRouter);

export default apiRouter;
