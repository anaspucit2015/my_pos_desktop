import React, { useEffect, useState } from 'react';
import type { IProduct, IProductCategory, CreateProductDTO, UpdateProductDTO } from '@my-pos/shared';
import Modal from '../ui/Modal';

interface ProductModalProps {
  /** undefined = create new; a product = edit existing */
  product: IProduct | undefined;
  categories: IProductCategory[];
  onClose(): void;
  onSaved(): void;
}

interface FormState {
  name: string;
  sku: string;
  barcode: string;
  description: string;
  categoryId: string;
  priceDisplay: string;
  costDisplay: string;
  stockQuantity: string;
  lowStockThreshold: string;
}

function toFormState(product?: IProduct): FormState {
  if (!product) {
    return {
      name: '', sku: '', barcode: '', description: '',
      categoryId: '', priceDisplay: '', costDisplay: '',
      stockQuantity: '0', lowStockThreshold: '10',
    };
  }
  return {
    name: product.name,
    sku: product.sku,
    barcode: product.barcode ?? '',
    description: product.description ?? '',
    categoryId: product.categoryId != null ? String(product.categoryId) : '',
    priceDisplay: (product.priceInCents / 100).toFixed(2),
    costDisplay: (product.costInCents / 100).toFixed(2),
    stockQuantity: String(product.stockQuantity),
    lowStockThreshold: String(product.lowStockThreshold),
  };
}

function parseCents(value: string): number | null {
  const n = parseFloat(value);
  if (isNaN(n) || n < 0) return null;
  return Math.round(n * 100);
}

/**
 * Modal dialog for creating or editing a product.
 */
export default function ProductModal({
  product, categories, onClose, onSaved,
}: ProductModalProps): React.JSX.Element {
  const isEdit = product !== undefined;
  const [form, setForm] = useState<FormState>(() => toFormState(product));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(toFormState(product));
    setError(null);
  }, [product]);

  function set(field: keyof FormState, value: string): void {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);

    const priceInCents = parseCents(form.priceDisplay);
    const costInCents = parseCents(form.costDisplay);
    const stockQuantity = parseInt(form.stockQuantity, 10);
    const lowStockThreshold = parseInt(form.lowStockThreshold, 10);

    if (!form.name.trim())                                     { setError('Name is required.'); return; }
    if (!form.sku.trim())                                      { setError('SKU is required.'); return; }
    if (priceInCents === null)                                 { setError('Enter a valid price (e.g. 4.99).'); return; }
    if (costInCents === null)                                  { setError('Enter a valid cost (e.g. 1.50).'); return; }
    if (isNaN(stockQuantity) || stockQuantity < 0)            { setError('Stock must be a non-negative integer.'); return; }
    if (isNaN(lowStockThreshold) || lowStockThreshold < 0)    { setError('Low-stock threshold must be a non-negative integer.'); return; }

    const categoryId = form.categoryId ? parseInt(form.categoryId, 10) : undefined;
    setSaving(true);

    if (isEdit && product) {
      const dto: UpdateProductDTO = {
        name: form.name.trim(), sku: form.sku.trim(),
        barcode: form.barcode.trim() || undefined,
        description: form.description.trim() || undefined,
        categoryId: categoryId ?? null,
        priceInCents, costInCents, stockQuantity, lowStockThreshold,
      };
      const res = await window.api.products.update(product.id, dto);
      setSaving(false);
      if (res.success) onSaved(); else setError(res.error);
    } else {
      const dto: CreateProductDTO = {
        name: form.name.trim(), sku: form.sku.trim(),
        barcode: form.barcode.trim() || undefined,
        description: form.description.trim() || undefined,
        categoryId, priceInCents, costInCents, stockQuantity, lowStockThreshold,
      };
      const res = await window.api.products.create(dto);
      setSaving(false);
      if (res.success) onSaved(); else setError(res.error);
    }
  }

  return (
    <Modal title={isEdit ? 'Edit product' : 'Add product'} onClose={onClose}>
      <form onSubmit={handleSave} className="space-y-4">

        {/* Name + SKU */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name *">
            <input className="input text-sm" value={form.name}
              onChange={(e) => set('name', e.target.value)} placeholder="Espresso" autoFocus />
          </Field>
          <Field label="SKU *">
            <input className="input text-sm" value={form.sku}
              onChange={(e) => set('sku', e.target.value)} placeholder="BEV-001" />
          </Field>
        </div>

        {/* Barcode + Category */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Barcode">
            <input className="input text-sm" value={form.barcode}
              onChange={(e) => set('barcode', e.target.value)} placeholder="Optional" />
          </Field>
          <Field label="Category">
            <select className="input text-sm cursor-pointer" value={form.categoryId}
              onChange={(e) => set('categoryId', e.target.value)}>
              <option value="">— None —</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
            </select>
          </Field>
        </div>

        {/* Description */}
        <Field label="Description">
          <input className="input text-sm" value={form.description}
            onChange={(e) => set('description', e.target.value)} placeholder="Optional" />
        </Field>

        {/* Price + Cost */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Price ($) *">
            <input className="input text-sm" type="number" step="0.01" min="0"
              value={form.priceDisplay}
              onChange={(e) => set('priceDisplay', e.target.value)} placeholder="4.99" />
          </Field>
          <Field label="Cost ($) *">
            <input className="input text-sm" type="number" step="0.01" min="0"
              value={form.costDisplay}
              onChange={(e) => set('costDisplay', e.target.value)} placeholder="1.50" />
          </Field>
        </div>

        {/* Stock + Threshold */}
        <div className="grid grid-cols-2 gap-3">
          <Field label={isEdit ? 'Stock quantity *' : 'Initial stock *'}>
            <input className="input text-sm" type="number" min="0"
              value={form.stockQuantity}
              onChange={(e) => set('stockQuantity', e.target.value)} />
          </Field>
          <Field label="Low-stock threshold *">
            <input className="input text-sm" type="number" min="0"
              value={form.lowStockThreshold}
              onChange={(e) => set('lowStockThreshold', e.target.value)} />
          </Field>
        </div>

        {error && (
          <div className="rounded-xl px-3 py-2 text-xs"
            style={{ background: 'rgba(240,149,149,0.1)', color: '#F09595' }}>
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <button type="button" onClick={onClose} className="btn-secondary py-2 px-4 text-sm">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary py-2 px-4 text-sm">
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add product'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-medium text-t3">{label}</label>
      {children}
    </div>
  );
}
