import React, { useMemo, useState } from 'react';
import { formatCurrency, OrderStatus } from '@my-pos/shared';
import type { IOrder } from '@my-pos/shared';
import { useSales } from '../hooks/useSales';
import { Table, TableRow, TableCell, TableRowExpanded } from '../components/ui/Table';
import OrderDetailModal from '../components/OrderDetailModal/OrderDetailModal';

// ── Status badge config ───────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  PENDING:   { bg: 'rgba(99,130,240,0.12)',  fg: '#6382F0', label: 'Pending'   },
  COMPLETED: { bg: 'rgba(93,202,165,0.12)',  fg: '#5DCAA5', label: 'Completed' },
  VOIDED:    { bg: 'rgba(240,149,149,0.12)', fg: '#F09595', label: 'Voided'    },
  REFUNDED:  { bg: 'rgba(239,159,39,0.12)',  fg: '#EF9F27', label: 'Refunded'  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBillId(id: number): string {
  return `#${String(id).padStart(4, '0')}`;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/**
 * Sales History page.
 * Shows all orders (bills) with incremental bill IDs, search/filter, and clickable detail + return flow.
 */
export default function SalesPage(): React.JSX.Element {
  const { orders, loading, error, reload } = useSales();

  // ── Filters ─────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return orders.filter((o) => {
      if (statusFilter && o.status !== statusFilter) return false;
      if (methodFilter) {
        const hasMethod = o.payments.some((p) => p.method === methodFilter);
        if (!hasMethod) return false;
      }
      if (q) {
        const billId = formatBillId(o.id).toLowerCase();
        const orderNum = o.orderNumber.toLowerCase();
        const customerName = o.customer
          ? `${o.customer.firstName} ${o.customer.lastName}`.toLowerCase()
          : '';
        if (!billId.includes(q) && !orderNum.includes(q) && !customerName.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [orders, search, statusFilter, methodFilter]);

  // ── Stats ────────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total: orders.length,
    completed: orders.filter((o) => o.status === OrderStatus.COMPLETED).length,
    voided: orders.filter((o) => o.status === OrderStatus.VOIDED).length,
    refunded: orders.filter((o) => o.status === OrderStatus.REFUNDED).length,
    revenue: orders
      .filter((o) => o.status === OrderStatus.COMPLETED || o.status === OrderStatus.REFUNDED)
      .reduce((sum, o) => sum + o.totalInCents, 0),
  }), [orders]);

  // ── Detail modal ─────────────────────────────────────────────────────────────
  const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null);

  async function handleOrderUpdated(): Promise<void> {
    setSelectedOrder(null);
    await reload();
  }

  return (
    <div className="p-5">
      <div className="rounded-card border border-line bg-surface-card p-5">

        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h1 className="text-sm font-medium text-t1">Sales History</h1>
            <p className="mt-0.5 text-[11px] text-t3">
              {orders.length} bill{orders.length !== 1 ? 's' : ''} total
            </p>
          </div>
          <button onClick={reload} className="btn-secondary flex items-center gap-1.5 py-1.5 px-3 text-xs">
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="mb-4 grid grid-cols-5 gap-2.5">
          <StatCard label="Total bills" value={String(stats.total)} colour="text-t1" />
          <StatCard label="Completed" value={String(stats.completed)} colour="text-[#5DCAA5]" />
          <StatCard label="Voided" value={String(stats.voided)} colour="text-[#F09595]" />
          <StatCard label="Refunded" value={String(stats.refunded)} colour="text-[#EF9F27]" />
          <StatCard label="Net revenue" value={formatCurrency(stats.revenue)} colour="text-[#5DCAA5]" />
        </div>

        {/* Filters */}
        <div className="mb-3.5 flex gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-t3" width="14" height="14"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              className="input pl-8 text-xs py-2"
              placeholder="Search bill #, order number, customer…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input w-auto cursor-pointer text-xs py-2 text-t2"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="VOIDED">Voided</option>
            <option value="REFUNDED">Refunded</option>
          </select>
          <select
            className="input w-auto cursor-pointer text-xs py-2 text-t2"
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
          >
            <option value="">All payment methods</option>
            <option value="CASH">Cash</option>
            <option value="CARD">Card</option>
          </select>
        </div>

        {/* Loading / error */}
        {loading && <p className="py-6 text-center text-xs text-t3">Loading…</p>}
        {!loading && error && (
          <div className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-[#F09595]">{error}</div>
        )}

        {/* Table */}
        {!loading && !error && (
          <Table columns={[
            { label: 'Bill #', className: 'w-16' },
            'Date',
            'Customer',
            'Items',
            'Total',
            'Payment',
            'Status',
            { label: 'Actions', className: 'w-20' },
          ]}>
            {filtered.map((order) => {
              const s = STATUS_STYLE[order.status] ?? STATUS_STYLE['PENDING'];
              const method = order.payments[0]?.method ?? '—';
              const customerName = order.customer
                ? `${order.customer.firstName} ${order.customer.lastName}`
                : <span className="text-t3">Guest</span>;

              return (
                <TableRow key={order.id}>
                  <TableCell>
                    <span className="font-mono text-xs font-semibold text-accent">
                      {formatBillId(order.id)}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-t2 whitespace-nowrap">
                    {formatDate(order.createdAt)}
                  </TableCell>
                  <TableCell className="text-xs text-t2">{customerName}</TableCell>
                  <TableCell className="text-xs text-t2">
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                  </TableCell>
                  <TableCell className="text-xs font-medium text-t1">
                    {formatCurrency(order.totalInCents)}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-t2">
                      {method === 'CASH' ? 'Cash' : method === 'CARD' ? 'Card' : method}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className="inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-medium"
                      style={{ background: s.bg, color: s.fg }}
                    >
                      {s.label}
                    </span>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="rounded-lg border border-line bg-transparent px-2.5 py-1 text-[11px] text-t2 transition-colors hover:bg-surface-hover hover:text-t1"
                    >
                      View
                    </button>
                  </TableCell>
                </TableRow>
              );
            })}

            {filtered.length === 0 && (
              <TableRowExpanded colSpan={8}>
                <p className="py-6 text-center text-xs text-t3">
                  {orders.length === 0 ? 'No sales recorded yet.' : 'No bills match your filters.'}
                </p>
              </TableRowExpanded>
            )}
          </Table>
        )}
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdated={handleOrderUpdated}
        />
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface IStatCardProps { label: string; value: string; colour: string }

function StatCard({ label, value, colour }: IStatCardProps): React.JSX.Element {
  return (
    <div className="rounded-xl border border-line bg-surface-card p-3">
      <div className="mb-1.5 text-[11px] text-t3">{label}</div>
      <div className={`text-base font-medium ${colour}`}>{value}</div>
    </div>
  );
}
