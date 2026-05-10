import { useState, useEffect, useCallback } from 'react';
import type { IOrder } from '@my-pos/shared';

interface UseOrdersResult {
  orders: IOrder[];
  loading: boolean;
  error: string | null;
  reload(): Promise<void>;
  todaySummary: DailySummary | null;
  loadTodaySummary(): Promise<void>;
}

/**
 * Loads order history and today's summary on mount.
 * Thin wrapper over `window.api.orders`.
 */
export function useOrders(): UseOrdersResult {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [todaySummary, setTodaySummary] = useState<DailySummary | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await window.api.orders.getAll();
    if (res.success) {
      setOrders(res.data);
    } else {
      setError(res.error);
    }
    setLoading(false);
  }, []);

  const loadTodaySummary = useCallback(async () => {
    const res = await window.api.orders.getTodaySummary();
    if (res.success) setTodaySummary(res.data);
  }, []);

  useEffect(() => {
    reload();
    loadTodaySummary();
  }, [reload, loadTodaySummary]);

  return { orders, loading, error, reload, todaySummary, loadTodaySummary };
}
