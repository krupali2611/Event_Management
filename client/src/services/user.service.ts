import { httpClient } from '@/api/httpClient';
import type { UserListFilters, UserResponse, UserRoleUpdatePayload, UsersResponse } from '@/types/user.types';

export const userService = {
  async getUsers(filters: UserListFilters): Promise<UsersResponse> {
    const response = await httpClient.get<UsersResponse>('/users', {
      params: {
        page: filters.page,
        limit: filters.limit,
        ...(filters.search ? { search: filters.search } : {}),
        ...(filters.role ? { role: filters.role } : {}),
        ...(filters.status ? { isActive: filters.status === 'ACTIVE' } : {}),
      },
    });

    return response.data;
  },

  async getUserById(userId: string): Promise<UserResponse> {
    const response = await httpClient.get<UserResponse>(`/users/${userId}`);
    return response.data;
  },

  async updateUserRole(userId: string, payload: UserRoleUpdatePayload): Promise<UserResponse> {
    const response = await httpClient.patch<UserResponse>(`/users/${userId}/role`, payload);
    return response.data;
  },

  async deleteUser(userId: string): Promise<UserResponse> {
    const response = await httpClient.delete<UserResponse>(`/users/${userId}`);
    return response.data;
  },

  async updateUserStatus(userId: string, isActive: boolean): Promise<UserResponse> {
    const response = await httpClient.patch<UserResponse>(`/users/${userId}/status`, { isActive });
    return response.data;
  },
};
