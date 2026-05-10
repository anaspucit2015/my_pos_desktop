import React from 'react';
import { useCartStore } from '../../store/cartStore';
import { formatCurrency } from '@my-pos/shared';

/**
 * Displays subtotal, tax, optional discount, and the final total.
 */
export default function CartSummary(): React.JSX.Element {
  const store = useCartStore();
  const subtotal = store.subtotal();
  const tax      = store.tax();
  const discount = store.discountInCents;
  const total    = store.total();

  return (
    <div className="space-y-2 pt-3 text-sm">
      <div className="flex justify-between text-t2">
        <span>Subtotal</span>
        <span>{formatCurrency(subtotal)}</span>
      </div>

      <div className="flex justify-between text-t2">
        <span>Tax (8%)</span>
        <span>{formatCurrency(tax)}</span>
      </div>

      {discount > 0 && (
        <div className="flex justify-between text-emerald-400">
          <span>Discount</span>
          <span>−{formatCurrency(discount)}</span>
        </div>
      )}

      <div className="flex justify-between border-t border-line pt-2 text-base font-medium text-t1">
        <span>Total</span>
        <span className="text-accent">{formatCurrency(total)}</span>
      </div>
    </div>
  );
}
