import type { Response } from 'express';
import { loginSchema, registerSchema } from '../validations/auth.validation';
import type { ApiResponse } from '../types/api';
import type { AuthenticatedRequest, AuthResponseData, AuthUserDto } from '../types/auth.types';
import { getCurrentUser, loginUser, registerUser } from '../services/auth.service';
import { sendSuccess } from '../utils/response';

export async function registerController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<AuthResponseData>>,
): Promise<void> {
  const payload = registerSchema.parse(request.body);
  const result = await registerUser(payload);
  sendSuccess(response, 201, 'Registration successful', result);
}

export async function loginController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<AuthResponseData>>,
): Promise<void> {
  const payload = loginSchema.parse(request.body);
  const result = await loginUser(payload);
  sendSuccess(response, 200, 'Login successful', result);
}

export async function meController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<AuthUserDto>>,
): Promise<void> {
  const currentUser = await getCurrentUser(request.user!.id);
  sendSuccess(response, 200, 'Authenticated user fetched successfully', currentUser);
}
