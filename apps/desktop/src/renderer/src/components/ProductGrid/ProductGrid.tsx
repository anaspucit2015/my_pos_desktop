import React, { useState, useEffect, useMemo } from 'react';
import { Search, ScanLine } from 'lucide-react';
import type { IProduct } from '@my-pos/shared';
import { useProducts } from '../../hooks/useProducts';
import ProductCard from './ProductCard';

/** Placeholder category pills. In production these come from the categories API. */
const CATEGORIES = ['All', 'Hot', 'Cold', 'Juice', 'Energy'] as const;
type Category = (typeof CATEGORIES)[number];

/**
 * Topbar (search + category pills) + 3-column product grid.
 * Handles loading, error, and empty states.
 */
export default function ProductGrid(): React.JSX.Element {
  const { products, loading, error, search } = useProducts();

  const [query, setQuery]               = useState('');
  const [activeCategory, setCategory]   = useState<Category>('All');
  const [searchResults, setSearchResults] = useState<IProduct[]>([]);

  // Async search whenever query changes
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    search(query).then(setSearchResults);
  }, [query, search]);

  // Client-side category filter on top of search / full list
  const displayed = useMemo(() => {
    const base = query.trim() ? searchResults : products;
    if (activeCategory === 'All') return base;
    return base.filter((p) => p.category?.name === activeCategory);
  }, [query, searchResults, products, activeCategory]);

  return (
    <div className="flex h-full flex-col">

      {/* ── Topbar ──────────────────────────────────────────── */}
      <div className="flex-shrink-0 space-y-3 border-b border-line px-5 py-4">

        {/* Search input */}
        <div className="relative">
          <Search
            size={15}
            strokeWidth={1.75}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-t3 pointer-events-none"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products or scan barcode…"
            className="input pl-9 pr-10"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-t3 pointer-events-none">
            <ScanLine size={14} strokeWidth={1.5} />
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`flex-shrink-0 rounded-pill px-4 py-1 text-xs font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-accent text-accent-fg'
                  : 'bg-surface-card border border-line text-t2 hover:bg-surface-hover hover:text-t1'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Product grid ────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {loading && (
          <div className="flex h-32 items-center justify-center text-sm text-t3">
            Loading products…
          </div>
        )}

        {!loading && error && (
          <div className="rounded-card border border-red-500/20 bg-red-500/[0.08] p-4 text-sm text-red-400">
            Failed to load products: {error}
          </div>
        )}

        {!loading && !error && displayed.length === 0 && (
          <div className="flex h-32 items-center justify-center text-sm text-t3">
            No products found
          </div>
        )}

        {!loading && !error && displayed.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {displayed.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
