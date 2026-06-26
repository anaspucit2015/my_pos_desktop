import React, { useEffect, useState } from 'react';
import { formatCurrency } from '@my-pos/shared';
import { Download } from 'lucide-react';

const today = new Date().toISOString().split('T')[0] ?? '';

/** Format a date string as a human-readable label. */
function fmtDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

/**
 * Reports page — daily summary, top products and revenue by category.
 * Loads all three sections together from a shared date range.
 */
export default function ReportsPage(): React.JSX.Element {
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);

  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [byCategory, setByCategory] = useState<CategoryRevenue[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadAll(fromDate: string, toDate: string): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      const [summaryRes, topRes, catRes] = await Promise.all([
        window.api.reports.getRangeSummary(fromDate, toDate),
        window.api.reports.getTopProducts(fromDate, toDate, 8),
        window.api.reports.getRevenueByCategory(fromDate, toDate),
      ]);

      if (!summaryRes.success) { setError(summaryRes.error); return; }
      if (!topRes.success)     { setError(topRes.error);     return; }
      if (!catRes.success)     { setError(catRes.error);     return; }

      setSummary(summaryRes.data);
      setTopProducts(topRes.data);
      setByCategory(catRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }

  /** Download a CSV string as a file in the browser. */
  function downloadCsv(filename: string, csv: string): void {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  /** Export orders in the selected date range as a Sales History CSV. */
  async function exportSalesHistory(): Promise<void> {
    const res = await window.api.orders.getAll();
    if (!res.success) { setError(res.error); return; }

    const fromMs = new Date(from + 'T00:00:00').getTime();
    const toMs   = new Date(to   + 'T23:59:59').getTime();

    const orders = res.data.filter((o) => {
      const t = new Date(o.createdAt).getTime();
      return t >= fromMs && t <= toMs;
    });

    const rows: string[] = [
      ['Bill #', 'Date', 'Customer', 'Items', 'Subtotal', 'Tax', 'Discount', 'Total', 'Payment Method', 'Status'].join(','),
    ];

    for (const o of orders) {
      const billNo   = `#${String(o.id).padStart(4, '0')}`;
      const date     = new Date(o.createdAt).toLocaleString();
      const customer = o.customer ? `"${o.customer.firstName} ${o.customer.lastName}"` : '';
      const items    = `"${o.items.map((i) => `${i.quantity}× ${i.product?.name ?? `#${i.productId}`}`).join('; ')}"`;
      const subtotal = (o.subtotalInCents / 100).toFixed(2);
      const tax      = (o.taxInCents      / 100).toFixed(2);
      const discount = (o.discountInCents / 100).toFixed(2);
      const total    = (o.totalInCents    / 100).toFixed(2);
      const method   = o.paymentMethod ?? '';
      const status   = o.status;
      rows.push([billNo, `"${date}"`, customer, items, subtotal, tax, discount, total, method, status].join(','));
    }

    downloadCsv(`sales-history-${from}-to-${to}.csv`, rows.join('\n'));
  }

  /** Export a full multi-section report as CSV. */
  function exportFullReport(): void {
    if (!summary) return;

    const lines: string[] = [];

    lines.push('SUMMARY');
    lines.push(['Metric', 'Value'].join(','));
    lines.push(['Period',           `"${fmtDate(from)} — ${fmtDate(to)}"`].join(','));
    lines.push(['Total Revenue',    (summary.totalRevenueInCents   / 100).toFixed(2)].join(','));
    lines.push(['Completed Orders', String(summary.completedOrders)].join(','));
    lines.push(['Voided Orders',    String(summary.voidedOrders)].join(','));
    lines.push(['Average Order',    (summary.averageOrderInCents   / 100).toFixed(2)].join(','));
    lines.push(['Tax Collected',    (summary.totalTaxInCents       / 100).toFixed(2)].join(','));
    lines.push(['Total Discounts',  (summary.totalDiscountInCents  / 100).toFixed(2)].join(','));
    lines.push('');

    lines.push('TOP PRODUCTS');
    lines.push(['Rank', 'Product', 'SKU', 'Qty Sold', 'Revenue'].join(','));
    topProducts.forEach((p, i) => {
      lines.push([i + 1, `"${p.name}"`, p.sku, p.quantitySold, (p.revenueInCents / 100).toFixed(2)].join(','));
    });
    lines.push('');

    lines.push('REVENUE BY CATEGORY');
    lines.push(['Category', 'Orders', 'Revenue'].join(','));
    byCategory.forEach((c) => {
      lines.push([`"${c.categoryName}"`, c.orderCount, (c.revenueInCents / 100).toFixed(2)].join(','));
    });

    downloadCsv(`full-report-${from}-to-${to}.csv`, lines.join('\n'));
  }

  // Auto-load today on mount
  useEffect(() => { loadAll(today, today); }, []);

  const maxCatRevenue = byCategory[0]?.revenueInCents ?? 1;

  const STAT_COLOURS: Record<string, string> = {
    Revenue:    '#5DCAA5',
    Orders:     '#A882F0',
    'Tax':      '#EF9F27',
    'Avg order':'#5DCAA5',
  };

  return (
    <div className="p-5 space-y-4">

      {/* ── Header + date range ──────────────────────────────────────────── */}
      <div className="rounded-card border border-line bg-surface-card p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-medium text-t1">Reports</h1>
            <p className="mt-0.5 text-[11px] text-t3">
              {from === to ? fmtDate(from) : `${fmtDate(from)} — ${fmtDate(to)}`}
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className="mb-1.5 block text-[10px] font-medium text-t3">From</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="input py-1.5 text-xs w-36"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-medium text-t3">To</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="input py-1.5 text-xs w-36"
              />
            </div>
            <button
              onClick={() => loadAll(from, to)}
              disabled={loading}
              className="btn-primary py-1.5 px-4 text-xs"
            >
              {loading ? 'Loading…' : 'Load report'}
            </button>

            {summary && (
              <>
                <button
                  onClick={() => void exportSalesHistory()}
                  className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs text-t2 hover:bg-surface-hover hover:text-t1 transition-colors"
                  title="Export sales history as CSV"
                >
                  <Download size={12} strokeWidth={1.75} />
                  Sales CSV
                </button>
                <button
                  onClick={exportFullReport}
                  className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs text-t2 hover:bg-surface-hover hover:text-t1 transition-colors"
                  title="Export full report as CSV"
                >
                  <Download size={12} strokeWidth={1.75} />
                  Full CSV
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          className="rounded-xl px-3 py-2 text-xs"
          style={{ background: 'rgba(240,149,149,0.1)', color: '#F09595' }}
        >
          {error}
        </div>
      )}

      {/* ── Stats row ────────────────────────────────────────────────────── */}
      {summary && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Revenue"
              value={formatCurrency(summary.totalRevenueInCents)}
              sub={`${summary.completedOrders} completed order${summary.completedOrders !== 1 ? 's' : ''}`}
              colour="#5DCAA5"
            />
            <StatCard
              label="Avg order"
              value={formatCurrency(summary.averageOrderInCents)}
              sub="per completed order"
              colour="#A882F0"
            />
            <StatCard
              label="Tax collected"
              value={formatCurrency(summary.totalTaxInCents)}
              sub="included in revenue"
              colour="#EF9F27"
            />
            <StatCard
              label="Discounts"
              value={formatCurrency(summary.totalDiscountInCents)}
              sub={`${summary.voidedOrders} voided order${summary.voidedOrders !== 1 ? 's' : ''}`}
              colour="#F09595"
            />
          </div>

          {/* ── Bottom two columns ────────────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

            {/* Top products */}
            <div className="rounded-card border border-line bg-surface-card p-5">
              <h2 className="mb-4 text-sm font-medium text-t1">Top products</h2>

              {topProducts.length === 0 ? (
                <EmptyState message="No sales data for this period." />
              ) : (
                <div className="space-y-3">
                  {topProducts.map((p, i) => (
                    <div key={p.productId} className="flex items-center gap-3">
                      {/* Rank */}
                      <span className="w-5 text-center text-[11px] font-medium text-t3">
                        {i + 1}
                      </span>

                      {/* Initial avatar */}
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold"
                        style={{
                          background: `rgba(93,202,165,${0.08 + (1 - i / topProducts.length) * 0.1})`,
                          color: 'var(--t1)',
                        }}
                      >
                        {p.name.charAt(0).toUpperCase()}
                      </div>

                      {/* Name + SKU */}
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-[13px] font-medium text-t1">{p.name}</div>
                        <div className="text-[10px] text-t3">{p.sku}</div>
                      </div>

                      {/* Qty sold */}
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{ background: 'rgba(93,202,165,0.1)', color: '#5DCAA5' }}
                      >
                        ×{p.quantitySold}
                      </span>

                      {/* Revenue */}
                      <span className="text-xs font-medium text-t1 min-w-[60px] text-right">
                        {formatCurrency(p.revenueInCents)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Revenue by category */}
            <div className="rounded-card border border-line bg-surface-card p-5">
              <h2 className="mb-4 text-sm font-medium text-t1">Revenue by category</h2>

              {byCategory.length === 0 ? (
                <EmptyState message="No sales data for this period." />
              ) : (
                <div className="space-y-3.5">
                  {byCategory.map((c, i) => {
                    const pct = Math.round((c.revenueInCents / maxCatRevenue) * 100);
                    const CAT_COLOURS = ['#5DCAA5', '#A882F0', '#EF9F27', '#5B9CF0', '#F09595'];
                    const colour = CAT_COLOURS[i % CAT_COLOURS.length];

                    return (
                      <div key={c.categoryId ?? 'uncategorised'}>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-xs font-medium text-t1">{c.categoryName}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-t3">{c.orderCount} order{c.orderCount !== 1 ? 's' : ''}</span>
                            <span className="text-xs font-medium" style={{ color: colour }}>
                              {formatCurrency(c.revenueInCents)}
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, background: colour }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Loading placeholder */}
      {loading && !summary && (
        <div className="rounded-card border border-line bg-surface-card py-16 text-center">
          <p className="text-xs text-t3">Loading…</p>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface IStatCardProps {
  label: string;
  value: string;
  sub: string;
  colour: string;
}

/** A summary metric card. */
function StatCard({ label, value, sub, colour }: IStatCardProps): React.JSX.Element {
  return (
    <div className="rounded-card border border-line bg-surface-card p-4">
      <div className="mb-3 text-[11px] font-medium text-t3">{label}</div>
      <div className="text-xl font-semibold" style={{ color: colour }}>{value}</div>
      <div className="mt-1 text-[10px] text-t3">{sub}</div>
    </div>
  );
}

/** Shown when a section has no data. */
function EmptyState({ message }: { message: string }): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line py-10 text-center">
      <p className="text-xs text-t3">{message}</p>
    </div>
  );
}
