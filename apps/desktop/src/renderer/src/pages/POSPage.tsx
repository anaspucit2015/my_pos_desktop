import React from 'react';
import ProductGrid from '../components/ProductGrid/ProductGrid';
import Cart from '../components/Cart/Cart';

/**
 * Point-of-sale page.
 * Layout: product grid (flex-1) on the left, fixed-width cart panel on the right.
 * The Sidebar lives in AppLayout (App.tsx) and is not repeated here.
 */
export default function POSPage(): React.JSX.Element {
  return (
    <div className="flex h-full overflow-hidden">
      {/* Product area: search topbar + 3-column grid */}
      <div className="flex-1 overflow-hidden">
        <ProductGrid />
      </div>

      {/* Cart panel — fixed 300 px */}
      <div className="w-[300px] flex-shrink-0 overflow-hidden">
        <Cart />
      </div>
    </div>
  );
}
