import type { IOrder, IUser, ICustomer, IPayment } from '@my-pos/shared';
import { formatCurrency } from '@my-pos/shared';

/**
 * A single printed line on the receipt.
 */
export interface ReceiptLine {
  name: string;
  sku: string;
  quantity: number;
  unitPriceInCents: number;
  discountInCents: number;
  subtotalInCents: number;
  /** Human-readable formatted subtotal, e.g. "$12.99" */
  formattedSubtotal: string;
}

/**
 * A payment entry on the receipt.
 */
export interface ReceiptPayment {
  method: string;
  amountInCents: number;
  tenderedInCents: number | null;
  changeInCents: number | null;
  formattedAmount: string;
}

/**
 * Complete data structure for printing or displaying a receipt.
 * Built from a completed IOrder by Receipt.fromOrder().
 */
export class Receipt {
  readonly orderNumber: string;
  readonly cashierName: string;
  readonly customerName: string | null;
  readonly lines: readonly ReceiptLine[];
  readonly subtotalInCents: number;
  readonly discountInCents: number;
  readonly taxInCents: number;
  readonly totalInCents: number;
  readonly payments: readonly ReceiptPayment[];
  readonly changeInCents: number;
  readonly printedAt: Date;

  private constructor(data: {
    orderNumber: string;
    cashierName: string;
    customerName: string | null;
    lines: ReceiptLine[];
    subtotalInCents: number;
    discountInCents: number;
    taxInCents: number;
    totalInCents: number;
    payments: ReceiptPayment[];
    changeInCents: number;
    printedAt: Date;
  }) {
    this.orderNumber = data.orderNumber;
    this.cashierName = data.cashierName;
    this.customerName = data.customerName;
    this.lines = Object.freeze(data.lines);
    this.subtotalInCents = data.subtotalInCents;
    this.discountInCents = data.discountInCents;
    this.taxInCents = data.taxInCents;
    this.totalInCents = data.totalInCents;
    this.payments = Object.freeze(data.payments);
    this.changeInCents = data.changeInCents;
    this.printedAt = data.printedAt;
  }

  get formattedSubtotal(): string {
    return formatCurrency(this.subtotalInCents);
  }

  get formattedTax(): string {
    return formatCurrency(this.taxInCents);
  }

  get formattedTotal(): string {
    return formatCurrency(this.totalInCents);
  }

  get formattedChange(): string {
    return formatCurrency(this.changeInCents);
  }

  /**
   * Builds a Receipt from a completed IOrder, cashier, and optional customer.
   */
  static fromOrder(order: IOrder, cashier: IUser, customer: ICustomer | null): Receipt {
    const lines: ReceiptLine[] = order.items.map((item) => ({
      name: item.product?.name ?? `Product #${item.productId}`,
      sku: item.product?.sku ?? '',
      quantity: item.quantity,
      unitPriceInCents: item.unitPriceInCents,
      discountInCents: item.discountInCents,
      subtotalInCents: item.subtotalInCents,
      formattedSubtotal: formatCurrency(item.subtotalInCents),
    }));

    const receiptPayments: ReceiptPayment[] = order.payments.map((p: IPayment) => ({
      method: p.method,
      amountInCents: p.amountInCents,
      tenderedInCents: p.tenderedInCents,
      changeInCents: p.changeInCents,
      formattedAmount: formatCurrency(p.amountInCents),
    }));

    const changeInCents = order.payments.reduce(
      (sum, p) => sum + (p.changeInCents ?? 0),
      0,
    );

    const customerName =
      customer !== null ? `${customer.firstName} ${customer.lastName}` : null;

    return new Receipt({
      orderNumber: order.orderNumber,
      cashierName: `${cashier.firstName} ${cashier.lastName}`,
      customerName,
      lines,
      subtotalInCents: order.subtotalInCents,
      discountInCents: order.discountInCents,
      taxInCents: order.taxInCents,
      totalInCents: order.totalInCents,
      payments: receiptPayments,
      changeInCents,
      printedAt: new Date(),
    });
  }
}
