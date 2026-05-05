export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export interface HealthCheckResponse {
  success: boolean;
  message: string;
}

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'ORGANIZER' | 'ATTENDEE';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}
