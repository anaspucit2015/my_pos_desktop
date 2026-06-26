/**
 * Reason codes for a return transaction.
 */
export enum ReturnReason {
  DEFECTIVE = 'DEFECTIVE',
  WRONG_ITEM = 'WRONG_ITEM',
  CUSTOMER_REQUEST = 'CUSTOMER_REQUEST',
  OTHER = 'OTHER',
}

/**
 * Method used to issue the refund.
 */
export enum RefundMethod {
  CASH = 'CASH',
  CARD_CREDIT = 'CARD_CREDIT',
  STORE_CREDIT = 'STORE_CREDIT',
}

/**
 * A single product line within a return transaction.
 */
export interface IReturnItem {
  id: number;
  returnId: number;
  orderItemId: number;
  productId: number;
  /** Resolved product name, null if product was deleted */
  productName: string | null;
  quantityReturned: number;
  /** Price per unit at time of original sale, in cents */
  unitPriceInCents: number;
  subtotalInCents: number;
}

/**
 * A complete return transaction linked to an original order.
 */
export interface IReturn {
  id: number;
  returnNumber: string;
  originalOrderId: number;
  cashierId: number;
  reason: ReturnReason;
  refundMethod: RefundMethod;
  refundAmountInCents: number;
  notes: string | null;
  items: IReturnItem[];
  createdAt: Date;
}

/**
 * Data required to create a return for one or more items from an order.
 */
export interface CreateReturnDTO {
  originalOrderId: number;
  cashierId: number;
  reason: ReturnReason;
  refundMethod: RefundMethod;
  /** Total refund amount in cents, calculated from returned items */
  refundAmountInCents: number;
  notes?: string;
  items: CreateReturnItemDTO[];
}

/**
 * A single line item within a CreateReturnDTO.
 */
export interface CreateReturnItemDTO {
  /** The order_items.id from the original order */
  orderItemId: number;
  productId: number;
  quantityReturned: number;
  unitPriceInCents: number;
}
