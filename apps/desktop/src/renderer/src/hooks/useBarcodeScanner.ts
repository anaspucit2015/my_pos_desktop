import { useEffect, useRef, useCallback } from 'react';
import { useCartStore } from '../store/cartStore';

export interface ScanResult {
  type: 'found' | 'not_found' | 'error';
  message: string;
}

/**
 * Listens globally for barcode scanner input.
 *
 * Scanners behave like a keyboard that types very fast (< 50 ms between
 * characters) and finishes with an Enter keypress. This hook distinguishes
 * that pattern from a user typing manually and, on a successful scan, looks
 * up the product and adds it to the cart automatically.
 *
 * @param onScan - Called with the result of every scan attempt.
 * @param enabled - Set false to pause listening (e.g. while a modal is open).
 */
export function useBarcodeScanner(
  onScan: (result: ScanResult) => void,
  enabled = true,
): void {
  const addItem = useCartStore((s) => s.addItem);

  // Buffer of characters accumulated in the current scan sequence
  const bufferRef   = useRef('');
  // Timestamp of the last keydown event
  const lastKeyRef  = useRef(0);
  // Timer to auto-clear the buffer if no Enter arrives
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  const processBarcode = useCallback(
    async (barcode: string) => {
      if (barcode.length < 3) return; // too short to be a real barcode

      try {
        const res = await window.api.products.searchByBarcode(barcode);
        if (!res.success) {
          onScan({ type: 'error', message: res.error });
          return;
        }
        if (!res.data) {
          onScan({ type: 'not_found', message: `No product for barcode: ${barcode}` });
          return;
        }
        addItem(res.data);
        onScan({ type: 'found', message: `Added: ${res.data.name}` });
      } catch {
        onScan({ type: 'error', message: 'Scanner lookup failed' });
      }
    },
    [addItem, onScan],
  );

  useEffect(() => {
    if (!enabled) return;

    function onKeyDown(e: KeyboardEvent): void {
      // Ignore modifier-key-only events
      if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') return;

      const now = Date.now();
      const gap = now - lastKeyRef.current;
      lastKeyRef.current = now;

      // If the gap is too long, this keystroke starts a new sequence
      if (gap > 100) {
        bufferRef.current = '';
      }

      if (e.key === 'Enter') {
        const barcode = bufferRef.current.trim();
        bufferRef.current = '';
        if (timerRef.current) clearTimeout(timerRef.current);

        // Only treat as a scan if chars arrived fast (scanner) not slow (human)
        // We check: the whole sequence completed before this Enter, gap < 100ms
        if (barcode.length >= 3 && gap < 100) {
          // Prevent the Enter from submitting forms / triggering buttons
          e.preventDefault();
          e.stopPropagation();
          processBarcode(barcode);
        }
        return;
      }

      // Only buffer printable single characters (scanner output)
      if (e.key.length === 1) {
        bufferRef.current += e.key;

        // Auto-clear the buffer after 200 ms in case Enter never arrives
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          bufferRef.current = '';
        }, 200);
      }
    }

    document.addEventListener('keydown', onKeyDown, { capture: true });
    return () => {
      document.removeEventListener('keydown', onKeyDown, { capture: true });
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, processBarcode]);
}
