import type { USER_ROLE } from '@prisma/client';
import type { Request } from 'express';

export interface JwtPayload {
  id: string;
  email: string;
  role: USER_ROLE;
}

export interface AuthenticatedUser extends JwtPayload {}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthUserDto {
  id: string;
  name: string;
  email: string;
  role: USER_ROLE;
  isActive: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponseData {
  token: string;
  user: AuthUserDto;
}
