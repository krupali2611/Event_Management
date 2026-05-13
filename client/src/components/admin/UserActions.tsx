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

function getRoleActionTooltip(currentUserRole: UserRole, user: UserListItem): string {
  if (canEditRole(currentUserRole, user)) {
    return 'Change Role';
  }

  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
    return 'Role changes are disabled for admin accounts';
  }

  return 'Role change is not available';
}

function getStatusActionTooltip(currentUserId: string, currentUserRole: UserRole, user: UserListItem, toggleLabel: string): string {
  if (currentUserId === user.id) {
    return 'You cannot deactivate yourself';
  }

  if (canToggleStatus(currentUserId, currentUserRole, user)) {
    return toggleLabel;
  }

  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
    return 'Status changes are disabled for admin accounts';
  }

  return 'Status change is not available';
}

function Tooltip({ label }: { label: string }) {
  return (
    <div className="pointer-events-none absolute -top-11 left-1/2 z-10 -translate-x-1/2 scale-95 rounded-xl bg-[#071B4D] px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-xl shadow-[#071B4D]/25 transition duration-200 group-hover:scale-100 group-hover:opacity-100">
      {label}
    </div>
  );
}

function UserActions({ currentUserId, currentUserRole, user, onChangeRole, onToggleStatus, statusUpdating }: UserActionsProps) {
  const canEdit = canEditRole(currentUserRole, user);
  const canToggle = canToggleStatus(currentUserId, currentUserRole, user);
  const isActive = user.status === 'ACTIVE';
  const toggleLabel = isActive ? 'Deactivate User' : 'Activate User';

  return (
    <div className="flex items-center gap-2">
      <div className="group relative">
        <Button
          onClick={() => onChangeRole(user)}
          disabled={!canEdit}
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-2xl border border-[#E2E8F0] bg-white text-[#64748B] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#BFDBFE] hover:bg-[#EFF6FF] hover:text-[#2563FF] hover:shadow-[0_10px_24px_rgba(37,99,255,0.16)]"
          icon={<Pencil className="h-4 w-4" />}
          aria-label={`Change role for ${user.name}`}
        >
          <span className="sr-only">Change role</span>
        </Button>
        <Tooltip label={getRoleActionTooltip(currentUserRole, user)} />
      </div>

      <div className="group relative">
        <Button
          onClick={() => onToggleStatus(user)}
          disabled={!canToggle || statusUpdating}
          variant="ghost"
          size="icon"
          className={`h-10 w-10 rounded-2xl border shadow-sm transition-all duration-300 hover:-translate-y-0.5 ${
            isActive
              ? 'border-rose-200 bg-rose-50 text-rose-600 hover:border-rose-300 hover:bg-rose-100 hover:shadow-[0_10px_24px_rgba(244,63,94,0.18)]'
              : 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:border-emerald-300 hover:bg-emerald-100 hover:shadow-[0_10px_24px_rgba(16,185,129,0.18)]'
          }`}
          icon={statusUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
          aria-label={`${toggleLabel} for ${user.name}`}
        >
          <span className="sr-only">{toggleLabel}</span>
        </Button>
        <Tooltip label={getStatusActionTooltip(currentUserId, currentUserRole, user, toggleLabel)} />
      </div>
    </div>
  );
}

export default UserActions;
