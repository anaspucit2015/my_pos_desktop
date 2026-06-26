import React, { useState } from 'react';
import { formatCurrency, ReturnReason, RefundMethod } from '@my-pos/shared';
import type { IOrder, IOrderItem, CreateReturnDTO } from '@my-pos/shared';
import { useAuthStore } from '../../store/authStore';

interface IReturnModalProps {
  order: IOrder;
  onClose: () => void;
  onProcessed: () => void;
}

const REASON_LABELS: Record<ReturnReason, string> = {
  [ReturnReason.DEFECTIVE]: 'Defective / Damaged',
  [ReturnReason.WRONG_ITEM]: 'Wrong Item',
  [ReturnReason.CUSTOMER_REQUEST]: 'Customer Request',
  [ReturnReason.OTHER]: 'Other',
};

const REFUND_METHOD_LABELS: Record<RefundMethod, string> = {
  [RefundMethod.CASH]: 'Cash',
  [RefundMethod.CARD_CREDIT]: 'Card Credit',
  [RefundMethod.STORE_CREDIT]: 'Store Credit',
};

/**
 * Modal for processing a return on a completed order.
 * Allows the cashier to select items to return, choose a reason and refund method.
 */
export default function ReturnModal({ order, onClose, onProcessed }: IReturnModalProps): React.JSX.Element {
  const currentUser = useAuthStore((s) => s.currentUser);

  // ── Item selection ──────────────────────────────────────────────────────────
  const [quantities, setQuantities] = useState<Record<number, number>>(() => {
    const init: Record<number, number> = {};
    for (const item of order.items) init[item.id] = 0;
    return init;
  });

  function setQty(itemId: number, value: number, max: number): void {
    setQuantities((prev) => ({ ...prev, [itemId]: Math.max(0, Math.min(value, max)) }));
  }

  const selectedItems = order.items.filter((i) => (quantities[i.id] ?? 0) > 0);

  const refundTotal = selectedItems.reduce((sum, item) => {
    const qty = quantities[item.id] ?? 0;
    return sum + item.unitPriceInCents * qty;
  }, 0);

  // ── Form fields ─────────────────────────────────────────────────────────────
  const [reason, setReason] = useState<ReturnReason>(ReturnReason.CUSTOMER_REQUEST);
  const [refundMethod, setRefundMethod] = useState<RefundMethod>(RefundMethod.CASH);
  const [notes, setNotes] = useState('');

  // ── Submission ──────────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(): Promise<void> {
    if (!currentUser) return;
    if (selectedItems.length === 0) {
      setSubmitError('Select at least one item to return.');
      return;
    }

    const dto: CreateReturnDTO = {
      originalOrderId: order.id,
      cashierId: currentUser.id,
      reason,
      refundMethod,
      notes: notes.trim() || undefined,
      items: selectedItems.map((item) => ({
        orderItemId: item.id,
        productId: item.productId,
        quantityReturned: quantities[item.id] ?? 0,
        unitPriceInCents: item.unitPriceInCents,
      })),
      refundAmountInCents: refundTotal,
    };

    setSubmitting(true);
    setSubmitError(null);
    const res = await window.api.returns.process(dto);
    setSubmitting(false);

    if (res.success) {
      onProcessed();
    } else {
      setSubmitError(res.error);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-line bg-surface-nav shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-t1">Process Return</h2>
            <p className="text-[11px] text-t3 mt-0.5">Bill #{String(order.id).padStart(4, '0')} — {order.orderNumber}</p>
          </div>
          <button onClick={onClose} className="text-t3 hover:text-t1 transition-colors text-lg leading-none">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Item selection */}
          <div>
            <p className="mb-2 text-[11px] font-medium text-t3 uppercase tracking-wide">Select items to return</p>
            <div className="space-y-2">
              {order.items.map((item: IOrderItem) => {
                const qty = quantities[item.id] ?? 0;
                return (
                  <div key={item.id} className="flex items-center justify-between rounded-xl border border-line bg-surface-hover px-3 py-2.5">
                    <div className="flex-1 min-w-0 mr-3">
                      <div className="text-[13px] font-medium text-t1 truncate">
                        {item.product?.name ?? `Product #${item.productId}`}
                      </div>
                      <div className="text-[10px] text-t3">
                        {formatCurrency(item.unitPriceInCents)} × {item.quantity} sold
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setQty(item.id, qty - 1, item.quantity)}
                        disabled={qty === 0}
                        className="flex h-6 w-6 items-center justify-center rounded-lg border border-line text-t2 hover:bg-surface-hover hover:text-t1 disabled:opacity-30 text-xs transition-colors"
                      >−</button>
                      <span className="w-5 text-center text-xs font-medium text-t1">{qty}</span>
                      <button
                        onClick={() => setQty(item.id, qty + 1, item.quantity)}
                        disabled={qty === item.quantity}
                        className="flex h-6 w-6 items-center justify-center rounded-lg border border-line text-t2 hover:bg-surface-hover hover:text-t1 disabled:opacity-30 text-xs transition-colors"
                      >+</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-t3 uppercase tracking-wide">Reason</label>
            <select
              className="input w-full text-xs py-2 text-t1"
              value={reason}
              onChange={(e) => setReason(e.target.value as ReturnReason)}
            >
              {Object.values(ReturnReason).map((r) => (
                <option key={r} value={r}>{REASON_LABELS[r]}</option>
              ))}
            </select>
          </div>

          {/* Refund method */}
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-t3 uppercase tracking-wide">Refund Method</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(RefundMethod).map((m) => (
                <button
                  key={m}
                  onClick={() => setRefundMethod(m)}
                  className={`rounded-xl border py-2 text-[11px] font-medium transition-colors ${
                    refundMethod === m
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-line bg-transparent text-t2 hover:bg-surface-hover hover:text-t1'
                  }`}
                >
                  {REFUND_METHOD_LABELS[m]}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-t3 uppercase tracking-wide">Notes (optional)</label>
            <input
              className="input w-full text-xs py-2"
              placeholder="Additional notes…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Error */}
          {submitError && (
            <div className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-[#F09595]">{submitError}</div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-line px-5 py-4">
          <div>
            <p className="text-[10px] text-t3">Refund amount</p>
            <p className="text-base font-semibold text-[#5DCAA5]">{formatCurrency(refundTotal)}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-secondary py-2 px-4 text-xs">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={submitting || selectedItems.length === 0}
              className="btn-primary py-2 px-4 text-xs disabled:opacity-50"
            >
              {submitting ? 'Processing…' : 'Confirm Return'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
