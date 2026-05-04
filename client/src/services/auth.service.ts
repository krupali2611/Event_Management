import { httpClient } from '@/api/httpClient';
import type { ApiResponse, AuthResponse, AuthUser } from '@/types/api';

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authService = {
  async register(payload: RegisterPayload): Promise<ApiResponse<AuthResponse>> {
    const response = await httpClient.post<ApiResponse<AuthResponse>>('/auth/register', payload);
    return response.data;
  },

  async login(payload: LoginPayload): Promise<ApiResponse<AuthResponse>> {
    const response = await httpClient.post<ApiResponse<AuthResponse>>('/auth/login', payload);
    return response.data;
  },

  async me(): Promise<ApiResponse<AuthUser>> {
    const response = await httpClient.get<ApiResponse<AuthUser>>('/auth/me');
    return response.data;
  },
};
