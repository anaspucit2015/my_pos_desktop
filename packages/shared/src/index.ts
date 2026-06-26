// Types
export type { IProduct, IProductCategory, CreateProductDTO, UpdateProductDTO, CreateCategoryDTO, UpdateCategoryDTO } from './types/product.js';
export type { IOrder, IOrderItem, CreateOrderDTO, CreateOrderItemDTO } from './types/order.js';
export { OrderStatus } from './types/order.js';
export type { ICustomer, CreateCustomerDTO, UpdateCustomerDTO } from './types/customer.js';
export type { IUser, CreateUserDTO, UpdateUserDTO } from './types/user.js';
export { UserRole } from './types/user.js';
export type { IPayment, CashPaymentDTO, CardPaymentDTO, PaymentDTO } from './types/payment.js';
export { PaymentMethod } from './types/payment.js';
export type { IReturn, IReturnItem, CreateReturnDTO, CreateReturnItemDTO } from './types/return.js';
export { ReturnReason, RefundMethod } from './types/return.js';

// Constants
export {
  APP_NAME,
  TAX_RATE,
  LOW_STOCK_THRESHOLD,
  MIN_PIN_LENGTH,
  MAX_PIN_LENGTH,
  MAX_CART_ITEMS,
  MAX_DISCOUNT_PERCENT,
  LOYALTY_POINTS_PER_DOLLAR,
  ROLES,
  CURRENCY_CODE,
  CURRENCY_LOCALE,
} from './constants/index.js';

// Utils
export { formatCurrency, dollarsToCents, centsToDollars } from './utils/currency.js';
export { calculateTax, calculateTotal, extractTax } from './utils/tax.js';
export { ok, err, isOk, isErr, unwrap } from './utils/result.js';
export type { Result, Ok, Err } from './utils/result.js';
