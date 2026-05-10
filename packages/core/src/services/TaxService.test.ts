import { TaxService } from './TaxService.js';
import { TAX_RATE, OrderStatus } from '@my-pos/shared';
import type { IOrder } from '@my-pos/shared';

const service = new TaxService();

describe('TaxService.applyTax', () => {
  it('calculates tax at the default rate', () => {
    expect(service.applyTax(1000)).toBe(Math.round(1000 * TAX_RATE));
  });

  it('calculates tax at a custom rate', () => {
    expect(service.applyTax(1000, 0.1)).toBe(100);
  });

  it('returns 0 for zero subtotal', () => {
    expect(service.applyTax(0)).toBe(0);
  });
});

describe('TaxService.getTotal', () => {
  it('returns subtotal + tax', () => {
    expect(service.getTotal(1000)).toBe(1000 + Math.round(1000 * TAX_RATE));
  });
});

describe('TaxService.getTaxSummary', () => {
  const makeOrder = (total: number, tax: number): IOrder => ({
    id: 1,
    orderNumber: 'ORD-001',
    customerId: null,
    customer: null,
    cashierId: 1,
    status: OrderStatus.COMPLETED,
    items: [],
    payments: [],
    subtotalInCents: total - tax,
    taxInCents: tax,
    discountInCents: 0,
    totalInCents: total,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  it('sums revenue and tax across orders', () => {
    const orders = [makeOrder(1080, 80), makeOrder(2160, 160)];
    const summary = service.getTaxSummary(orders);
    expect(summary.totalRevenueInCents).toBe(3240);
    expect(summary.totalTaxInCents).toBe(240);
    expect(summary.netRevenueInCents).toBe(3000);
  });

  it('returns zero effective rate for empty orders', () => {
    const summary = service.getTaxSummary([]);
    expect(summary.effectiveTaxRate).toBe(0);
  });
});
