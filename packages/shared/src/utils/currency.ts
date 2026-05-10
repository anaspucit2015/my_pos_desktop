import { CURRENCY_CODE, CURRENCY_LOCALE } from '../constants/index.js';

/**
 * Formats an amount in cents to a localized currency string.
 * @param cents - The amount in cents (integer).
 * @returns A formatted currency string, e.g. "$12.99"
 * @example formatCurrency(1299) // "$12.99"
 */
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat(CURRENCY_LOCALE, {
    style: 'currency',
    currency: CURRENCY_CODE,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/**
 * Converts a dollar amount (float) to whole cents (integer).
 * @param dollars - Amount in dollars.
 * @returns Amount in cents, rounded to the nearest cent.
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Converts cents (integer) to a dollar float.
 * @param cents - Amount in cents.
 * @returns Amount in dollars.
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}
