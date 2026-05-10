import React, { useEffect, useMemo, useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useAuthStore } from '../store/authStore';
import { formatCurrency, UserRole } from '@my-pos/shared';
import type { IProduct, IProductCategory } from '@my-pos/shared';
import ProductModal from '../components/ProductModal/ProductModal';
import { Table, TableRow, TableCell, TableRowExpanded } from '../components/ui/Table';

/** Pastel background colours cycled by product id for the icon cell. */
const ICON_COLOURS = [
  'rgba(93,202,165,0.15)',
  'rgba(239,159,39,0.15)',
  'rgba(99,130,240,0.15)',
  'rgba(240,149,149,0.15)',
  'rgba(168,130,240,0.15)',
];

function iconColour(id: number): string {
  return ICON_COLOURS[id % ICON_COLOURS.length];
}

/** Stock-bar fill colour based on stock state. */
function stockColour(qty: number, threshold: number): string {
  if (qty === 0) return '#F09595';
  if (qty <= threshold) return '#EF9F27';
  return '#5DCAA5';
}

/** Fraction of the bar to fill (capped at 1). */
function stockFraction(qty: number, threshold: number): number {
  const max = Math.max(threshold * 4, 30);
  return Math.min(qty / max, 1);
}

/**
 * Inventory management page — redesigned dark-card layout.
 * Preserves all existing data logic (adjust stock, add/edit/delete products).
 */
export default function InventoryPage(): React.JSX.Element {
  const { products, loading, error, reload } = useProducts();
  const currentUser = useAuthStore((s) => s.currentUser);
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  // ── Categories ─────────────────────────────────────────────────────────────
  const [categories, setCategories] = useState<IProductCategory[]>([]);
  useEffect(() => {
    window.api.categories?.getAll().then((res) => {
      if (res.success) setCategories(res.data);
    });
  }, []);

  // ── Filter state ───────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const q = search.toLowerCase();
      if (q && !p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false;
      if (categoryFilter && p.category?.name !== categoryFilter) return false;
      if (stockFilter === 'in' && (p.stockQuantity === 0 || p.stockQuantity <= p.lowStockThreshold)) return false;
      if (stockFilter === 'low' && !(p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold)) return false;
      if (stockFilter === 'out' && p.stockQuantity !== 0) return false;
      return true;
    });
  }, [products, search, categoryFilter, stockFilter]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total: products.length,
    inStock: products.filter((p) => p.stockQuantity > p.lowStockThreshold).length,
    low: products.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold).length,
    out: products.filter((p) => p.stockQuantity === 0).length,
  }), [products]);

  // ── Modal ──────────────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<IProduct | undefined>(undefined);

  function openCreate(): void {
    setEditingProduct(undefined);
    setModalOpen(true);
  }
  function openEdit(product: IProduct): void {
    setEditingProduct(product);
    setModalOpen(true);
  }
  function closeModal(): void {
    setModalOpen(false);
    setEditingProduct(undefined);
  }
  async function handleSaved(): Promise<void> {
    closeModal();
    await reload();
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDelete(product: IProduct): Promise<void> {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    setDeletingId(product.id);
    setDeleteError(null);
    const res = await window.api.products.delete(product.id);
    setDeletingId(null);
    if (res.success) {
      await reload();
    } else {
      setDeleteError(res.error);
    }
  }

  // ── Adjust / Restock ───────────────────────────────────────────────────────
  const [adjustingId, setAdjustingId] = useState<number | null>(null);
  const [delta, setDelta] = useState('');
  const [reason, setReason] = useState('');
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [adjusting, setAdjusting] = useState(false);

  function openRestock(product: IProduct): void {
    setAdjustingId(adjustingId === product.id ? null : product.id);
    setAdjustError(null);
    setDelta('');
    setReason('');
  }

  async function handleAdjust(productId: number): Promise<void> {
    if (!currentUser) return;
    const d = parseInt(delta, 10);
    if (isNaN(d) || d === 0) { setAdjustError('Enter a non-zero integer.'); return; }
    if (!reason.trim()) { setAdjustError('Enter a reason.'); return; }

    setAdjusting(true);
    setAdjustError(null);
    const res = await window.api.inventory.adjustStock(productId, d, currentUser.id, reason);
    setAdjusting(false);

    if (res.success) {
      setAdjustingId(null);
      setDelta('');
      setReason('');
      await reload();
    } else {
      setAdjustError(res.error);
    }
  }

  const categoryNames = useMemo(
    () => Array.from(new Set(products.map((p) => p.category?.name).filter(Boolean) as string[])),
    [products],
  );

  return (
    <div className="p-5">
      {/* ── Card wrapper ─────────────────────────────────────────────────── */}
      <div className="rounded-card border border-line bg-surface-card p-5">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h1 className="text-sm font-medium text-t1">Inventory</h1>
            <p className="mt-0.5 text-[11px] text-t3">
              {products.length} product{products.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={reload} className="btn-secondary flex items-center gap-1.5 py-1.5 px-3 text-xs">
              Refresh
            </button>
            {isAdmin && (
              <button onClick={openCreate} className="btn-primary flex items-center gap-1.5 py-1.5 px-3 text-xs">
                + Add product
              </button>
            )}
          </div>
        </div>

        {/* ── Stats row ───────────────────────────────────────────────────── */}
        <div className="mb-4 grid grid-cols-4 gap-2.5">
          <StatCard label="Total products" value={String(stats.total)} valueColour="text-t1" />
          <StatCard label="In stock" value={String(stats.inStock)} valueColour="text-[#5DCAA5]" />
          <StatCard label="Low stock" value={String(stats.low)} valueColour="text-[#EF9F27]" />
          <StatCard label="Out of stock" value={String(stats.out)} valueColour="text-[#F09595]" />
        </div>

        {/* ── Filters ─────────────────────────────────────────────────────── */}
        <div className="mb-3.5 flex gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-t3"
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              className="input pl-8 text-xs py-2"
              placeholder="Search products or SKU…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Category filter */}
          <select
            className="input w-auto cursor-pointer text-xs py-2 text-t2"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All categories</option>
            {categoryNames.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Stock filter */}
          <select
            className="input w-auto cursor-pointer text-xs py-2 text-t2"
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
          >
            <option value="">All stock</option>
            <option value="in">In stock</option>
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
          </select>
        </div>

        {/* ── Error banners ────────────────────────────────────────────────── */}
        {deleteError && (
          <div className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-[#F09595]">{deleteError}</div>
        )}
        {loading && <p className="py-6 text-center text-xs text-t3">Loading…</p>}
        {!loading && error && (
          <div className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-[#F09595]">{error}</div>
        )}

        {/* ── Table ───────────────────────────────────────────────────────── */}
        {!loading && !error && (
          <Table columns={[
            'Product', 'Category', 'Price',
            { label: 'Stock level', className: 'min-w-[140px]' },
            'Status',
            { label: 'Actions', className: 'min-w-[160px]' },
          ]}>
            {filtered.map((product) => {
              const isOut = product.stockQuantity === 0;
              const isLow = !isOut && product.stockQuantity <= product.lowStockThreshold;
              const isRestocking = adjustingId === product.id;
              const isDeleting = deletingId === product.id;
              const colour = stockColour(product.stockQuantity, product.lowStockThreshold);
              const fraction = stockFraction(product.stockQuantity, product.lowStockThreshold);

              return (
                <React.Fragment key={product.id}>
                  <TableRow>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-medium"
                          style={{ background: iconColour(product.id), color: 'var(--t1)' }}>
                          {product.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-[13px] font-medium text-t1">{product.name}</div>
                          <div className="text-[10px] text-t3">{product.sku}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-t2">
                      {product.category?.name ?? <span className="text-t3">—</span>}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-[#5DCAA5]">
                      {formatCurrency(product.priceInCents)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${fraction * 100}%`, background: colour }} />
                        </div>
                        <span className="min-w-[24px] text-right text-xs" style={{ color: colour }}>
                          {product.stockQuantity}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {isOut ? (
                        <StatusBadge label="Out of stock" bg="rgba(240,149,149,0.12)" fg="#F09595" />
                      ) : isLow ? (
                        <StatusBadge label="Low stock" bg="rgba(239,159,39,0.12)" fg="#EF9F27" />
                      ) : (
                        <StatusBadge label="In stock" bg="rgba(93,202,165,0.12)" fg="#5DCAA5" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {isAdmin && <ActionButton onClick={() => openEdit(product)}>Edit</ActionButton>}
                        <ActionButton onClick={() => openRestock(product)}
                          activeColour={isOut ? '#F09595' : isLow ? '#EF9F27' : undefined}
                          active={isRestocking}>
                          Restock
                        </ActionButton>
                        {isAdmin && (
                          <ActionButton onClick={() => handleDelete(product)}
                            disabled={isDeleting} activeColour="#F09595">
                            {isDeleting ? '…' : 'Delete'}
                          </ActionButton>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>

                  {isRestocking && (
                    <TableRowExpanded colSpan={6}>
                      <div className="flex items-end gap-2.5">
                        <div>
                          <label className="mb-1 block text-[10px] font-medium text-t3">Delta</label>
                          <input type="number" value={delta}
                            onChange={(e) => setDelta(e.target.value)}
                            placeholder="+10 or -5" className="input w-24 py-1.5 text-xs" />
                        </div>
                        <div className="flex-1">
                          <label className="mb-1 block text-[10px] font-medium text-t3">Reason</label>
                          <input type="text" value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g. Restock, Shrinkage" className="input py-1.5 text-xs" />
                        </div>
                        <button onClick={() => handleAdjust(product.id)} disabled={adjusting}
                          className="btn-primary py-1.5 px-3 text-xs">
                          {adjusting ? 'Saving…' : 'Save'}
                        </button>
                        <button onClick={() => { setAdjustingId(null); setAdjustError(null); }}
                          className="btn-secondary py-1.5 px-3 text-xs">
                          Cancel
                        </button>
                      </div>
                      {adjustError && <p className="mt-1.5 text-[10px] text-[#F09595]">{adjustError}</p>}
                    </TableRowExpanded>
                  )}
                </React.Fragment>
              );
            })}

            {filtered.length === 0 && (
              <TableRowExpanded colSpan={6}>
                <p className="py-6 text-center text-xs text-t3">
                  {products.length === 0
                    ? isAdmin ? 'No products yet. Click "Add product" to create one.' : 'No products found.'
                    : 'No products match your filters.'}
                </p>
              </TableRowExpanded>
            )}
          </Table>
        )}
      </div>

      {modalOpen && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          onClose={closeModal}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

// ── Small sub-components ────────────────────────────────────────────────────

interface IStatCardProps {
  label: string;
  value: string;
  valueColour: string;
}

/** A single stat card in the top summary row. */
function StatCard({ label, value, valueColour }: IStatCardProps): React.JSX.Element {
  return (
    <div className="rounded-xl border border-line bg-surface-card p-3">
      <div className="mb-1.5 text-[11px] text-t3">{label}</div>
      <div className={`text-lg font-medium ${valueColour}`}>{value}</div>
    </div>
  );
}

interface IStatusBadgeProps {
  label: string;
  bg: string;
  fg: string;
}

/** Coloured pill badge for stock status. */
function StatusBadge({ label, bg, fg }: IStatusBadgeProps): React.JSX.Element {
  return (
    <span
      className="inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-medium"
      style={{ background: bg, color: fg }}
    >
      {label}
    </span>
  );
}

interface IActionButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  activeColour?: string;
  active?: boolean;
}

/** Small ghost action button in the table row. */
function ActionButton({ children, onClick, disabled, activeColour, active }: IActionButtonProps): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1 rounded-lg border border-line bg-transparent px-2.5 py-1 text-[11px] text-t2 transition-colors hover:bg-surface-hover hover:text-t1 disabled:opacity-40"
      style={
        active || activeColour
          ? {
              borderColor: activeColour ? `${activeColour}44` : 'var(--line)',
              color: active && activeColour ? activeColour : activeColour ?? 'var(--t2)',
            }
          : undefined
      }
    >
      {children}
    </button>
  );
}
