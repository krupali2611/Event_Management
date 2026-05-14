import { Prisma } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
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
  const isProduction = process.env.NODE_ENV === 'production';

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

  if (error instanceof multer.MulterError) {
    response.status(400).json({
      success: false,
      message: error.code === 'LIMIT_FILE_SIZE' ? 'Image size must be 5 MB or smaller' : error.message,
    });
    return;
  }

  if (error instanceof Error) {
    console.error(error);
  } else {
    console.error('Unhandled non-error exception', error);
  }

  response.status(500).json({
    success: false,
    message: isProduction ? 'Internal server error' : error instanceof Error ? error.message : 'Internal server error',
  });
}
