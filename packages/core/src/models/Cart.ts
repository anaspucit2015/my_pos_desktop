import type { IProduct } from '@my-pos/shared';
import { calculateTax, MAX_CART_ITEMS } from '@my-pos/shared';

/**
 * A single item in the active cart.
 */
export interface CartItem {
  product: IProduct;
  quantity: number;
  /** Price captured at the time the item was added (in cents) */
  unitPriceInCents: number;
  /** Per-line discount in cents */
  discountInCents: number;
}

/**
 * Immutable snapshot of cart state with computed financial getters.
 * CartService produces new Cart instances rather than mutating this one.
 */
export class Cart {
  /** Ordered list of line items in this cart */
  readonly items: readonly CartItem[];
  /** Order-level discount applied on top of any line discounts (in cents) */
  readonly orderDiscountInCents: number;
  /** Non-null when this cart has been held aside for later resumption */
  readonly heldId: string | null;
  /** Timestamp when the cart was placed on hold */
  readonly heldAt: Date | null;

  constructor(
    items: CartItem[] = [],
    orderDiscountInCents = 0,
    heldId: string | null = null,
    heldAt: Date | null = null,
  ) {
    if (items.length > MAX_CART_ITEMS) {
      throw new Error(`Cart cannot exceed ${MAX_CART_ITEMS} line items`);
    }
    this.items = Object.freeze([...items]);
    this.orderDiscountInCents = orderDiscountInCents;
    this.heldId = heldId;
    this.heldAt = heldAt;
  }

  /** Sum of all line subtotals before the order-level discount (in cents) */
  get subtotalInCents(): number {
    return this.items.reduce(
      (sum, item) => sum + item.unitPriceInCents * item.quantity - item.discountInCents,
      0,
    );
  }

  /** Tax calculated on (subtotal − order discount) */
  get taxInCents(): number {
    const taxableAmount = Math.max(0, this.subtotalInCents - this.orderDiscountInCents);
    return calculateTax(taxableAmount);
  }

  /** Grand total: subtotal − order discount + tax */
  get totalInCents(): number {
    return Math.max(0, this.subtotalInCents - this.orderDiscountInCents) + this.taxInCents;
  }

  /** Total number of individual units across all line items */
  get itemCount(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  get isEmpty(): boolean {
    return this.items.length === 0;
  }

  get isOnHold(): boolean {
    return this.heldId !== null;
  }
}
