import React from 'react';
import { X, Minus, Plus } from 'lucide-react';
import type { CartItem as ICartItem } from '../../store/cartStore';
import { useCartStore } from '../../store/cartStore';
import { formatCurrency } from '@my-pos/shared';

interface CartItemProps {
  item: ICartItem;
}

/**
 * A single cart line: product name, unit price, qty controls, line total, remove button.
 */
export default function CartItem({ item }: CartItemProps): React.JSX.Element {
  const { updateQuantity, removeItem } = useCartStore();
  const lineTotal = item.unitPriceInCents * item.quantity - item.discountInCents;

  return (
    <div className="flex items-center gap-2 border-b border-line py-3 last:border-0">
      {/* Name + unit price */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-t1">{item.product.name}</p>
        <p className="text-xs text-t3">{formatCurrency(item.unitPriceInCents)}</p>
      </div>

      {/* Qty controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
          aria-label="Decrease quantity"
          className="flex h-6 w-6 items-center justify-center rounded-full border border-line
                     text-t2 hover:border-line-strong hover:text-t1 transition-colors"
        >
          <Minus size={11} strokeWidth={2} />
        </button>

        <span className="w-6 text-center text-sm font-medium text-t1">{item.quantity}</span>

        <button
          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
          aria-label="Increase quantity"
          className="flex h-6 w-6 items-center justify-center rounded-full border border-line
                     text-t2 hover:border-line-strong hover:text-t1 transition-colors"
        >
          <Plus size={11} strokeWidth={2} />
        </button>
      </div>

      {/* Line total */}
      <span className="w-16 text-right text-sm font-medium text-t1">
        {formatCurrency(lineTotal)}
      </span>

      {/* Remove */}
      <button
        onClick={() => removeItem(item.product.id)}
        aria-label={`Remove ${item.product.name}`}
        className="flex h-5 w-5 items-center justify-center rounded-full text-t3
                   hover:bg-red-500/[0.15] hover:text-red-400 transition-colors"
      >
        <X size={11} strokeWidth={2} />
      </button>
    </div>
  );
}
