import type { Prisma, USER_ROLE } from '@prisma/client';
import { prisma } from '../config/prisma';
import type { AuthUserDto } from '../types/auth.types';
import type { PaginatedUsersData, UserListItemDto, UserListQuery } from '../types/user.types';
import { AppError } from '../utils/response';

type ManagedUserRecord = {
  id: string;
  name: string;
  email: string;
  role: USER_ROLE;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function toAuthUserDto(user: ManagedUserRecord): AuthUserDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    status: user.isActive ? 'ACTIVE' : 'INACTIVE',
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function toUserListItemDto(user: Pick<ManagedUserRecord, 'id' | 'name' | 'email' | 'role' | 'isActive'>): UserListItemDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    status: user.isActive ? 'ACTIVE' : 'INACTIVE',
  };
}

function getVisibleRoles(actorRole: USER_ROLE): USER_ROLE[] {
  return actorRole === 'SUPER_ADMIN' || actorRole === 'ADMIN'
    ? ['SUPER_ADMIN', 'ADMIN', 'ORGANIZER', 'ATTENDEE']
    : ['ORGANIZER', 'ATTENDEE'];
}

function ensureRoleFilterAllowed(actorRole: USER_ROLE, role?: USER_ROLE): void {
  if (role && !getVisibleRoles(actorRole).includes(role)) {
    throw new AppError('You do not have permission to filter by this role', 403);
  }
}

function buildUserVisibilityWhere(actorRole: USER_ROLE): Prisma.UserWhereInput {
  if (actorRole === 'SUPER_ADMIN' || actorRole === 'ADMIN') {
    return {};
  }

  return {
    role: { in: ['ATTENDEE', 'ORGANIZER'] },
  };
}

function assertUserVisible(actorUserId: string, actorRole: USER_ROLE, targetUser: ManagedUserRecord): void {
  if (actorRole === 'SUPER_ADMIN') {
    return;
  }

  if (!['ATTENDEE', 'ORGANIZER'].includes(targetUser.role)) {
    throw new AppError('You do not have permission to access this user', 403);
  }

  if (actorUserId === targetUser.id && actorRole === 'ADMIN') {
    throw new AppError('ADMIN self-management is not supported in this module', 403);
  }
}

function canTransitionRole(actorRole: USER_ROLE, currentRole: USER_ROLE, nextRole: USER_ROLE): boolean {
  if (currentRole === nextRole) {
    return true;
  }

  if (actorRole === 'ADMIN') {
    return (
      (currentRole === 'ATTENDEE' && nextRole === 'ORGANIZER') ||
      (currentRole === 'ORGANIZER' && nextRole === 'ATTENDEE')
    );
  }

  return (
    (currentRole === 'ATTENDEE' && (nextRole === 'ORGANIZER' || nextRole === 'ADMIN')) ||
    (currentRole === 'ORGANIZER' && (nextRole === 'ATTENDEE' || nextRole === 'ADMIN')) ||
    (currentRole === 'ADMIN' && nextRole === 'ORGANIZER')
  );
}

async function getManagedUserOrThrow(targetUserId: string): Promise<ManagedUserRecord> {
  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
}

export async function getUsersByActor(
  actorRole: USER_ROLE,
  query: UserListQuery,
): Promise<PaginatedUsersData> {
  ensureRoleFilterAllowed(actorRole, query.role);

  const baseWhere = buildUserVisibilityWhere(actorRole);
  const whereClause: Prisma.UserWhereInput = {
    ...baseWhere,
    ...(query.role ? { role: query.role } : {}),
    ...((query.status ?? (query.isActive === undefined ? undefined : query.isActive ? 'ACTIVE' : 'INACTIVE'))
      ? {
          isActive: (query.status ?? (query.isActive ? 'ACTIVE' : 'INACTIVE')) === 'ACTIVE',
        }
      : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { email: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const skip = (query.page - 1) * query.limit;
  const [items, totalItems] = await Promise.all([
    prisma.user.findMany({
      where: whereClause,
      orderBy: [{ createdAt: 'desc' }],
      skip,
      take: query.limit,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    }),
    prisma.user.count({ where: whereClause }),
  ]);

  return {
    users: items.map(toUserListItemDto),
    pagination: {
      total: totalItems,
      page: query.page,
      limit: query.limit,
      totalPages: Math.max(1, Math.ceil(totalItems / query.limit)),
    },
  };
}

export async function getUserByIdForActor(actorUserId: string, actorRole: USER_ROLE, targetUserId: string): Promise<AuthUserDto> {
  const user = await getManagedUserOrThrow(targetUserId);
  assertUserVisible(actorUserId, actorRole, user);
  return toAuthUserDto(user);
}

export async function updateUserRoleByActor(
  actorUserId: string,
  actorRole: USER_ROLE,
  targetUserId: string,
  nextRole: USER_ROLE,
): Promise<AuthUserDto> {
  const targetUser = await getManagedUserOrThrow(targetUserId);

  if (targetUser.role === 'SUPER_ADMIN') {
    throw new AppError('SUPER_ADMIN users cannot be modified', 403);
  }

  if (actorUserId === targetUserId) {
    if (actorRole === 'SUPER_ADMIN') {
      throw new AppError('SUPER_ADMIN cannot demote themselves', 403);
    }

    throw new AppError('You cannot change your own role', 403);
  }

  assertUserVisible(actorUserId, actorRole, targetUser);

  if (!canTransitionRole(actorRole, targetUser.role, nextRole)) {
    throw new AppError('You do not have permission to assign this role transition', 403);
  }

  if (nextRole === 'SUPER_ADMIN') {
    throw new AppError('SUPER_ADMIN assignment is not allowed from this endpoint', 403);
  }

  const updatedUser = await prisma.user.update({
    where: { id: targetUserId },
    data: { role: nextRole },
  });

  return toAuthUserDto(updatedUser);
}

export async function deactivateUserByActor(
  actorUserId: string,
  actorRole: USER_ROLE,
  targetUserId: string,
): Promise<AuthUserDto> {
  return updateUserStatusByActor(actorUserId, actorRole, targetUserId, false);
}

export async function updateUserStatusByActor(
  actorUserId: string,
  actorRole: USER_ROLE,
  targetUserId: string,
  isActive?: boolean,
): Promise<AuthUserDto> {
  const targetUser = await getManagedUserOrThrow(targetUserId);

  if (actorRole === 'ADMIN') {
    assertUserVisible(actorUserId, actorRole, targetUser);
  }

  if (targetUser.role === 'SUPER_ADMIN') {
    throw new AppError('SUPER_ADMIN users cannot have their status changed', 403);
  }

  if (actorUserId === targetUserId) {
    throw new AppError('You cannot change your own status', 403);
  }

  if (actorRole === 'ADMIN' && targetUser.role === 'ADMIN') {
    throw new AppError('ADMIN users cannot change another ADMIN status', 403);
  }

  const nextIsActive = isActive ?? !targetUser.isActive;
  const updatedUser = await prisma.user.update({
    where: { id: targetUserId },
    data: { isActive: nextIsActive },
  });

  return toAuthUserDto(updatedUser);
}
