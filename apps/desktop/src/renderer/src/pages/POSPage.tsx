import React, { useCallback, useState } from 'react';
import ProductGrid from '../components/ProductGrid/ProductGrid';
import Cart from '../components/Cart/Cart';
import ScannerToast from '../components/ui/ScannerToast';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import type { ScanResult } from '../hooks/useBarcodeScanner';

/**
 * Point-of-sale page.
 * Layout: product grid (flex-1) on the left, fixed-width cart panel on the right.
 * Barcode scanner is active whenever no modal is open.
 */
export default function POSPage(): React.JSX.Element {
  const [modalOpen, setModalOpen] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  const handleScan = useCallback((result: ScanResult) => {
    setScanResult(result);
  }, []);

  useBarcodeScanner(handleScan, !modalOpen);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Product area: search topbar + 3-column grid */}
      <div className="flex-1 overflow-hidden">
        <ProductGrid />
      </div>

      {/* Cart panel — fixed 420 px */}
      <div className="w-[420px] flex-shrink-0 overflow-hidden">
        <Cart onModalChange={setModalOpen} />
      </div>

      {/* Scanner feedback toast */}
      {scanResult && (
        <ScannerToast result={scanResult} onDismiss={() => setScanResult(null)} />
      )}
    </div>
  );
}
