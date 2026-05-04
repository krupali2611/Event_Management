import { Prisma } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import type { ApiResponse } from '../types/api';
import { AppError } from '../utils/response';

export function notFoundHandler(_request: Request, response: Response<ApiResponse>, _next: NextFunction): void {
  response.status(404).json({
    success: false,
    message: 'Route not found',
  });
}

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response<ApiResponse>,
  _next: NextFunction,
): void {
  if (error instanceof ZodError) {
    response.status(400).json({
      success: false,
      message: error.issues[0]?.message ?? 'Validation failed',
      data: error.flatten() as never,
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    response.status(409).json({
      success: false,
      message: 'A record with this value already exists',
    });
    return;
  }

  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
    return;
  }

  const message = error instanceof Error ? error.message : 'Internal server error';

  response.status(500).json({
    success: false,
    message,
  });
}
