import type { IProduct } from './product.js';
import type { ICustomer } from './customer.js';
import type { IPayment } from './payment.js';

/**
 * Lifecycle states of an order.
 */
export enum OrderStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  VOIDED = 'VOIDED',
  REFUNDED = 'REFUNDED',
}

/**
 * A single line item within an order.
 */
export interface IOrderItem {
  id: number;
  orderId: number;
  productId: number;
  product: IProduct | null;
  quantity: number;
  /** Unit price at time of sale, in cents */
  unitPriceInCents: number;
  /** Discount applied to this line item, in cents */
  discountInCents: number;
  /** subtotalInCents = (unitPriceInCents * quantity) - discountInCents */
  subtotalInCents: number;
}

/**
 * Represents a completed or in-progress sales order.
 */
export interface IOrder {
  id: number;
  orderNumber: string;
  customerId: number | null;
  customer: ICustomer | null;
  cashierId: number;
  status: OrderStatus;
  items: IOrderItem[];
  payments: IPayment[];
  /** Sum of all line item subtotals, before tax, in cents */
  subtotalInCents: number;
  /** Tax amount in cents */
  taxInCents: number;
  /** Order-level discount in cents */
  discountInCents: number;
  /** Final amount charged: subtotal + tax - discount */
  totalInCents: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Data required to create a new order.
 */
export interface CreateOrderDTO {
  customerId?: number;
  cashierId: number;
  items: CreateOrderItemDTO[];
  discountInCents?: number;
  notes?: string;
}

/**
 * Data for a single order line item during creation.
 */
export interface CreateOrderItemDTO {
  productId: number;
  quantity: number;
  unitPriceInCents: number;
  discountInCents?: number;
}
