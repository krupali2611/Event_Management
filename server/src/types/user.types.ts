import type { USER_ROLE } from '@prisma/client';

export interface UserListQuery {
  page: number;
  limit: number;
  search?: string;
  role?: USER_ROLE;
  isActive?: boolean;
}

export interface UserListItemDto {
  id: string;
  name: string;
  email: string;
  role: USER_ROLE;
  isActive: boolean;
}

export interface PaginatedUsersData {
  users: UserListItemDto[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
