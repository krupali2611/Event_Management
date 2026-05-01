import type { NextFunction, Request, Response } from 'express';
import type { ApiResponse } from '../types/api';

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
  const message = error instanceof Error ? error.message : 'Internal server error';

  response.status(500).json({
    success: false,
    message,
  });
}
