import React, { useEffect, useState } from 'react';
import type { IProductCategory, CreateCategoryDTO, UpdateCategoryDTO } from '@my-pos/shared';
import Modal from '../ui/Modal';

interface ICategoryModalProps {
  /** undefined = create; a category = edit */
  category: IProductCategory | undefined;
  onClose(): void;
  onSaved(): void;
}

interface IForm {
  name: string;
  description: string;
}

/**
 * Modal dialog for creating or editing a product category.
 */
export default function CategoryModal({
  category, onClose, onSaved,
}: ICategoryModalProps): React.JSX.Element {
  const isEdit = category !== undefined;

  const [form, setForm] = useState<IForm>({
    name: category?.name ?? '',
    description: category?.description ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm({ name: category?.name ?? '', description: category?.description ?? '' });
    setError(null);
  }, [category]);

  async function handleSave(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required.'); return; }

    setSaving(true);
    setError(null);

    try {
      if (isEdit && category) {
        const dto: UpdateCategoryDTO = {
          name: form.name.trim(),
          description: form.description.trim() || null,
        };
        const res = await window.api.categories.update(category.id, dto);
        setSaving(false);
        if (res.success) onSaved(); else setError(res.error);
      } else {
        const dto: CreateCategoryDTO = {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
        };
        const res = await window.api.categories.create(dto);
        setSaving(false);
        if (res.success) onSaved(); else setError(res.error);
      }
    } catch (e) {
      setSaving(false);
      setError(e instanceof Error ? e.message : 'Save failed');
    }
  }

  return (
    <Modal title={isEdit ? 'Edit category' : 'Add category'} onClose={onClose} maxWidth="max-w-md">
      <form onSubmit={handleSave} className="space-y-4">

        <div>
          <label className="mb-1.5 block text-[11px] font-medium text-t3">Name *</label>
          <input
            className="input text-sm"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Beverages"
            autoFocus
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-medium text-t3">Description</label>
          <input
            className="input text-sm"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Optional"
          />
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
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add category'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
