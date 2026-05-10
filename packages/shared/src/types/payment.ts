/**
 * Supported payment methods.
 */
export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  SPLIT = 'SPLIT',
}

/**
 * Represents a payment applied to an order.
 */
export interface IPayment {
  id: number;
  orderId: number;
  method: PaymentMethod;
  /** Amount paid via this payment record, in cents */
  amountInCents: number;
  /** For cash payments: how much the customer tendered, in cents */
  tenderedInCents: number | null;
  /** For cash payments: change given back, in cents */
  changeInCents: number | null;
  /** Card transaction reference ID, if applicable */
  transactionRef: string | null;
  createdAt: Date;
}

/**
 * Data required to record a cash payment.
 */
export interface CashPaymentDTO {
  method: PaymentMethod.CASH;
  amountInCents: number;
  tenderedInCents: number;
}

/**
 * Data required to record a card payment.
 */
export interface CardPaymentDTO {
  method: PaymentMethod.CARD;
  amountInCents: number;
  transactionRef: string;
}

/**
 * Union type covering all supported payment DTOs.
 */
export type PaymentDTO = CashPaymentDTO | CardPaymentDTO;
