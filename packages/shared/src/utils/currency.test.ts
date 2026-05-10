import { formatCurrency, dollarsToCents, centsToDollars } from './currency.js';

describe('formatCurrency', () => {
  it('formats whole dollar amounts', () => {
    expect(formatCurrency(1000)).toBe('$10.00');
  });

  it('formats cents correctly', () => {
    expect(formatCurrency(1299)).toBe('$12.99');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('formats large amounts', () => {
    expect(formatCurrency(100000)).toBe('$1,000.00');
  });
});

describe('dollarsToCents', () => {
  it('converts whole dollars', () => {
    expect(dollarsToCents(10)).toBe(1000);
  });

  it('converts fractional dollars', () => {
    expect(dollarsToCents(10.99)).toBe(1099);
  });

  it('rounds floating-point imprecision', () => {
    // 0.1 + 0.2 in JS = 0.30000000000000004
    expect(dollarsToCents(0.1 + 0.2)).toBe(30);
  });
});

describe('centsToDollars', () => {
  it('converts cents to dollars', () => {
    expect(centsToDollars(1299)).toBe(12.99);
  });

  it('converts zero', () => {
    expect(centsToDollars(0)).toBe(0);
  });
});
