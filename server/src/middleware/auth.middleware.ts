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
        name: true,
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
      name: user.name,
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

export async function authorizeEventOwnership(
  request: AuthenticatedRequest,
  _response: Response<ApiResponse>,
  next: NextFunction,
): Promise<void> {
  if (!request.user) {
    next(new AppError('Authentication is required', 401));
    return;
  }

  if (request.user.role === 'ADMIN' || request.user.role === 'SUPER_ADMIN') {
    next();
    return;
  }

  if (request.user.role !== 'ORGANIZER') {
    next(new AppError('You do not have permission to manage this event', 403));
    return;
  }

  const eventId = typeof request.params.id === 'string' ? request.params.id.trim() : '';

  if (!eventId) {
    next(new AppError('Event id is required', 400));
    return;
  }

  if (!('event' in prisma) || !prisma.event) {
    next(new AppError('Event model is not available in the Prisma client. Run Prisma generate and restart the server.', 500));
    return;
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, organizerId: true },
  });

  if (!event) {
    next(new AppError('Event not found', 404));
    return;
  }

  if (event.organizerId !== request.user.id) {
    next(new AppError('You do not have permission to manage this event', 403));
    return;
  }

  next();
}
