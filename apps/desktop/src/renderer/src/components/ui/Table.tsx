import React from 'react';

/** A column definition — either a plain label string or an object with optional extra th className. */
export type ITableColumn = string | { label: string; className?: string };

interface ITableProps {
  columns: ITableColumn[];
  children: React.ReactNode;
}

/**
 * Shared table shell. Renders the outer wrapper, thead, and tbody.
 * Use TableRow / TableCell / TableRowExpanded for body content.
 */
export function Table({ columns, children }: ITableProps): React.JSX.Element {
  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-line bg-surface-card">
            {columns.map((col, i) => {
              const label = typeof col === 'string' ? col : col.label;
              const extra = typeof col === 'string' ? '' : (col.className ?? '');
              return (
                <th
                  key={i}
                  className={`px-3.5 py-2.5 text-left text-[10px] font-medium uppercase tracking-widest text-t3 ${extra}`}
                >
                  {label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

interface ITableRowProps {
  children: React.ReactNode;
  /** Extra classes appended to the row — e.g. to override background. */
  className?: string;
}

/** Standard interactive body row with divider + hover. */
export function TableRow({ children, className = '' }: ITableRowProps): React.JSX.Element {
  return (
    <tr className={`border-b border-line/20 last:border-b-0 hover:bg-surface-hover transition-colors ${className}`}>
      {children}
    </tr>
  );
}

interface ITableCellProps {
  children?: React.ReactNode;
  /** Extra classes — use for text colour, font weight, min-width, etc. */
  className?: string;
}

/** Standard body cell with consistent padding. */
export function TableCell({ children, className = '' }: ITableCellProps): React.JSX.Element {
  return (
    <td className={`px-3.5 py-3 ${className}`}>{children}</td>
  );
}

interface ITableRowExpandedProps {
  /** Number of columns the cell should span. */
  colSpan: number;
  children: React.ReactNode;
}

/**
 * Full-width expanded row — used for inline forms (e.g. restock panel)
 * or empty-state messages inside a tbody.
 */
export function TableRowExpanded({ colSpan, children }: ITableRowExpandedProps): React.JSX.Element {
  return (
    <tr className="border-b border-line/20 last:border-b-0">
      <td colSpan={colSpan} className="bg-surface-card px-3.5 py-3">
        {children}
      </td>
    </tr>
  );
}
