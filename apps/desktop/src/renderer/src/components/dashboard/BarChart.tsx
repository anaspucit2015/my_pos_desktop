import React from 'react';
import { formatCurrency } from '@my-pos/shared';

interface BarDatum {
  label: string;
  valueInCents: number;
  /** Whether this bar should be highlighted (e.g. today). */
  isHighlighted: boolean;
}

interface BarChartProps {
  data: BarDatum[];
}

const CHART_H   = 110; // usable bar area height in px
const TOTAL_H   = 150; // full viewBox height
const TOTAL_W   = 320;
const BAR_W     = 28;
const GAP       = 14;
const LEFT_PAD  = 8;
const BOTTOM_Y  = CHART_H + 10; // y where bars sit

/**
 * Lightweight SVG bar chart. No external library.
 * Bars fill with accent color for highlighted entries (today), muted for others.
 */
export default function BarChart({ data }: BarChartProps): React.JSX.Element {
  const maxValue = Math.max(...data.map((d) => d.valueInCents), 1);

  /** Scale a cents value to SVG bar height. */
  const toBarH = (v: number): number =>
    Math.max(4, (v / maxValue) * CHART_H);

  return (
    <svg
      viewBox={`0 0 ${TOTAL_W} ${TOTAL_H}`}
      className="w-full"
      aria-label="Daily revenue bar chart"
    >
      {/* Subtle horizontal guide lines */}
      {[0.25, 0.5, 0.75, 1].map((frac) => {
        const y = BOTTOM_Y - frac * CHART_H;
        return (
          <line
            key={frac}
            x1={LEFT_PAD}
            x2={TOTAL_W - LEFT_PAD}
            y1={y}
            y2={y}
            className="stroke-line"
            strokeWidth={0.5}
          />
        );
      })}

      {/* Y-axis label at top */}
      <text
        x={LEFT_PAD}
        y={10}
        className="fill-t3"
        fontSize={9}
        fontFamily="system-ui, sans-serif"
      >
        {formatCurrency(maxValue)}
      </text>

      {/* Bars + x-axis labels */}
      {data.map((d, i) => {
        const barH = toBarH(d.valueInCents);
        const x    = LEFT_PAD + i * (BAR_W + GAP);
        const y    = BOTTOM_Y - barH;

        return (
          <g key={d.label}>
            <rect
              x={x}
              y={y}
              width={BAR_W}
              height={barH}
              rx={5}
              className={d.isHighlighted ? 'fill-accent' : 'fill-t3 opacity-30'}
            />

            {/* Value label above bar — only for highlighted bar */}
            {d.isHighlighted && (
              <text
                x={x + BAR_W / 2}
                y={y - 4}
                textAnchor="middle"
                className="fill-accent"
                fontSize={8}
                fontFamily="system-ui, sans-serif"
              >
                {formatCurrency(d.valueInCents)}
              </text>
            )}

            {/* Day label */}
            <text
              x={x + BAR_W / 2}
              y={TOTAL_H - 4}
              textAnchor="middle"
              className="fill-t3"
              fontSize={9}
              fontFamily="system-ui, sans-serif"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
