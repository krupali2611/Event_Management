import type { PropsWithChildren } from 'react';
import type { UserRole } from '@/types/api';

interface BadgeProps extends PropsWithChildren {
  className?: string;
  color?: 'slate' | 'blue' | 'purple' | 'red' | 'green' | 'amber';
  role?: UserRole;
}

type BadgeColor = NonNullable<BadgeProps['color']>;

function getRoleColor(role: UserRole): BadgeColor {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'red';
    case 'ADMIN':
      return 'purple';
    case 'ORGANIZER':
      return 'blue';
    case 'ATTENDEE':
      return 'slate';
  }

  return 'slate';
}

function getColorClass(color: BadgeColor): string {
  switch (color) {
    case 'blue':
      return 'bg-blue-100 text-blue-700 ring-blue-200';
    case 'purple':
      return 'bg-purple-100 text-purple-700 ring-purple-200';
    case 'red':
      return 'bg-red-100 text-red-700 ring-red-200';
    case 'green':
      return 'bg-emerald-100 text-emerald-700 ring-emerald-200';
    case 'amber':
      return 'bg-amber-100 text-amber-700 ring-amber-200';
    case 'slate':
      return 'bg-slate-200 text-slate-700 ring-slate-300';
  }
}

function Badge({ children, className = '', color = 'slate', role }: BadgeProps) {
  const resolvedColor: BadgeColor = role ? getRoleColor(role) : color;

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${getColorClass(resolvedColor)} ${className}`}>
      {children ?? role}
    </span>
  );
}

export default Badge;
