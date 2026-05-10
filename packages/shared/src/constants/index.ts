import { UserRole } from '../types/user.js';

/** Application display name */
export const APP_NAME = 'MyPOS' as const;

/** Default tax rate as a decimal (e.g. 0.08 = 8%) */
export const TAX_RATE = 0.08 as const;

/** Stock quantity at which a product is considered low */
export const LOW_STOCK_THRESHOLD = 10 as const;

/** Minimum PIN length for user authentication */
export const MIN_PIN_LENGTH = 4 as const;

/** Maximum PIN length for user authentication */
export const MAX_PIN_LENGTH = 6 as const;

/** Maximum number of items in a single cart */
export const MAX_CART_ITEMS = 100 as const;

/** Maximum discount percentage allowed without manager override */
export const MAX_DISCOUNT_PERCENT = 50 as const;

/** Loyalty points awarded per dollar spent (1 point per dollar) */
export const LOYALTY_POINTS_PER_DOLLAR = 1 as const;

/** Roles grouped for permission checks */
export const ROLES = {
  ALL: [UserRole.ADMIN, UserRole.CASHIER],
  ADMIN_ONLY: [UserRole.ADMIN],
} as const;

/** ISO 4217 currency code used for display */
export const CURRENCY_CODE = 'USD' as const;

/** Locale used for currency formatting */
export const CURRENCY_LOCALE = 'en-US' as const;
