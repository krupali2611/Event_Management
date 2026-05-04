import { Router } from 'express';
import authRouter from './auth.routes';
import healthRouter from './healthRoutes';
import userRouter from './user.routes';

const apiRouter = Router();

apiRouter.use('/', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', userRouter);

export default apiRouter;
