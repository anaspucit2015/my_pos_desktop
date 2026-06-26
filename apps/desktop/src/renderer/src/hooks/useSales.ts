import { useState, useEffect, useCallback } from 'react';
import type { IOrder } from '@my-pos/shared';

/**
 * Fetches all orders for the Sales History page.
 * Provides search/filter state and a reload function.
 */
export function useSales(): {
  orders: IOrder[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
} {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await window.api.orders.getAll();
      if (res.success) {
        setOrders(res.data);
      } else {
        setError(res.error);
      }
    } catch {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { orders, loading, error, reload };
}
