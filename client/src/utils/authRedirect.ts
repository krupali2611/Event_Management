import type { UserRole } from '@/types/api';

export function getDefaultRouteForRole(role: UserRole): string {
  switch (role) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
      return '/admin';
    case 'ORGANIZER':
      return '/organizer';
    case 'ATTENDEE':
      return '/events';
  }
}

function isAllowedRedirectForRole(role: UserRole, path: string): boolean {
  if (!path.startsWith('/')) {
    return false;
  }

  if (path === '/notifications') {
    return true;
  }

  if (path === '/my-tickets') {
    return role === 'ATTENDEE';
  }

  if (path === '/admin' || path.startsWith('/admin/')) {
    return role === 'ADMIN' || role === 'SUPER_ADMIN';
  }

  if (path === '/organizer' || path.startsWith('/organizer/')) {
    return role === 'ORGANIZER';
  }

  if (path === '/events' || path.startsWith('/events/') || path === '/attendee' || path.startsWith('/attendee/')) {
    return role === 'ATTENDEE';
  }

  return false;
}

export function resolvePostLoginRedirect(role: UserRole, requestedPath?: string | null): string {
  const normalizedPath = requestedPath?.trim();

  if (normalizedPath && isAllowedRedirectForRole(role, normalizedPath)) {
    return normalizedPath;
  }

  return getDefaultRouteForRole(role);
}
