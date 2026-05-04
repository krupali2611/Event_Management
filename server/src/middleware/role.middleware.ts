import type { USER_ROLE } from '@prisma/client';
import type { NextFunction, Response } from 'express';
import type { ApiResponse } from '../types/api';
import type { AuthenticatedRequest } from '../types/auth.types';
import { AppError } from '../utils/response';

export function requireRole(...roles: USER_ROLE[]) {
  return (request: AuthenticatedRequest, _response: Response<ApiResponse>, next: NextFunction): void => {
    if (!request.user) {
      next(new AppError('Authentication is required', 401));
      return;
    }

    if (!roles.includes(request.user.role)) {
      next(new AppError('You do not have permission to access this resource', 403));
      return;
    }

    next();
  };
}
