import React, { useMemo } from 'react';
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Users,
  RefreshCw,
} from 'lucide-react';
import { formatCurrency } from '@my-pos/shared';
import { OrderStatus } from '@my-pos/shared';
import { useDashboard } from '../hooks/useDashboard';
import MetricCard from '../components/ui/MetricCard';
import BarChart from '../components/dashboard/BarChart';
import DonutChart from '../components/dashboard/DonutChart';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Returns the signed percentage delta between two values. Null when yesterday = 0. */
function delta(today: number, yesterday: number): number | null {
  if (yesterday === 0) return null;
  return ((today - yesterday) / yesterday) * 100;
}

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

function shortDay(iso: string): string {
  return DAY_SHORT[new Date(iso).getDay()] ?? iso.slice(5);
}

function timeAgo(date: Date | string): string {
  const ms   = Date.now() - new Date(date).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const STATUS_STYLES: Record<string, string> = {
  COMPLETED: 'bg-emerald-500/[0.12] text-emerald-400',
  PENDING:   'bg-amber-500/[0.12]   text-amber-400',
  VOIDED:    'bg-red-500/[0.12]     text-red-400',
  REFUNDED:  'bg-blue-500/[0.12]    text-blue-400',
};

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * Analytics dashboard: KPI metrics, 7-day revenue chart, category donut,
 * top-product table, and recent order activity feed.
 */
export default function DashboardPage(): React.JSX.Element {
  const { weekSummaries, topProducts, categoryRevenue, recentOrders, customerCount, loading, error } =
    useDashboard();

  const today     = weekSummaries[weekSummaries.length - 1] ?? null;
  const yesterday = weekSummaries[weekSummaries.length - 2] ?? null;

  // Bar chart data
  const barData = useMemo(
    () =>
      weekSummaries.map((s, i) => ({
        label: shortDay(s.date),
        valueInCents: s.totalRevenueInCents,
        isHighlighted: i === weekSummaries.length - 1,
      })),
    [weekSummaries],
  );

  // Donut segments
  const donutSegments = useMemo(
    () =>
      categoryRevenue.map((c) => ({
        label: c.categoryName || 'Uncategorised',
        valueInCents: c.revenueInCents,
      })),
    [categoryRevenue],
  );

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year:    'numeric',
    month:   'long',
    day:     'numeric',
  });

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-t3">
        <RefreshCw size={16} strokeWidth={1.75} className="animate-spin" />
        Loading dashboard…
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-card border border-red-500/20 bg-red-500/[0.08] p-4 text-sm text-red-400">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-5 p-6">

        {/* ── Header ────────────────────────────────────────── */}
        <div>
          <h1 className="text-xl font-medium text-t1">Dashboard</h1>
          <p className="mt-0.5 text-xs text-t3">{formattedDate}</p>
        </div>

        {/* ── KPI cards ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <MetricCard
            label="Revenue today"
            value={formatCurrency(today?.totalRevenueInCents ?? 0)}
            delta={today && yesterday ? delta(today.totalRevenueInCents, yesterday.totalRevenueInCents) : null}
            icon={DollarSign}
            iconStyle="bg-emerald-500/[0.15] text-emerald-400"
          />
          <MetricCard
            label="Orders today"
            value={String(today?.completedOrders ?? 0)}
            delta={today && yesterday ? delta(today.completedOrders, yesterday.completedOrders) : null}
            icon={ShoppingCart}
            iconStyle="bg-sky-500/[0.15] text-sky-400"
          />
          <MetricCard
            label="Avg order value"
            value={formatCurrency(today?.averageOrderInCents ?? 0)}
            delta={today && yesterday ? delta(today.averageOrderInCents, yesterday.averageOrderInCents) : null}
            icon={TrendingUp}
            iconStyle="bg-violet-500/[0.15] text-violet-400"
          />
          <MetricCard
            label="Total customers"
            value={String(customerCount)}
            icon={Users}
            iconStyle="bg-amber-500/[0.15] text-amber-400"
          />
        </div>

        {/* ── Charts row ────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

          {/* Bar chart — daily revenue */}
          <div className="card p-5">
            <div className="mb-4">
              <h2 className="text-sm font-medium text-t1">Daily Revenue</h2>
              <p className="text-xs text-t3">Last 7 days</p>
            </div>
            {barData.length > 0 ? (
              <BarChart data={barData} />
            ) : (
              <div className="flex h-32 items-center justify-center text-xs text-t3">
                No data for this period
              </div>
            )}
          </div>

          {/* Donut chart — revenue by category */}
          <div className="card p-5">
            <div className="mb-4">
              <h2 className="text-sm font-medium text-t1">Sales by Category</h2>
              <p className="text-xs text-t3">Last 7 days</p>
            </div>
            <DonutChart segments={donutSegments} />
          </div>
        </div>

        {/* ── Bottom row ────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

          {/* Top products table */}
          <div className="card overflow-hidden">
            <div className="border-b border-line px-5 py-4">
              <h2 className="text-sm font-medium text-t1">Top Products</h2>
              <p className="text-xs text-t3">By units sold — last 7 days</p>
            </div>

            {topProducts.length === 0 ? (
              <div className="flex h-24 items-center justify-center text-xs text-t3">
                No sales data
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-[10px] uppercase tracking-wide text-t3">
                    <th className="px-5 py-2.5 text-left font-medium">Product</th>
                    <th className="px-5 py-2.5 text-right font-medium">Units</th>
                    <th className="px-5 py-2.5 text-right font-medium">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p, i) => (
                    <tr
                      key={p.productId}
                      className="border-b border-line last:border-0 hover:bg-surface-hover transition-colors"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center
                                          rounded-full bg-accent/20 text-[10px] font-medium text-accent">
                            {i + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-t1">{p.name}</p>
                            <p className="truncate text-[10px] text-t3">{p.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right text-xs text-t2">
                        {p.quantitySold}
                      </td>
                      <td className="px-5 py-3 text-right text-xs font-medium text-accent">
                        {formatCurrency(p.revenueInCents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Recent activity feed */}
          <div className="card overflow-hidden">
            <div className="border-b border-line px-5 py-4">
              <h2 className="text-sm font-medium text-t1">Recent Activity</h2>
              <p className="text-xs text-t3">Latest orders</p>
            </div>

            {recentOrders.length === 0 ? (
              <div className="flex h-24 items-center justify-center text-xs text-t3">
                No recent orders
              </div>
            ) : (
              <div className="divide-y divide-line">
                {recentOrders.map((order) => {
                  const statusStyle =
                    STATUS_STYLES[order.status] ?? 'bg-surface-hover text-t2';

                  return (
                    <div
                      key={order.id}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-surface-hover transition-colors"
                    >
                      {/* Status indicator dot */}
                      <span
                        className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${
                          order.status === OrderStatus.COMPLETED
                            ? 'bg-emerald-400'
                            : order.status === OrderStatus.VOIDED
                            ? 'bg-red-400'
                            : 'bg-amber-400'
                        }`}
                      />

                      {/* Order number */}
                      <span className="w-24 flex-shrink-0 text-xs font-medium text-t1 font-mono truncate">
                        {order.orderNumber}
                      </span>

                      {/* Status badge */}
                      <span className={`rounded-pill px-2 py-0.5 text-[10px] font-medium ${statusStyle}`}>
                        {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                      </span>

                      <span className="flex-1" />

                      {/* Total */}
                      <span className="text-xs font-medium text-t1">
                        {formatCurrency(order.totalInCents)}
                      </span>

                      {/* Time */}
                      <span className="w-16 flex-shrink-0 text-right text-[10px] text-t3">
                        {timeAgo(order.createdAt)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
