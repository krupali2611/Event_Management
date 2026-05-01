import type { Request, Response } from 'express';
import type { ApiResponse } from '../types/api';

export function getHealthStatus(_request: Request, response: Response<ApiResponse>): void {
  response.status(200).json({
    success: true,
    message: 'Server running successfully',
  });
}
