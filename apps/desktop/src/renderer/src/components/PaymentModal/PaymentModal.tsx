import React, { useState } from 'react';
import { X } from 'lucide-react';
import { PaymentMethod } from '@my-pos/shared';
import type { PaymentDTO } from '@my-pos/shared';
import { useCartStore } from '../../store/cartStore';
import { useCart } from '../../hooks/useCart';
import { formatCurrency } from '@my-pos/shared';

interface PaymentModalProps {
  onClose(): void;
}

type Tab = 'cash' | 'card';

/**
 * Full-screen overlay modal with cash and card payment tabs.
 * On success it clears the cart and closes itself.
 */
export default function PaymentModal({ onClose }: PaymentModalProps): React.JSX.Element {
  const store = useCartStore();
  const { checkout } = useCart();
  const total = store.total();

  const [tab, setTab]             = useState<Tab>('cash');
  const [tendered, setTendered]   = useState('');
  const [txRef, setTxRef]         = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError]         = useState<string | null>(null);

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

    const result = await checkout(payment);
    if ('error' in result) {
      setError(result.error);
      setProcessing(false);
      return;
    }
    onClose();
  };

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
