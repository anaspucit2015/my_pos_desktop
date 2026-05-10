import { MAX_DISCOUNT_PERCENT } from '@my-pos/shared';
import { ok, err, type Result } from '@my-pos/shared';

export interface DiscountResult {
  discountInCents: number;
  finalPriceInCents: number;
}

/**
 * Stateless service for discount validation and application.
 */
export class DiscountService {
  /**
   * Applies a percentage discount to a subtotal.
   *
   * @param subtotalInCents - The amount to discount, in cents.
   * @param percent - Percentage to discount (0–MAX_DISCOUNT_PERCENT).
   * @returns DiscountResult or an error if the percentage is out of range.
   */
  applyPercentDiscount(
    subtotalInCents: number,
    percent: number,
  ): Result<DiscountResult, Error> {
    if (percent < 0 || percent > MAX_DISCOUNT_PERCENT) {
      return err(
        new Error(`Discount must be between 0% and ${MAX_DISCOUNT_PERCENT}%`),
      );
    }

    const discountInCents = Math.round(subtotalInCents * (percent / 100));
    return ok({
      discountInCents,
      finalPriceInCents: subtotalInCents - discountInCents,
    });
  }

  /**
   * Applies a fixed amount discount to a subtotal.
   *
   * @param subtotalInCents - The amount to discount, in cents.
   * @param discountInCents - Fixed discount amount in cents.
   * @returns DiscountResult or an error if the discount exceeds the subtotal.
   */
  applyFixedDiscount(
    subtotalInCents: number,
    discountInCents: number,
  ): Result<DiscountResult, Error> {
    if (discountInCents < 0) {
      return err(new Error('Discount amount cannot be negative'));
    }
    if (discountInCents > subtotalInCents) {
      return err(new Error('Discount cannot exceed the subtotal'));
    }

    return ok({
      discountInCents,
      finalPriceInCents: subtotalInCents - discountInCents,
    });
  }

  /**
   * Validates a coupon code and returns its discount value.
   * Currently a stub — real coupon storage would live in a CouponRepository.
   *
   * @param code - The coupon code string.
   * @param subtotalInCents - The cart subtotal to validate minimum spend against.
   */
  validateCoupon(
    code: string,
    subtotalInCents: number,
  ): Result<DiscountResult, Error> {
    // Hardcoded demo coupons — replace with a CouponRepository in a future step
    const DEMO_COUPONS: Record<string, { type: 'percent' | 'fixed'; value: number; minSpend: number }> = {
      SAVE10: { type: 'percent', value: 10, minSpend: 0 },
      SAVE5: { type: 'fixed', value: 500, minSpend: 1000 },
    };

    const coupon = DEMO_COUPONS[code.toUpperCase()];
    if (!coupon) {
      return err(new Error(`Invalid coupon code: ${code}`));
    }

    if (subtotalInCents < coupon.minSpend) {
      return err(
        new Error(
          `Minimum spend of ${coupon.minSpend / 100} required for this coupon`,
        ),
      );
    }

    if (coupon.type === 'percent') {
      return this.applyPercentDiscount(subtotalInCents, coupon.value);
    }

    return this.applyFixedDiscount(subtotalInCents, coupon.value);
  }
}
