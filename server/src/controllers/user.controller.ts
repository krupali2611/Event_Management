import type { Response } from 'express';
import { deactivateUserByActor, getUserByIdForActor, getUsersByActor, updateUserRoleByActor, updateUserStatusByActor } from '../services/user.service';
import type { ApiResponse } from '../types/api';
import type { AuthenticatedRequest, AuthUserDto } from '../types/auth.types';
import type { PaginatedUsersData } from '../types/user.types';
import { updateUserRoleBodySchema, updateUserStatusBodySchema, userIdParamSchema, userListQuerySchema } from '../validations/user.validation';
import { sendSuccess } from '../utils/response';

export async function getUsersController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<PaginatedUsersData>>,
): Promise<void> {
  const query = userListQuerySchema.parse(request.query);
  const users = await getUsersByActor(request.user!.role, query);
  sendSuccess(response, 200, 'Users fetched successfully', users);
}

export async function getUserDetailsController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<AuthUserDto>>,
): Promise<void> {
  const { id } = userIdParamSchema.parse(request.params);
  const user = await getUserByIdForActor(request.user!.id, request.user!.role, id);
  sendSuccess(response, 200, 'User fetched successfully', user);
}

export async function updateUserRoleController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<AuthUserDto>>,
): Promise<void> {
  const payload = updateUserRoleBodySchema.parse(request.body);
  const { id } = userIdParamSchema.parse(request.params);
  const updatedUser = await updateUserRoleByActor(request.user!.id, request.user!.role, id, payload.role);
  sendSuccess(response, 200, 'User role updated successfully', updatedUser);
}

export async function deactivateUserController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<AuthUserDto>>,
): Promise<void> {
  const { id } = userIdParamSchema.parse(request.params);
  const user = await deactivateUserByActor(request.user!.id, request.user!.role, id);
  sendSuccess(response, 200, 'User disabled successfully', user);
}

export async function updateUserStatusController(
  request: AuthenticatedRequest,
  response: Response<ApiResponse<AuthUserDto>>,
): Promise<void> {
  const { id } = userIdParamSchema.parse(request.params);
  const payload = updateUserStatusBodySchema.parse(request.body);
  const user = await updateUserStatusByActor(request.user!.id, request.user!.role, id, payload.isActive);
  sendSuccess(response, 200, `User ${payload.isActive ? 'activated' : 'marked inactive'} successfully`, user);
}
