import { Router } from 'express';
import { loginController, meController, registerController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const authRouter = Router();

authRouter.post('/register', asyncHandler(registerController));
authRouter.post('/login', asyncHandler(loginController));
authRouter.get('/me', authenticate, asyncHandler(meController));

export default authRouter;
