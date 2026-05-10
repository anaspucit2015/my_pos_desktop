import React, { useEffect, useState } from 'react';
import type { IProductCategory } from '@my-pos/shared';
import CategoryModal from '../components/CategoryModal/CategoryModal';
import { Table, TableRow, TableCell } from '../components/ui/Table';

/** Pastel colours cycled by category id for the icon cell. */
const ICON_COLOURS = [
  'rgba(93,202,165,0.15)',
  'rgba(99,130,240,0.15)',
  'rgba(239,159,39,0.15)',
  'rgba(168,130,240,0.15)',
  'rgba(240,149,149,0.15)',
];

/**
 * Admin-only page for managing product categories (create, edit, delete).
 */
export default function CategoriesPage(): React.JSX.Element {
  const [categories, setCategories] = useState<IProductCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // ── Modal state ────────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<IProductCategory | undefined>(undefined);

  async function load(): Promise<void> {
    setLoading(true);
    setPageError(null);
    try {
      const res = await window.api.categories.getAll();
      if (res.success) setCategories(res.data);
      else setPageError(res.error);
    } catch (e) {
      setPageError(e instanceof Error ? e.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate(): void {
    setEditingCategory(undefined);
    setModalOpen(true);
  }

  function openEdit(cat: IProductCategory): void {
    setEditingCategory(cat);
    setModalOpen(true);
  }

  function closeModal(): void {
    setModalOpen(false);
    setEditingCategory(undefined);
  }

  async function handleSaved(): Promise<void> {
    closeModal();
    await load();
  }

  async function handleDelete(cat: IProductCategory): Promise<void> {
    if (!confirm(`Delete "${cat.name}"? Products in this category will become uncategorised.`)) return;
    setDeletingId(cat.id);
    try {
      const res = await window.api.categories.delete(cat.id);
      if (res.success) await load();
      else setPageError(res.error);
    } catch (e) {
      setPageError(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="p-5">
      <div className="rounded-card border border-line bg-surface-card p-5">

        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h1 className="text-sm font-medium text-t1">Categories</h1>
            <p className="mt-0.5 text-[11px] text-t3">
              {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}
            </p>
          </div>
          <button
            onClick={openCreate}
            className="btn-primary flex items-center gap-1.5 py-1.5 px-3 text-xs"
          >
            + Add category
          </button>
        </div>

        {/* Page error */}
        {pageError && (
          <div className="mb-4 rounded-xl px-3 py-2 text-xs"
            style={{ background: 'rgba(240,149,149,0.1)', color: '#F09595' }}>
            {pageError}
          </div>
        )}

        {/* Loading */}
        {loading && <p className="py-6 text-center text-xs text-t3">Loading…</p>}

        {/* Empty state */}
        {!loading && categories.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line py-16 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
              style={{ background: 'rgba(93,202,165,0.1)' }}>
              🗂️
            </div>
            <p className="text-sm font-medium text-t1">No categories yet</p>
            <p className="mt-1 mb-5 max-w-xs text-xs text-t3">
              Categories help you organise your products. Create your first one to get started.
            </p>
            <button onClick={openCreate} className="btn-primary py-1.5 px-4 text-xs">
              + Add your first category
            </button>
          </div>
        )}

        {/* Table */}
        {!loading && categories.length > 0 && (
          <Table columns={['Category', 'Description', '']}>
            {categories.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold"
                      style={{ background: ICON_COLOURS[cat.id % ICON_COLOURS.length], color: 'var(--t1)' }}>
                      {cat.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-[13px] font-medium text-t1">{cat.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-t2">
                  {cat.description ?? <span className="text-t3">—</span>}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1.5">
                    <button onClick={() => openEdit(cat)}
                      className="flex items-center gap-1 rounded-lg border border-line bg-transparent px-2.5 py-1 text-[11px] text-t2 transition-colors hover:bg-surface-hover hover:text-t1">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(cat)} disabled={deletingId === cat.id}
                      className="flex items-center gap-1 rounded-lg border bg-transparent px-2.5 py-1 text-[11px] transition-colors hover:bg-surface-hover disabled:opacity-40"
                      style={{ borderColor: 'rgba(240,149,149,0.3)', color: '#F09595' }}>
                      {deletingId === cat.id ? '…' : 'Delete'}
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        )}
      </div>

      {modalOpen && (
        <CategoryModal
          category={editingCategory}
          onClose={closeModal}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
