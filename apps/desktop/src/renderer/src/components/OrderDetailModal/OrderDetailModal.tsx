import React, { useState } from 'react';
import { formatCurrency, OrderStatus } from '@my-pos/shared';
import type { IOrder } from '@my-pos/shared';
import ReturnModal from '../ReturnModal/ReturnModal';

interface IOrderDetailModalProps {
  order: IOrder;
  onClose: () => void;
  onUpdated: () => void;
}

const STATUS_STYLE: Record<OrderStatus, { bg: string; fg: string; label: string }> = {
  [OrderStatus.PENDING]:   { bg: 'rgba(99,130,240,0.12)',   fg: '#6382F0', label: 'Pending'   },
  [OrderStatus.COMPLETED]: { bg: 'rgba(93,202,165,0.12)',   fg: '#5DCAA5', label: 'Completed' },
  [OrderStatus.VOIDED]:    { bg: 'rgba(240,149,149,0.12)',  fg: '#F09595', label: 'Voided'    },
  [OrderStatus.REFUNDED]:  { bg: 'rgba(239,159,39,0.12)',   fg: '#EF9F27', label: 'Refunded'  },
};

/**
 * Full detail view for a single order.
 * Shows items, payment, customer, and allows processing a return.
 */
export default function OrderDetailModal({ order, onClose, onUpdated }: IOrderDetailModalProps): React.JSX.Element {
  const [showReturn, setShowReturn] = useState(false);
  const status = STATUS_STYLE[order.status] ?? STATUS_STYLE[OrderStatus.PENDING];

  const canReturn = order.status === OrderStatus.COMPLETED || order.status === OrderStatus.REFUNDED;

  const paymentMethod = order.payments[0]?.method ?? '—';
  const paymentMethodLabel = paymentMethod === 'CASH' ? 'Cash' : paymentMethod === 'CARD' ? 'Card' : paymentMethod;

  const customerName = order.customer
    ? `${order.customer.firstName} ${order.customer.lastName}`
    : null;

  function handleReturnProcessed(): void {
    setShowReturn(false);
    onUpdated();
  }

  if (showReturn) {
    return <ReturnModal order={order} onClose={() => setShowReturn(false)} onProcessed={handleReturnProcessed} />;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface-nav shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-start justify-between border-b border-line px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-t1">
                Bill #{String(order.id).padStart(4, '0')}
              </h2>
              <span
                className="inline-block rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{ background: status.bg, color: status.fg }}
              >
                {status.label}
              </span>
            </div>
            <p className="text-[10px] text-t3 mt-0.5">{order.orderNumber}</p>
          </div>
          <button onClick={onClose} className="text-t3 hover:text-t1 transition-colors text-lg leading-none">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Meta row */}
          <div className="grid grid-cols-2 gap-3">
            <MetaCard label="Date" value={new Date(order.createdAt).toLocaleString()} />
            <MetaCard label="Payment" value={paymentMethodLabel} />
            {customerName && <MetaCard label="Customer" value={customerName} />}
            {order.payments[0]?.changeInCents != null && (
              <MetaCard label="Change given" value={formatCurrency(order.payments[0].changeInCents)} />
            )}
          </div>

          {/* Items */}
          <div>
            <p className="mb-2 text-[11px] font-medium text-t3 uppercase tracking-wide">Items</p>
            <div className="space-y-1.5">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl border border-line bg-surface px-3 py-2">
                  <div className="flex-1 min-w-0 mr-2">
                    <div className="text-[12px] font-medium text-t1 truncate">
                      {item.product?.name ?? `Product #${item.productId}`}
                    </div>
                    <div className="text-[10px] text-t3">
                      {formatCurrency(item.unitPriceInCents)} × {item.quantity}
                    </div>
                  </div>
                  <span className="text-xs font-medium text-t1">{formatCurrency(item.subtotalInCents)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="rounded-xl border border-line bg-surface-hover px-4 py-3 space-y-1.5">
            <TotalRow label="Subtotal" value={formatCurrency(order.subtotalInCents)} />
            {order.discountInCents > 0 && (
              <TotalRow label="Discount" value={`−${formatCurrency(order.discountInCents)}`} valueColor="text-[#EF9F27]" />
            )}
            <TotalRow label="Tax" value={formatCurrency(order.taxInCents)} />
            <div className="border-t border-line my-1" />
            <TotalRow label="Total" value={formatCurrency(order.totalInCents)} bold />
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-4">
          <button onClick={onClose} className="btn-secondary py-2 px-4 text-xs">Close</button>
          {canReturn && (
            <button
              onClick={() => setShowReturn(true)}
              className="rounded-xl border border-[#EF9F2744] bg-[#EF9F2710] px-4 py-2 text-xs font-medium text-[#EF9F27] hover:bg-[#EF9F2720] transition-colors"
            >
              Process Return
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface IMetaCardProps { label: string; value: string }

function MetaCard({ label, value }: IMetaCardProps): React.JSX.Element {
  return (
    <div className="rounded-xl border border-line bg-surface-hover px-3 py-2">
      <div className="text-[10px] text-t3 mb-0.5">{label}</div>
      <div className="text-[12px] font-medium text-t1">{value}</div>
    </div>
  );
}

interface ITotalRowProps { label: string; value: string; valueColor?: string; bold?: boolean }

function TotalRow({ label, value, valueColor, bold }: ITotalRowProps): React.JSX.Element {
  return (
    <div className={`flex justify-between text-xs ${bold ? 'font-semibold text-t1' : 'text-t2'}`}>
      <span>{label}</span>
      <span className={valueColor}>{value}</span>
    </div>
  );
}
