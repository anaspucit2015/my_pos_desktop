import React, { useState } from 'react';
import type { CreateUserDTO } from '@my-pos/shared';
import { UserRole } from '@my-pos/shared';
import Modal from '../ui/Modal';

interface IUserModalProps {
  onClose(): void;
  onSaved(): void;
}

interface IForm {
  firstName: string;
  lastName: string;
  username: string;
  pin: string;
  confirmPin: string;
  role: UserRole;
}

const EMPTY: IForm = {
  firstName: '', lastName: '', username: '',
  pin: '', confirmPin: '', role: UserRole.CASHIER,
};

/**
 * Modal dialog for creating a new user (admin or cashier).
 */
export default function UserModal({ onClose, onSaved }: IUserModalProps): React.JSX.Element {
  const [form, setForm] = useState<IForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof IForm>(field: K, value: IForm[K]): void {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!form.firstName.trim()) { setError('First name is required.'); return; }
    if (!form.lastName.trim())  { setError('Last name is required.'); return; }
    if (!form.username.trim())  { setError('Username is required.'); return; }
    if (!form.pin.trim())       { setError('PIN is required.'); return; }
    if (form.pin !== form.confirmPin) { setError('PINs do not match.'); return; }

    setSaving(true);
    setError(null);

    try {
      const dto: CreateUserDTO = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        username: form.username.trim(),
        pin: form.pin,
        role: form.role,
      };
      const res = await window.api.auth.createUser(dto);
      setSaving(false);
      if (res.success) onSaved(); else setError(res.error);
    } catch (e) {
      setSaving(false);
      setError(e instanceof Error ? e.message : 'Failed to create user');
    }
  }

  return (
    <Modal title="Add user" onClose={onClose} maxWidth="max-w-md">
      <form onSubmit={handleSave} className="space-y-4">

        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-t3">First name *</label>
            <input className="input text-sm" value={form.firstName}
              onChange={(e) => set('firstName', e.target.value)} placeholder="Jane" autoFocus />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-t3">Last name *</label>
            <input className="input text-sm" value={form.lastName}
              onChange={(e) => set('lastName', e.target.value)} placeholder="Doe" />
          </div>
        </div>

        {/* Username + Role */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-t3">Username *</label>
            <input className="input text-sm" value={form.username}
              onChange={(e) => set('username', e.target.value)} placeholder="jane.doe" />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-t3">Role</label>
            <select className="input text-sm cursor-pointer" value={form.role}
              onChange={(e) => set('role', e.target.value as UserRole)}>
              <option value={UserRole.CASHIER}>Cashier</option>
              <option value={UserRole.ADMIN}>Admin</option>
            </select>
          </div>
        </div>

        {/* PIN row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-t3">PIN *</label>
            <input className="input text-sm tracking-widest" type="password"
              inputMode="numeric" maxLength={6} value={form.pin}
              onChange={(e) => set('pin', e.target.value)} placeholder="••••" />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-t3">Confirm PIN *</label>
            <input className="input text-sm tracking-widest" type="password"
              inputMode="numeric" maxLength={6} value={form.confirmPin}
              onChange={(e) => set('confirmPin', e.target.value)} placeholder="••••" />
          </div>
        </div>

        {error && (
          <div className="rounded-xl px-3 py-2 text-xs"
            style={{ background: 'rgba(240,149,149,0.1)', color: '#F09595' }}>
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <button type="button" onClick={onClose} className="btn-secondary py-2 px-4 text-sm">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary py-2 px-4 text-sm">
            {saving ? 'Creating…' : 'Create user'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
