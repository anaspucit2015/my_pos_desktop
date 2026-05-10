import React, { useState, useEffect } from 'react';
import type { ICustomer } from '@my-pos/shared';
import { Table, TableRow, TableCell } from '../components/ui/Table';

/**
 * Customer list page. Stub — future work includes add/edit customer forms.
 */
export default function CustomersPage(): React.JSX.Element {
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    window.api.customers.getAll().then((res) => {
      if (res.success) setCustomers(res.data);
      else setError(res.error);
      setLoading(false);
    });
  }, []);

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    if (!q) return true;
    const full = `${c.firstName} ${c.lastName}`.toLowerCase();
    return (
      full.includes(q) ||
      (c.email ?? '').toLowerCase().includes(q) ||
      (c.phone ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-5">
      <div className="rounded-card border border-line bg-surface-card p-5">

        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h1 className="text-sm font-medium text-t1">Customers</h1>
            <p className="mt-0.5 text-[11px] text-t3">
              {customers.length} customer{customers.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-3.5 flex gap-2">
          <div className="relative flex-1">
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-t3"
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              className="input pl-8 text-xs py-2"
              placeholder="Search by name, email or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* States */}
        {loading && <p className="py-6 text-center text-xs text-t3">Loading…</p>}
        {!loading && error && (
          <div className="rounded-xl px-3 py-2 text-xs" style={{ background: 'rgba(240,149,149,0.1)', color: '#F09595' }}>
            {error}
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line py-16 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
                  style={{ background: 'rgba(93,202,165,0.1)' }}>👥</div>
                <p className="text-sm font-medium text-t1">
                  {customers.length === 0 ? 'No customers yet' : 'No results found'}
                </p>
                <p className="mt-1 text-xs text-t3">
                  {customers.length === 0
                    ? 'Customers will appear here once orders are placed.'
                    : 'Try a different search term.'}
                </p>
              </div>
            ) : (
              <Table columns={['Customer', 'Email', 'Phone', 'Loyalty points']}>
                {filtered.map((c) => {
                  const initials = `${c.firstName.charAt(0)}${c.lastName.charAt(0)}`.toUpperCase();
                  const COLOURS = [
                    'rgba(93,202,165,0.15)', 'rgba(99,130,240,0.15)',
                    'rgba(239,159,39,0.15)', 'rgba(168,130,240,0.15)',
                  ];
                  return (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold"
                            style={{ background: COLOURS[c.id % COLOURS.length], color: 'var(--t1)' }}>
                            {initials}
                          </div>
                          <span className="text-[13px] font-medium text-t1">{c.firstName} {c.lastName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-t2">{c.email ?? <span className="text-t3">—</span>}</TableCell>
                      <TableCell className="text-xs text-t2">{c.phone ?? <span className="text-t3">—</span>}</TableCell>
                      <TableCell>
                        <span className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium"
                          style={{ background: 'rgba(93,202,165,0.12)', color: '#5DCAA5' }}>
                          {c.loyaltyPoints} pts
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </Table>
            )}
          </>
        )}
      </div>
    </div>
  );
}
