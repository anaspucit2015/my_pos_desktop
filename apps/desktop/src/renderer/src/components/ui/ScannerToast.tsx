import React, { useEffect } from 'react';
import { ScanLine, AlertCircle } from 'lucide-react';
import type { ScanResult } from '../../hooks/useBarcodeScanner';

interface IScannerToastProps {
  result: ScanResult;
  onDismiss: () => void;
}

const STYLE: Record<ScanResult['type'], { bg: string; border: string; icon: string }> = {
  found:     { bg: 'rgba(93,202,165,0.12)',  border: '#5DCAA544', icon: '#5DCAA5' },
  not_found: { bg: 'rgba(239,159,39,0.12)',  border: '#EF9F2744', icon: '#EF9F27' },
  error:     { bg: 'rgba(240,149,149,0.12)', border: '#F0959544', icon: '#F09595' },
};

/**
 * Brief toast notification shown after a barcode scan attempt.
 * Auto-dismisses after 2.5 seconds.
 */
export default function ScannerToast({ result, onDismiss }: IScannerToastProps): React.JSX.Element {
  useEffect(() => {
    const t = setTimeout(onDismiss, 2500);
    return () => clearTimeout(t);
  }, [result, onDismiss]);

  const s = STYLE[result.type];
  const Icon = result.type === 'found' ? ScanLine : AlertCircle;

  return (
    <div
      className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2
                 flex items-center gap-2.5 rounded-xl border px-4 py-2.5
                 shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-200"
      style={{ background: s.bg, borderColor: s.border }}
    >
      <Icon size={15} strokeWidth={1.75} style={{ color: s.icon }} className="shrink-0" />
      <span className="text-xs font-medium text-t1">{result.message}</span>
    </div>
  );
}
