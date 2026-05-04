import { Router } from 'express';
import {
  deactivateUserController,
  getUserDetailsController,
  getUsersController,
  updateUserStatusController,
  updateUserRoleController,
} from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const userRouter = Router();

userRouter.use(authenticate);
userRouter.get('/', requireRole('ADMIN', 'SUPER_ADMIN'), asyncHandler(getUsersController));
userRouter.get('/:id', requireRole('ADMIN', 'SUPER_ADMIN'), asyncHandler(getUserDetailsController));
userRouter.patch('/:id/role', requireRole('ADMIN', 'SUPER_ADMIN'), asyncHandler(updateUserRoleController));
userRouter.patch('/:id/status', requireRole('SUPER_ADMIN'), asyncHandler(updateUserStatusController));
userRouter.delete('/:id', requireRole('SUPER_ADMIN'), asyncHandler(deactivateUserController));

export default userRouter;
