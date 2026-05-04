import type { Response } from 'express';
import type { ApiResponse } from '../types/api';

export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}

export function sendSuccess<T>(response: Response<ApiResponse<T>>, statusCode: number, message: string, data?: T): void {
  response.status(statusCode).json({
    success: true,
    message,
    data,
  });
}
