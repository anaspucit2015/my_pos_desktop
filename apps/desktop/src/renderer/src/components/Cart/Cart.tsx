import React, { useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { formatCurrency } from '@my-pos/shared';
import CartItem from './CartItem';
import CartSummary from './CartSummary';
import PaymentModal from '../PaymentModal/PaymentModal';

/**
 * Right-hand cart panel: cashier header, item list, totals, and charge button.
 * Fixed width — the parent layout controls sizing.
 */
export default function Cart(): React.JSX.Element {
  const { items, heldCarts, holdCart, resumeCart, clearCart, total } = useCartStore();
  const currentUser = useAuthStore((s) => s.currentUser);
  const [showPayment, setShowPayment] = useState(false);

  const isEmpty = items.length === 0;
  const initials =
    ((currentUser?.firstName?.[0] ?? '') + (currentUser?.lastName?.[0] ?? '')).toUpperCase() || '?';
  const cashierName = currentUser
    ? `${currentUser.firstName} ${currentUser.lastName}`
    : 'Cashier';

  return (
    <div className="flex h-full flex-col border-l border-line bg-surface-nav">

      {/* ── Cashier header ───────────────────────────────────── */}
      <div className="flex-shrink-0 border-b border-line px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center
                          rounded-full bg-accent/20 text-accent text-xs font-medium select-none">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-t1">{cashierName}</p>
            <p className="text-xs text-t3">Cashier</p>
          </div>

          {/* Hold / resume / clear controls */}
          <div className="ml-auto flex items-center gap-2">
            {heldCarts.length > 0 && (
              <button
                onClick={() => resumeCart(0)}
                className="rounded-pill border border-line px-2.5 py-0.5 text-[11px]
                           text-accent hover:bg-surface-hover transition-colors"
              >
                Resume ({heldCarts.length})
              </button>
            )}
            {!isEmpty && (
              <>
                <button
                  onClick={holdCart}
                  className="rounded-pill border border-line px-2.5 py-0.5 text-[11px]
                             text-t2 hover:bg-surface-hover transition-colors"
                >
                  Hold
                </button>
                <button
                  onClick={clearCart}
                  className="rounded-pill border border-red-500/30 px-2.5 py-0.5 text-[11px]
                             text-red-400 hover:bg-red-500/[0.08] transition-colors"
                >
                  Clear
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Items list ───────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4">
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-card">
              <ShoppingBag size={20} strokeWidth={1.5} className="text-t3" />
            </div>
            <p className="text-sm text-t3">No items yet</p>
            <p className="text-xs text-t3">Tap a product to add it</p>
          </div>
        ) : (
          items.map((item) => <CartItem key={item.product.id} item={item} />)
        )}
      </div>

      {/* ── Summary + charge button ──────────────────────────── */}
      <div className="flex-shrink-0 border-t border-line px-4 pb-5 pt-3">
        <CartSummary />

        <button
          onClick={() => setShowPayment(true)}
          disabled={isEmpty}
          className="btn-primary mt-4 w-full py-3 text-sm"
        >
          Charge {!isEmpty && formatCurrency(total())}
        </button>
      </div>

      {showPayment && <PaymentModal onClose={() => setShowPayment(false)} />}
    </div>
  );
}
