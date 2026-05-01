import { Router } from 'express';
import healthRouter from './healthRoutes';

const apiRouter = Router();

apiRouter.use('/', healthRouter);

export default apiRouter;
