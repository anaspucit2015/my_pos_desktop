import { calculateTax, calculateTotal, TAX_RATE } from '@my-pos/shared';
import type { IOrder } from '@my-pos/shared';

export interface TaxSummary {
  totalRevenueInCents: number;
  totalTaxInCents: number;
  netRevenueInCents: number;
  effectiveTaxRate: number;
}

/**
 * Stateless service for tax calculations.
 */
export class TaxService {
  /**
   * Calculates the tax amount on a subtotal using the given rate.
   *
   * @param subtotalInCents - Pre-tax subtotal in cents.
   * @param taxRate - Decimal tax rate. Defaults to the global TAX_RATE.
   * @returns Tax amount in cents.
   */
  applyTax(subtotalInCents: number, taxRate: number = TAX_RATE): number {
    return calculateTax(subtotalInCents, taxRate);
  }

  /**
   * Returns the total (subtotal + tax).
   *
   * @param subtotalInCents - Pre-tax subtotal in cents.
   * @param taxRate - Decimal tax rate. Defaults to the global TAX_RATE.
   */
  getTotal(subtotalInCents: number, taxRate: number = TAX_RATE): number {
    return calculateTotal(subtotalInCents, taxRate);
  }

  /**
   * Aggregates tax across a list of completed orders.
   *
   * @param orders - Array of IOrder objects to summarise.
   * @returns A TaxSummary with totals and the effective rate.
   */
  getTaxSummary(orders: IOrder[]): TaxSummary {
    const totalRevenueInCents = orders.reduce((s, o) => s + o.totalInCents, 0);
    const totalTaxInCents = orders.reduce((s, o) => s + o.taxInCents, 0);
    const netRevenueInCents = totalRevenueInCents - totalTaxInCents;
    const effectiveTaxRate =
      netRevenueInCents > 0 ? totalTaxInCents / netRevenueInCents : 0;

    return { totalRevenueInCents, totalTaxInCents, netRevenueInCents, effectiveTaxRate };
  }
}
