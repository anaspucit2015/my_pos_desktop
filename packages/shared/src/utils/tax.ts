import { TAX_RATE } from '../constants/index.js';

/**
 * Calculates the tax amount on a subtotal.
 * @param subtotalInCents - The pre-tax subtotal in cents.
 * @param taxRate - The tax rate as a decimal. Defaults to the global TAX_RATE.
 * @returns The tax amount in cents, rounded to the nearest cent.
 */
export function calculateTax(subtotalInCents: number, taxRate: number = TAX_RATE): number {
  return Math.round(subtotalInCents * taxRate);
}

/**
 * Calculates the total (subtotal + tax) for a given subtotal.
 * @param subtotalInCents - The pre-tax subtotal in cents.
 * @param taxRate - The tax rate as a decimal. Defaults to the global TAX_RATE.
 * @returns The total amount including tax, in cents.
 */
export function calculateTotal(subtotalInCents: number, taxRate: number = TAX_RATE): number {
  return subtotalInCents + calculateTax(subtotalInCents, taxRate);
}

/**
 * Extracts the tax component from a tax-inclusive total.
 * @param totalInCents - The tax-inclusive total in cents.
 * @param taxRate - The tax rate as a decimal. Defaults to the global TAX_RATE.
 * @returns The tax portion in cents.
 */
export function extractTax(totalInCents: number, taxRate: number = TAX_RATE): number {
  return Math.round(totalInCents - totalInCents / (1 + taxRate));
}
