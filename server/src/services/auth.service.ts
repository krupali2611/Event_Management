import { prisma } from '../config/prisma';
import type { AuthResponseData, AuthUserDto, LoginInput, RegisterInput } from '../types/auth.types';
import { generateToken } from '../utils/jwt';
import { comparePassword, hashPassword } from '../utils/password';
import { AppError } from '../utils/response';

type AuthUserRecord = {
  id: string;
  name: string;
  email: string;
  role: AuthUserDto['role'];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function toAuthUserDto(user: AuthUserRecord): AuthUserDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function buildAuthResponse(user: AuthUserRecord): AuthResponseData {
  const authUser = toAuthUserDto(user);

  return {
    token: generateToken({
      id: authUser.id,
      email: authUser.email,
      role: authUser.role,
    }),
    user: authUser,
  };
}

export async function registerUser(input: RegisterInput): Promise<AuthResponseData> {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    throw new AppError('An account with this email already exists', 409);
  }

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password: await hashPassword(input.password),
      role: 'ATTENDEE',
    },
  });

  return buildAuthResponse(user);
}

export async function loginUser(input: LoginInput): Promise<AuthResponseData> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.isActive) {
    throw new AppError('This account has been disabled', 403);
  }

  const isPasswordValid = await comparePassword(input.password, user.password);

  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  return buildAuthResponse(user);
}

export async function getCurrentUser(userId: string): Promise<AuthUserDto> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError('Authenticated user not found', 404);
  }

  if (!user.isActive) {
    throw new AppError('This account has been disabled', 403);
  }

  return toAuthUserDto(user);
}
