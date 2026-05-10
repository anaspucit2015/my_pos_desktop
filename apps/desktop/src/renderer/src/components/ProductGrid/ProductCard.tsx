import React from 'react';
import { Plus } from 'lucide-react';
import type { IProduct } from '@my-pos/shared';
import { formatCurrency } from '@my-pos/shared';
import { useCartStore } from '../../store/cartStore';

interface ProductCardProps {
  product: IProduct;
}

/** Deterministic icon-circle color based on categoryId. */
const ICON_PALETTES = [
  'bg-sky-500/[0.15] text-sky-400',
  'bg-violet-500/[0.15] text-violet-400',
  'bg-amber-500/[0.15] text-amber-400',
  'bg-rose-500/[0.15] text-rose-400',
  'bg-emerald-500/[0.15] text-emerald-400',
  'bg-orange-500/[0.15] text-orange-400',
] as const;

function stockState(qty: number, threshold: number): 'in' | 'low' | 'out' {
  if (qty === 0) return 'out';
  if (qty <= threshold) return 'low';
  return 'in';
}

/**
 * A tappable product tile with icon, name, subtitle, price, stock badge, and an add button.
 * Clicking anywhere on the card (except the + button) also adds one unit.
 */
export default function ProductCard({ product }: ProductCardProps): React.JSX.Element {
  const addItem = useCartStore((s) => s.addItem);
  const state = stockState(product.stockQuantity, product.lowStockThreshold);
  const palette = ICON_PALETTES[(product.categoryId ?? 0) % ICON_PALETTES.length];
  const iconLetter = (product.category?.name ?? product.name).charAt(0).toUpperCase();

  const isDisabled = state === 'out';

  return (
    <div
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      aria-disabled={isDisabled}
      onClick={() => !isDisabled && addItem(product)}
      onKeyDown={(e) => e.key === 'Enter' && !isDisabled && addItem(product)}
      className={`relative flex flex-col gap-3 rounded-card border border-line bg-surface-card p-3
                  transition-colors select-none
                  ${isDisabled
                    ? 'cursor-not-allowed opacity-40'
                    : 'cursor-pointer hover:bg-surface-hover hover:border-line-strong active:scale-[0.985]'
                  }`}
    >
      {/* Stock badge — positioned top-right */}
      <span
        className={`absolute right-2.5 top-2.5 rounded-pill px-2 py-0.5 text-[10px] font-medium ${
          state === 'in'  ? 'bg-emerald-500/[0.15] text-emerald-400' :
          state === 'low' ? 'bg-amber-500/[0.15]   text-amber-400'   :
                            'bg-red-500/[0.15]     text-red-400'
        }`}
      >
        {state === 'in' ? 'In Stock' : state === 'low' ? 'Low' : 'Out'}
      </span>

      {/* Category icon circle */}
      {product.imageUrl ? (
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-10 w-10 rounded-input object-cover"
        />
      ) : (
        <div className={`flex h-10 w-10 items-center justify-center rounded-input text-sm font-medium ${palette}`}>
          {iconLetter}
        </div>
      )}

      {/* Name + subtitle */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-t1 leading-snug">{product.name}</p>
        {product.description && (
          <p className="truncate text-xs text-t3 mt-0.5">{product.description}</p>
        )}
      </div>

      {/* Price row + add button */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-accent">
          {formatCurrency(product.priceInCents)}
        </span>

        <button
          onClick={(e) => { e.stopPropagation(); if (!isDisabled) addItem(product); }}
          disabled={isDisabled}
          aria-label={`Add ${product.name} to cart`}
          className="flex h-6 w-6 items-center justify-center rounded-full bg-accent
                     text-accent-fg hover:opacity-90 active:opacity-80
                     disabled:cursor-not-allowed disabled:opacity-40 transition-opacity"
        >
          <Plus size={13} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
