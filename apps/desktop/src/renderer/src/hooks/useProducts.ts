import { useState, useEffect, useCallback } from 'react';
import type { IProduct } from '@my-pos/shared';

interface UseProductsResult {
  products: IProduct[];
  loading: boolean;
  error: string | null;
  reload(): Promise<void>;
  search(query: string): Promise<IProduct[]>;
}

/**
 * Loads all products on mount and exposes a search helper.
 * Thin wrapper over `window.api.products`.
 */
export function useProducts(): UseProductsResult {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await window.api.products.getAll();
    if (res.success) {
      setProducts(res.data);
    } else {
      setError(res.error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const search = useCallback(async (query: string): Promise<IProduct[]> => {
    if (!query.trim()) return products;
    const res = await window.api.products.search(query);
    return res.success ? res.data : [];
  }, [products]);

  return { products, loading, error, reload, search };
}
