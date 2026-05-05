import { Loader2, Pencil, Power } from 'lucide-react';
import Button from '@/components/ui/Button';
import type { UserRole } from '@/types/api';
import type { UserListItem } from '@/types/user.types';

interface UserActionsProps {
  currentUserId: string;
  currentUserRole: UserRole;
  user: UserListItem;
  onChangeRole: (user: UserListItem) => void;
  onToggleStatus: (user: UserListItem) => void;
  statusUpdating: boolean;
}

function canEditRole(currentUserRole: UserRole, user: UserListItem): boolean {
  if (currentUserRole === 'SUPER_ADMIN') {
    return user.role !== 'SUPER_ADMIN';
  }

  return user.role === 'ATTENDEE' || user.role === 'ORGANIZER';
}

function canToggleStatus(currentUserId: string, currentUserRole: UserRole, user: UserListItem): boolean {
  if (currentUserId === user.id) {
    return false;
  }

  if (currentUserRole === 'SUPER_ADMIN') {
    return user.role !== 'SUPER_ADMIN';
  }

  return user.role === 'ATTENDEE' || user.role === 'ORGANIZER';
}

function Tooltip({ label }: { label: string }) {
  return (
    <div className="pointer-events-none absolute -top-11 left-1/2 -translate-x-1/2 scale-95 rounded-xl bg-slate-950 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition duration-200 group-hover:scale-100 group-hover:opacity-100">
      {label}
    </div>
  );
}

function UserActions({ currentUserId, currentUserRole, user, onChangeRole, onToggleStatus, statusUpdating }: UserActionsProps) {
  const canToggle = canToggleStatus(currentUserId, currentUserRole, user);
  const isActive = user.status === 'ACTIVE';
  const toggleLabel = isActive ? 'Deactivate User' : 'Activate User';

  return (
    <div className="flex items-center gap-2">
      <div className="group relative">
        <Button
          onClick={() => onChangeRole(user)}
          disabled={!canEditRole(currentUserRole, user)}
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          icon={<Pencil className="h-4 w-4" />}
          aria-label={`Change role for ${user.name}`}
        >
          <span className="sr-only">Change role</span>
        </Button>
        <Tooltip label="Change Role" />
      </div>

      <div className="group relative">
        <Button
          onClick={() => onToggleStatus(user)}
          disabled={!canToggle || statusUpdating}
          variant="ghost"
          size="icon"
          className={`h-9 w-9 rounded-lg border transition ${
            isActive
              ? 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'
              : 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
          }`}
          icon={statusUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
          aria-label={`${toggleLabel} for ${user.name}`}
        >
          <span className="sr-only">{toggleLabel}</span>
        </Button>
        <Tooltip label={currentUserId === user.id ? 'You cannot deactivate yourself' : toggleLabel} />
      </div>
    </div>
  );
}

export default UserActions;
