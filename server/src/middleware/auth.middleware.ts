import type { NextFunction, Response } from 'express';
import { prisma } from '../config/prisma';
import jwt from 'jsonwebtoken';
import type { ApiResponse } from '../types/api';
import type { AuthenticatedRequest } from '../types/auth.types';
import { verifyToken } from '../utils/jwt';
import { AppError } from '../utils/response';

export async function authenticate(
  request: AuthenticatedRequest,
  _response: Response<ApiResponse>,
  next: NextFunction,
): Promise<void> {
  const authorizationHeader = request.headers.authorization;

  if (!authorizationHeader?.startsWith('Bearer ')) {
    next(new AppError('Authorization token is missing', 401));
    return;
  }

  const token = authorizationHeader.slice(7).trim();

  if (!token) {
    next(new AppError('Authorization token is missing', 401));
    return;
  }

  try {
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      next(new AppError('Authenticated user is not allowed to access this resource', 401));
      return;
    }

    request.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Authorization token has expired', 401));
      return;
    }

    next(new AppError('Invalid authorization token', 401));
  }
}
