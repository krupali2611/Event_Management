import type { ApiResponse, AuthUser, UserRole } from '@/types/api';

export interface UserListFilters {
  page: number;
  limit: number;
  search: string;
  role: '' | UserRole;
  status?: '' | 'ACTIVE' | 'INACTIVE';
}

export interface UserListItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface UserListPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserListData {
  users: UserListItem[];
  pagination: UserListPagination;
}

export interface UserRoleUpdatePayload {
  role: UserRole;
}

export type UsersResponse = ApiResponse<UserListData>;
export type UserResponse = ApiResponse<AuthUser>;
