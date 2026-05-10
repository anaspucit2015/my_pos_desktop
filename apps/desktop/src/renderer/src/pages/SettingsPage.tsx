import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { UserRole } from '@my-pos/shared';
import type { IUser, UpdateUserDTO } from '@my-pos/shared';
import UserModal from '../components/UserModal/UserModal';
import { Table, TableRow, TableCell } from '../components/ui/Table';

const ROLE_COLOURS: Record<UserRole, { bg: string; fg: string }> = {
  [UserRole.ADMIN]:   { bg: 'rgba(168,130,240,0.12)', fg: '#A882F0' },
  [UserRole.CASHIER]: { bg: 'rgba(93,202,165,0.12)',  fg: '#5DCAA5' },
};

const ICON_COLOURS = [
  'rgba(93,202,165,0.15)',
  'rgba(99,130,240,0.15)',
  'rgba(239,159,39,0.15)',
  'rgba(168,130,240,0.15)',
  'rgba(240,149,149,0.15)',
];

/**
 * Settings page — current user profile + admin user management section.
 */
export default function SettingsPage(): React.JSX.Element {
  const currentUser = useAuthStore((s) => s.currentUser);
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  // ── User list ──────────────────────────────────────────────────────────────
  const [users, setUsers] = useState<IUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  async function loadUsers(): Promise<void> {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const res = await window.api.auth.getAllUsers();
      if (res.success) setUsers(res.data);
      else setUsersError(res.error);
    } catch (e) {
      setUsersError(e instanceof Error ? e.message : 'Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  }

  useEffect(() => { if (isAdmin) loadUsers(); }, [isAdmin]);

  // ── Modal ──────────────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);

  async function handleUserSaved(): Promise<void> {
    setModalOpen(false);
    await loadUsers();
  }

  // ── Toggle active ──────────────────────────────────────────────────────────
  const [togglingId, setTogglingId] = useState<number | null>(null);

  async function handleToggleActive(user: IUser): Promise<void> {
    setTogglingId(user.id);
    try {
      const dto: UpdateUserDTO = { isActive: !user.isActive };
      await window.api.auth.updateUser(user.id, dto);
      await loadUsers();
    } catch (e) {
      setUsersError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="p-5 space-y-4">

      {/* Profile card */}
      <div className="rounded-card border border-line bg-surface-card p-5">
        <h2 className="mb-4 text-sm font-medium text-t1">My profile</h2>
        {currentUser ? (
          <div className="flex items-center gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-base font-semibold"
              style={{ background: ICON_COLOURS[currentUser.id % ICON_COLOURS.length], color: 'var(--t1)' }}
            >
              {currentUser.firstName.charAt(0)}{currentUser.lastName.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-t1">
                {currentUser.firstName} {currentUser.lastName}
              </div>
              <div className="mt-0.5 text-xs text-t3">@{currentUser.username}</div>
            </div>
            <span
              className="rounded-full px-2.5 py-0.5 text-[10px] font-medium"
              style={ROLE_COLOURS[currentUser.role]}
            >
              {currentUser.role}
            </span>
          </div>
        ) : (
          <p className="text-xs text-t3">No active session.</p>
        )}
      </div>

      {/* Team (admin only) */}
      {isAdmin && (
        <div className="rounded-card border border-line bg-surface-card p-5">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <h2 className="text-sm font-medium text-t1">Team</h2>
              <p className="mt-0.5 text-[11px] text-t3">
                {users.length} user{users.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="btn-primary flex items-center gap-1.5 py-1.5 px-3 text-xs"
            >
              + Add user
            </button>
          </div>

          {usersError && (
            <div className="mb-4 rounded-xl px-3 py-2 text-xs"
              style={{ background: 'rgba(240,149,149,0.1)', color: '#F09595' }}>
              {usersError}
            </div>
          )}

          {usersLoading && <p className="py-6 text-center text-xs text-t3">Loading…</p>}

          {!usersLoading && users.length > 0 && (
            <Table columns={['User', 'Username', 'Role', 'Status', '']}>
              {users.map((u) => {
                const isCurrentUser = u.id === currentUser?.id;
                const isToggling = togglingId === u.id;
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold"
                          style={{ background: ICON_COLOURS[u.id % ICON_COLOURS.length], color: 'var(--t1)' }}>
                          {u.firstName.charAt(0)}{u.lastName.charAt(0)}
                        </div>
                        <div className="flex items-center gap-1.5 text-[13px] font-medium text-t1">
                          {u.firstName} {u.lastName}
                          {isCurrentUser && (
                            <span className="rounded-full px-1.5 py-px text-[9px] font-medium"
                              style={{ background: 'rgba(93,202,165,0.12)', color: '#5DCAA5' }}>
                              you
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-t2">@{u.username}</TableCell>
                    <TableCell>
                      <span className="rounded-full px-2.5 py-0.5 text-[10px] font-medium"
                        style={ROLE_COLOURS[u.role]}>
                        {u.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      {u.isActive ? (
                        <span className="rounded-full px-2.5 py-0.5 text-[10px] font-medium"
                          style={{ background: 'rgba(93,202,165,0.12)', color: '#5DCAA5' }}>Active</span>
                      ) : (
                        <span className="rounded-full px-2.5 py-0.5 text-[10px] font-medium"
                          style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--t3)' }}>Inactive</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {!isCurrentUser && (
                        <button onClick={() => handleToggleActive(u)} disabled={isToggling}
                          className="flex items-center gap-1 rounded-lg border bg-transparent px-2.5 py-1 text-[11px] transition-colors hover:bg-surface-hover disabled:opacity-40"
                          style={{
                            borderColor: u.isActive ? 'rgba(240,149,149,0.3)' : 'var(--line)',
                            color: u.isActive ? '#F09595' : 'var(--t2)',
                          }}>
                          {isToggling ? '…' : u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </Table>
          )}
        </div>
      )}

      {modalOpen && (
        <UserModal onClose={() => setModalOpen(false)} onSaved={handleUserSaved} />
      )}
    </div>
  );
}
