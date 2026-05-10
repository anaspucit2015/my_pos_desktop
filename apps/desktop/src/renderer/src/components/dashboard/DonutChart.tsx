import React from 'react';
import { formatCurrency } from '@my-pos/shared';

interface DonutSegment {
  label: string;
  valueInCents: number;
}

interface DonutChartProps {
  segments: DonutSegment[];
}

/** Fixed color palette for segments — vivid enough for both themes. */
const COLORS = [
  '#5dcaa5', // teal (accent)
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ef4444', // red
  '#ec4899', // pink
] as const;

const CX = 70;
const CY = 70;
const R  = 52;
const SW = 18; // strokeWidth
const CIRCUMFERENCE = 2 * Math.PI * R;

/**
 * SVG donut chart using stroke-dasharray segments.
 * Each segment is a separate <circle> rotated to its start angle.
 */
export default function DonutChart({ segments }: DonutChartProps): React.JSX.Element {
  const total = segments.reduce((s, seg) => s + seg.valueInCents, 0);
  const hasData = total > 0;

  let startAngle = -90; // Begin at 12 o'clock

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
      {/* Donut */}
      <div className="flex-shrink-0">
        <svg
          viewBox={`0 0 ${CX * 2} ${CY * 2}`}
          width={140}
          height={140}
          aria-label="Sales by category donut chart"
        >
          {/* Background track */}
          <circle
            cx={CX} cy={CY} r={R}
            fill="none"
            className="stroke-line"
            strokeWidth={SW}
          />

          {hasData && segments.map((seg, i) => {
            const fraction  = seg.valueInCents / total;
            const arcLen    = fraction * CIRCUMFERENCE;
            const color     = COLORS[i % COLORS.length];
            const rotate    = startAngle;
            startAngle     += fraction * 360;

            return (
              <circle
                key={seg.label}
                cx={CX} cy={CY} r={R}
                fill="none"
                stroke={color}
                strokeWidth={SW}
                strokeDasharray={`${arcLen} ${CIRCUMFERENCE - arcLen}`}
                strokeDashoffset={0}
                transform={`rotate(${rotate} ${CX} ${CY})`}
                strokeLinecap="butt"
              />
            );
          })}

          {/* Centre label */}
          <text
            x={CX} y={CY - 4}
            textAnchor="middle"
            className="fill-t1"
            fontSize={14}
            fontWeight={500}
            fontFamily="system-ui, sans-serif"
          >
            {hasData ? formatCurrency(total) : '—'}
          </text>
          <text
            x={CX} y={CY + 11}
            textAnchor="middle"
            className="fill-t3"
            fontSize={8}
            fontFamily="system-ui, sans-serif"
          >
            total
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-2 min-w-0">
        {segments.length === 0 ? (
          <p className="text-xs text-t3">No data</p>
        ) : (
          segments.map((seg, i) => {
            const pct = total > 0 ? ((seg.valueInCents / total) * 100).toFixed(1) : '0';
            return (
              <div key={seg.label} className="flex items-center gap-2 min-w-0">
                <span
                  className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="truncate text-xs text-t2 flex-1">{seg.label}</span>
                <span className="text-xs text-t3 flex-shrink-0">{pct}%</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
