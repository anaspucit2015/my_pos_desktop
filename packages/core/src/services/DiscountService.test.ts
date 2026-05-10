import { DiscountService } from './DiscountService.js';
import { MAX_DISCOUNT_PERCENT } from '@my-pos/shared';

const service = new DiscountService();

describe('DiscountService.applyPercentDiscount', () => {
  it('applies a valid percentage', () => {
    const result = service.applyPercentDiscount(1000, 10);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.discountInCents).toBe(100);
      expect(result.data.finalPriceInCents).toBe(900);
    }
  });

  it('allows 0% discount', () => {
    const result = service.applyPercentDiscount(1000, 0);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.discountInCents).toBe(0);
  });

  it(`allows ${MAX_DISCOUNT_PERCENT}% discount`, () => {
    const result = service.applyPercentDiscount(1000, MAX_DISCOUNT_PERCENT);
    expect(result.success).toBe(true);
  });

  it(`rejects discount above ${MAX_DISCOUNT_PERCENT}%`, () => {
    const result = service.applyPercentDiscount(1000, MAX_DISCOUNT_PERCENT + 1);
    expect(result.success).toBe(false);
  });

  it('rejects negative percent', () => {
    const result = service.applyPercentDiscount(1000, -5);
    expect(result.success).toBe(false);
  });
});

describe('DiscountService.applyFixedDiscount', () => {
  it('applies a valid fixed discount', () => {
    const result = service.applyFixedDiscount(1000, 200);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.discountInCents).toBe(200);
      expect(result.data.finalPriceInCents).toBe(800);
    }
  });

  it('rejects a discount exceeding the subtotal', () => {
    const result = service.applyFixedDiscount(1000, 1001);
    expect(result.success).toBe(false);
  });

  it('rejects a negative discount', () => {
    const result = service.applyFixedDiscount(1000, -100);
    expect(result.success).toBe(false);
  });

  it('allows an exact 100% discount', () => {
    const result = service.applyFixedDiscount(1000, 1000);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.finalPriceInCents).toBe(0);
  });
});

describe('DiscountService.validateCoupon', () => {
  it('applies the SAVE10 coupon', () => {
    const result = service.validateCoupon('SAVE10', 1000);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.discountInCents).toBe(100);
  });

  it('applies the SAVE5 coupon above minimum spend', () => {
    const result = service.validateCoupon('SAVE5', 1000);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.discountInCents).toBe(500);
  });

  it('rejects SAVE5 below minimum spend', () => {
    const result = service.validateCoupon('SAVE5', 500);
    expect(result.success).toBe(false);
  });

  it('rejects an unknown coupon code', () => {
    const result = service.validateCoupon('INVALID', 1000);
    expect(result.success).toBe(false);
  });

  it('is case-insensitive', () => {
    const result = service.validateCoupon('save10', 1000);
    expect(result.success).toBe(true);
  });
});
