import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { PaymentMethod, formatCurrency } from '@my-pos/shared';
import type { PaymentDTO, IOrder, ICustomer } from '@my-pos/shared';
import { useCartStore } from '../../store/cartStore';
import { useCart } from '../../hooks/useCart';

interface PaymentModalProps {
  onClose(): void;
}

type Tab = 'cash' | 'card';

/**
 * Full-screen overlay modal with cash and card payment tabs.
 * On success shows a receipt with bill number and product details.
 */
export default function PaymentModal({ onClose }: PaymentModalProps): React.JSX.Element {
  const store = useCartStore();
  const { checkout } = useCart();
  const total = store.total();

  const [tab, setTab]               = useState<Tab>('cash');
  const [tendered, setTendered]     = useState('');
  const [txRef, setTxRef]           = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [receipt, setReceipt]       = useState<IOrder | null>(null);

  // ── Customer search ─────────────────────────────────────────────────────────
  const [customers, setCustomers]           = useState<ICustomer[]>([]);
  const [customerQuery, setCustomerQuery]   = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(null);
  const [showDropdown, setShowDropdown]     = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.api.customers.getAll().then((res) => {
      if (res.success) setCustomers(res.data);
    });
  }, []);

  const filteredCustomers = useMemo(() => {
    const q = customerQuery.toLowerCase();
    if (!q) return customers.slice(0, 6);
    return customers
      .filter((c) =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
        (c.email ?? '').toLowerCase().includes(q),
      )
      .slice(0, 6);
  }, [customers, customerQuery]);

  function selectCustomer(c: ICustomer): void {
    setSelectedCustomer(c);
    setCustomerQuery(`${c.firstName} ${c.lastName}`);
    setShowDropdown(false);
  }

  function clearCustomer(): void {
    setSelectedCustomer(null);
    setCustomerQuery('');
  }

  const tenderedCents = Math.round(parseFloat(tendered || '0') * 100);
  const changeCents   = tenderedCents - total;

  const handleSubmit = async (): Promise<void> => {
    setError(null);
    setProcessing(true);

    let payment: PaymentDTO;

    if (tab === 'cash') {
      if (tenderedCents < total) {
        setError('Tendered amount is less than the total.');
        setProcessing(false);
        return;
      }
      payment = { method: PaymentMethod.CASH, amountInCents: total, tenderedInCents: tenderedCents };
    } else {
      if (!txRef.trim()) {
        setError('Enter the card transaction reference.');
        setProcessing(false);
        return;
      }
      payment = { method: PaymentMethod.CARD, amountInCents: total, transactionRef: txRef.trim() };
    }

    const result = await checkout(payment, selectedCustomer?.id);
    if ('error' in result) {
      setError(result.error);
      setProcessing(false);
      return;
    }

    // Fetch the completed order to display the receipt
    const orderRes = await window.api.orders.getById(result.orderId);
    if (orderRes.success) {
      setReceipt(orderRes.data);
    } else {
      // Fallback: just close if fetch fails
      onClose();
    }
    setProcessing(false);
  };

  // ── Receipt / success view ──────────────────────────────────────────────────
  if (receipt) {
    const paymentRow = receipt.payments[0];
    const changeGiven = paymentRow?.changeInCents ?? null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="card w-full max-w-md bg-surface-nav p-6 shadow-2xl flex flex-col max-h-[90vh]">

          {/* Success header */}
          <div className="mb-5 flex flex-col items-center text-center">
            <CheckCircle size={36} className="text-[#5DCAA5] mb-2" strokeWidth={1.5} />
            <h2 className="text-base font-semibold text-t1">Payment Complete</h2>
            <p className="text-[11px] text-t3 mt-0.5">
              Bill #{String(receipt.id).padStart(4, '0')} — {receipt.orderNumber}
            </p>
            {selectedCustomer && (
              <p className="text-[11px] text-accent mt-1">
                {selectedCustomer.firstName} {selectedCustomer.lastName}
              </p>
            )}
          </div>

          {/* Change banner (cash only) */}
          {changeGiven != null && changeGiven > 0 && (
            <div className="mb-4 flex justify-between rounded-input border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-2.5 text-sm font-medium text-emerald-400">
              <span>Change</span>
              <span>{formatCurrency(changeGiven)}</span>
            </div>
          )}

          {/* Items */}
          <div className="flex-1 overflow-y-auto space-y-1.5 mb-4">
            {receipt.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl border border-line bg-surface-hover px-3 py-2">
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

          {/* Totals */}
          <div className="rounded-xl border border-line bg-surface-hover px-4 py-3 space-y-1.5 mb-5">
            <div className="flex justify-between text-xs text-t2">
              <span>Subtotal</span><span>{formatCurrency(receipt.subtotalInCents)}</span>
            </div>
            {receipt.discountInCents > 0 && (
              <div className="flex justify-between text-xs text-[#EF9F27]">
                <span>Discount</span><span>−{formatCurrency(receipt.discountInCents)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs text-t2">
              <span>Tax</span><span>{formatCurrency(receipt.taxInCents)}</span>
            </div>
            <div className="border-t border-line my-1" />
            <div className="flex justify-between text-sm font-semibold text-t1">
              <span>Total</span><span>{formatCurrency(receipt.totalInCents)}</span>
            </div>
          </div>

          <button onClick={onClose} className="btn-primary w-full py-2.5 text-sm">
            New Sale
          </button>
        </div>
      </div>
    );
  }

  // ── Payment entry view ──────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="card w-full max-w-md bg-surface-nav p-6 shadow-2xl">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-base font-medium text-t1">Payment</h2>
          <button
            onClick={onClose}
            aria-label="Close payment modal"
            className="flex h-7 w-7 items-center justify-center rounded-full text-t3
                       hover:bg-surface-hover hover:text-t1 transition-colors"
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>

        {/* Amount due */}
        <div className="mb-6 rounded-card border border-accent/20 bg-accent/[0.08] p-4 text-center">
          <p className="text-xs text-t2 mb-1">Amount Due</p>
          <p className="text-3xl font-medium text-accent">{formatCurrency(total)}</p>
        </div>

        {/* Customer (optional) */}
        <div className="mb-5 relative" ref={dropdownRef}>
          <label className="mb-1.5 block text-xs font-medium text-t2">
            Customer <span className="text-t3 font-normal">(optional)</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={customerQuery}
              onChange={(e) => { setCustomerQuery(e.target.value); setShowDropdown(true); setSelectedCustomer(null); }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              placeholder="Search by name or email…"
              className="input pr-8 text-sm"
            />
            {selectedCustomer && (
              <button
                onClick={clearCustomer}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-t3 hover:text-t1 transition-colors"
              >
                <X size={13} />
              </button>
            )}
          </div>
          {showDropdown && filteredCustomers.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-input border border-line bg-surface-nav shadow-lg overflow-hidden">
              {filteredCustomers.map((c) => (
                <button
                  key={c.id}
                  onMouseDown={() => selectCustomer(c)}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-surface-hover transition-colors"
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/20 text-[10px] font-medium text-accent">
                    {c.firstName[0]}{c.lastName[0]}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-t1">{c.firstName} {c.lastName}</div>
                    {c.email && <div className="text-[10px] text-t3">{c.email}</div>}
                  </div>
                  <div className="ml-auto text-[10px] text-t3">{c.loyaltyPoints} pts</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tab switcher */}
        <div className="mb-6 flex rounded-input border border-line bg-surface-card p-1">
          {(['cash', 'card'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-[6px] py-1.5 text-sm font-medium capitalize transition-colors ${
                tab === t
                  ? 'bg-accent text-accent-fg'
                  : 'text-t2 hover:text-t1'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Cash tab */}
        {tab === 'cash' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="tendered" className="mb-1.5 block text-xs font-medium text-t2">
                Amount Tendered ($)
              </label>
              <input
                id="tendered"
                type="number"
                min="0"
                step="0.01"
                value={tendered}
                onChange={(e) => setTendered(e.target.value)}
                placeholder="0.00"
                className="input text-right text-lg font-medium"
              />
            </div>

            {tenderedCents >= total && tenderedCents > 0 && (
              <div className="flex justify-between rounded-input border border-emerald-500/20
                              bg-emerald-500/[0.08] px-4 py-2 text-sm font-medium text-emerald-400">
                <span>Change</span>
                <span>{formatCurrency(changeCents)}</span>
              </div>
            )}

            <div className="grid grid-cols-4 gap-2">
              {[500, 1000, 2000, 5000].map((cents) => (
                <button
                  key={cents}
                  onClick={() => setTendered((cents / 100).toFixed(2))}
                  className="btn-secondary py-1 text-xs"
                >
                  {formatCurrency(cents)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Card tab */}
        {tab === 'card' && (
          <div>
            <label htmlFor="txRef" className="mb-1.5 block text-xs font-medium text-t2">
              Transaction Reference
            </label>
            <input
              id="txRef"
              type="text"
              value={txRef}
              onChange={(e) => setTxRef(e.target.value)}
              placeholder="e.g. TXN-1234567890"
              className="input"
            />
          </div>
        )}

        {error && (
          <p className="mt-3 rounded-input border border-red-500/20 bg-red-500/[0.08]
                        px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={processing}
          className="btn-primary mt-6 w-full py-3 text-sm"
        >
          {processing ? 'Processing…' : 'Confirm Payment'}
        </button>
      </div>
    </div>
  );
}
