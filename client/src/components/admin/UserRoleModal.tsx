import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import type { UserRole } from '@/types/api';
import type { UserListItem } from '@/types/user.types';

interface UserRoleModalProps {
  currentUserRole: UserRole;
  user: UserListItem | null;
  submitting: boolean;
  onClose: () => void;
  onConfirm: (role: UserRole) => void;
}

function getAvailableRoles(currentUserRole: UserRole, targetRole: UserRole): UserRole[] {
  if (currentUserRole === 'ADMIN') {
    if (targetRole === 'ATTENDEE') {
      return ['ORGANIZER'];
    }

    if (targetRole === 'ORGANIZER') {
      return ['ATTENDEE'];
    }

    return [];
  }

  switch (targetRole) {
    case 'ATTENDEE':
      return ['ORGANIZER', 'ADMIN'];
    case 'ORGANIZER':
      return ['ATTENDEE', 'ADMIN'];
    case 'ADMIN':
      return ['ORGANIZER'];
    case 'SUPER_ADMIN':
      return [];
  }
}

function UserRoleModal({ currentUserRole, user, submitting, onClose, onConfirm }: UserRoleModalProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');

  useEffect(() => {
    if (!user) {
      setSelectedRole('');
      return;
    }

    const [firstRole] = getAvailableRoles(currentUserRole, user.role);
    setSelectedRole(firstRole ?? '');
  }, [currentUserRole, user]);

  if (!user) {
    return null;
  }

  const availableRoles = getAvailableRoles(currentUserRole, user.role);

  return (
    <Modal
      eyebrow="Change Role"
      title={user.name}
      description={`Current role: ${user.role}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!selectedRole || availableRoles.length === 0 || submitting}
            onClick={() => selectedRole && onConfirm(selectedRole)}
          >
            {submitting ? 'Saving...' : 'Confirm'}
          </Button>
        </>
      }
    > 
      {availableRoles.length === 0 ? (
        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          No valid role changes are allowed for this user.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Confirm the new role before saving. Backend permissions will still be enforced after submission.
          </div>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">New role</span>
            <select
              value={selectedRole}
              onChange={(event) => setSelectedRole(event.target.value as UserRole)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white"
            >
              {availableRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
    </Modal>
  );
}

export default UserRoleModal;
