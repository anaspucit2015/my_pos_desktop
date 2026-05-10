import { useState, useEffect } from 'react';
import type { IOrder } from '@my-pos/shared';

export interface DashboardData {
  /** Summaries for the last 7 days, oldest first, index 6 = today. */
  weekSummaries: DailySummary[];
  topProducts: TopProduct[];
  categoryRevenue: CategoryRevenue[];
  /** Last 8 orders, most-recent first. */
  recentOrders: IOrder[];
  customerCount: number;
}

interface UseDashboardResult extends DashboardData {
  loading: boolean;
  error: string | null;
}

const EMPTY: DashboardData = {
  weekSummaries: [],
  topProducts: [],
  categoryRevenue: [],
  recentOrders: [],
  customerCount: 0,
};

/** Returns an ISO date string `n` days before today. */
function dayOffset(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/**
 * Loads all data needed by DashboardPage in a single parallel fetch.
 * Refreshes once on mount.
 */
export function useDashboard(): UseDashboardResult {
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [data, setData]       = useState<DashboardData>(EMPTY);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      setLoading(true);
      setError(null);

      try {
        const today        = dayOffset(0);
        const sevenDaysAgo = dayOffset(6);

        // Fire everything in parallel
        const [
          summaryResults,
          topProductsRes,
          categoryRevenueRes,
          ordersRes,
          customersRes,
        ] = await Promise.all([
          // 7 daily summaries: index 0 = 6 days ago, index 6 = today
          Promise.all(
            Array.from({ length: 7 }, (_, i) =>
              window.api.reports.getDailySummary(dayOffset(6 - i)),
            ),
          ),
          window.api.reports.getTopProducts(sevenDaysAgo, today, 5),
          window.api.reports.getRevenueByCategory(sevenDaysAgo, today),
          window.api.orders.getAll(),
          window.api.customers.getAll(),
        ]);

        if (cancelled) return;

        const weekSummaries = summaryResults
          .filter((r): r is { success: true; data: DailySummary } => r.success)
          .map((r) => r.data);

        const topProducts = topProductsRes.success ? topProductsRes.data : [];
        const categoryRevenue = categoryRevenueRes.success ? categoryRevenueRes.data : [];

        const recentOrders = ordersRes.success
          ? [...ordersRes.data]
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
              )
              .slice(0, 8)
          : [];

        const customerCount = customersRes.success ? customersRes.data.length : 0;

        setData({ weekSummaries, topProducts, categoryRevenue, recentOrders, customerCount });
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load dashboard');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { ...data, loading, error };
}
