import { calculateTax, calculateTotal, extractTax } from './tax.js';

describe('calculateTax', () => {
  it('calculates tax at the default rate (8%)', () => {
    expect(calculateTax(1000)).toBe(80);
  });

  it('calculates tax at a custom rate', () => {
    expect(calculateTax(1000, 0.1)).toBe(100);
  });

  it('rounds fractional cents', () => {
    // 999 * 0.08 = 79.92 → rounds to 80
    expect(calculateTax(999)).toBe(80);
  });

  it('returns 0 for zero subtotal', () => {
    expect(calculateTax(0)).toBe(0);
  });
});

describe('calculateTotal', () => {
  it('returns subtotal + tax', () => {
    expect(calculateTotal(1000)).toBe(1080);
  });
});

describe('extractTax', () => {
  it('extracts tax from an inclusive total', () => {
    // total=1080, rate=0.08: tax = 1080 - 1080/1.08 = 1080 - 1000 = 80
    expect(extractTax(1080)).toBe(80);
  });
});
