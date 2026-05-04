import { Pencil, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import type { UserRole } from '@/types/api';
import type { UserListItem } from '@/types/user.types';

interface UserActionsProps {
  currentUserRole: UserRole;
  user: UserListItem;
  onChangeRole: (user: UserListItem) => void;
  onDelete: (user: UserListItem) => void;
}

function canEditRole(currentUserRole: UserRole, user: UserListItem): boolean {
  if (currentUserRole === 'SUPER_ADMIN') {
    return user.role !== 'SUPER_ADMIN';
  }

  return user.role === 'ATTENDEE' || user.role === 'ORGANIZER';
}

function canDelete(currentUserRole: UserRole, user: UserListItem): boolean {
  return currentUserRole === 'SUPER_ADMIN' && user.role !== 'SUPER_ADMIN';
}

function UserActions({ currentUserRole, user, onChangeRole, onDelete }: UserActionsProps) {
  return (
    <div className="flex items-center gap-2">
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
      {currentUserRole === 'SUPER_ADMIN' ? (
        <Button
          onClick={() => onDelete(user)}
          disabled={!canDelete(currentUserRole, user)}
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
          icon={<Trash2 className="h-4 w-4" />}
          aria-label={`Delete ${user.name}`}
        >
          <span className="sr-only">Delete</span>
        </Button>
      ) : null}
    </div>
  );
}

export default UserActions;
