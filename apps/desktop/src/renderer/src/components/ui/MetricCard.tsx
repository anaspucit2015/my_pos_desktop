import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string;
  /** Percentage delta vs the comparison period. Positive = growth. */
  delta?: number | null;
  deltaLabel?: string;
  icon: React.ElementType;
  /** Tailwind bg + text classes for the icon circle, e.g. "bg-sky-500/15 text-sky-400" */
  iconStyle: string;
}

/**
 * A single KPI tile: icon, headline value, label, and optional trend delta.
 */
export default function MetricCard({
  label,
  value,
  delta,
  deltaLabel = 'vs yesterday',
  icon: Icon,
  iconStyle,
}: MetricCardProps): React.JSX.Element {
  const hasDelta  = delta != null && isFinite(delta);
  const isPositive = (delta ?? 0) >= 0;
  const absPercent = hasDelta ? Math.abs(delta!).toFixed(1) : '';

  return (
    <div className="card p-4 flex flex-col gap-3">
      {/* Top row: icon + delta badge */}
      <div className="flex items-start justify-between">
        <div className={`flex h-9 w-9 items-center justify-center rounded-input ${iconStyle}`}>
          <Icon size={17} strokeWidth={1.75} />
        </div>

        {hasDelta && (
          <span
            className={`flex items-center gap-0.5 rounded-pill px-2 py-0.5 text-[11px] font-medium ${
              isPositive
                ? 'bg-emerald-500/[0.12] text-emerald-400'
                : 'bg-red-500/[0.12] text-red-400'
            }`}
          >
            {isPositive
              ? <TrendingUp size={11} strokeWidth={2} />
              : <TrendingDown size={11} strokeWidth={2} />
            }
            {isPositive ? '+' : '-'}{absPercent}%
          </span>
        )}
      </div>

      {/* Value + label */}
      <div>
        <p className="text-2xl font-medium text-t1 leading-none">{value}</p>
        <p className="mt-1.5 text-xs text-t2">{label}</p>
        {hasDelta && (
          <p className="mt-0.5 text-[10px] text-t3">{deltaLabel}</p>
        )}
      </div>
    </div>
  );
}
