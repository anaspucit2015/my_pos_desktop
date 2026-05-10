import { ok, err, type Result, MAX_CART_ITEMS } from '@my-pos/shared';
import type { IProduct } from '@my-pos/shared';
import { Cart, type CartItem } from '../models/Cart.js';
import { DiscountService } from './DiscountService.js';

/** Serialisable representation of a held cart stored in memory */
interface HeldCart {
  id: string;
  cart: Cart;
  heldAt: Date;
}

/**
 * Stateful service managing active and held carts.
 * Hold state is in-memory — appropriate for a single-register desktop app.
 */
export class CartService {
  private readonly heldCarts = new Map<string, HeldCart>();
  private readonly discountService = new DiscountService();

  /**
   * Adds a product to the cart. If the product already exists, its quantity
   * is incremented. Returns a new Cart instance.
   *
   * @param cart - Current cart state.
   * @param product - Product to add.
   * @param quantity - Number of units to add (default 1).
   */
  addItem(cart: Cart, product: IProduct, quantity = 1): Result<Cart, Error> {
    if (quantity <= 0) return err(new Error('Quantity must be positive'));
    if (!product.isActive) return err(new Error(`Product "${product.name}" is not active`));

    const existingIndex = cart.items.findIndex((i) => i.product.id === product.id);
    let newItems: CartItem[];

    if (existingIndex >= 0) {
      const existing = cart.items[existingIndex]!;
      const newQty = existing.quantity + quantity;
      if (newQty > product.stockQuantity) {
        return err(
          new Error(
            `Insufficient stock for "${product.name}": requested ${newQty}, available ${product.stockQuantity}`,
          ),
        );
      }
      newItems = cart.items.map((item, idx) =>
        idx === existingIndex ? { ...item, quantity: newQty } : item,
      );
    } else {
      if (cart.items.length >= MAX_CART_ITEMS) {
        return err(new Error(`Cart cannot exceed ${MAX_CART_ITEMS} line items`));
      }
      if (quantity > product.stockQuantity) {
        return err(
          new Error(
            `Insufficient stock for "${product.name}": requested ${quantity}, available ${product.stockQuantity}`,
          ),
        );
      }
      const newItem: CartItem = {
        product,
        quantity,
        unitPriceInCents: product.priceInCents,
        discountInCents: 0,
      };
      newItems = [...cart.items, newItem];
    }

    return ok(new Cart(newItems, cart.orderDiscountInCents));
  }

  /**
   * Removes a line item from the cart by product id.
   *
   * @param cart - Current cart state.
   * @param productId - ID of the product to remove.
   */
  removeItem(cart: Cart, productId: number): Result<Cart, Error> {
    const newItems = cart.items.filter((i) => i.product.id !== productId);
    if (newItems.length === cart.items.length) {
      return err(new Error(`Product ${productId} is not in the cart`));
    }
    return ok(new Cart(newItems, cart.orderDiscountInCents));
  }

  /**
   * Sets the quantity for a specific line item.
   * Passing quantity 0 removes the item.
   *
   * @param cart - Current cart state.
   * @param productId - ID of the product to update.
   * @param quantity - New quantity (0 to remove).
   */
  updateQty(cart: Cart, productId: number, quantity: number): Result<Cart, Error> {
    if (quantity < 0) return err(new Error('Quantity cannot be negative'));
    if (quantity === 0) return this.removeItem(cart, productId);

    const item = cart.items.find((i) => i.product.id === productId);
    if (!item) return err(new Error(`Product ${productId} is not in the cart`));

    if (quantity > item.product.stockQuantity) {
      return err(
        new Error(
          `Insufficient stock for "${item.product.name}": requested ${quantity}, available ${item.product.stockQuantity}`,
        ),
      );
    }

    const newItems = cart.items.map((i) =>
      i.product.id === productId ? { ...i, quantity } : i,
    );
    return ok(new Cart(newItems, cart.orderDiscountInCents));
  }

  /**
   * Applies a percentage discount at the order level.
   *
   * @param cart - Current cart state.
   * @param percent - Discount percentage (0–MAX_DISCOUNT_PERCENT).
   */
  applyPercentDiscount(cart: Cart, percent: number): Result<Cart, Error> {
    const result = this.discountService.applyPercentDiscount(cart.subtotalInCents, percent);
    if (!result.success) return result;
    return ok(new Cart([...cart.items], result.data.discountInCents));
  }

  /**
   * Applies a fixed amount discount at the order level.
   *
   * @param cart - Current cart state.
   * @param discountInCents - Fixed discount in cents.
   */
  applyFixedDiscount(cart: Cart, discountInCents: number): Result<Cart, Error> {
    const result = this.discountService.applyFixedDiscount(cart.subtotalInCents, discountInCents);
    if (!result.success) return result;
    return ok(new Cart([...cart.items], result.data.discountInCents));
  }

  /**
   * Applies a coupon code to the cart.
   *
   * @param cart - Current cart state.
   * @param code - Coupon code string.
   */
  applyCoupon(cart: Cart, code: string): Result<Cart, Error> {
    const result = this.discountService.validateCoupon(code, cart.subtotalInCents);
    if (!result.success) return result;
    return ok(new Cart([...cart.items], result.data.discountInCents));
  }

  /**
   * Returns the current totals of the cart.
   */
  calculateTotals(cart: Cart): {
    subtotalInCents: number;
    discountInCents: number;
    taxInCents: number;
    totalInCents: number;
    itemCount: number;
  } {
    return {
      subtotalInCents: cart.subtotalInCents,
      discountInCents: cart.orderDiscountInCents,
      taxInCents: cart.taxInCents,
      totalInCents: cart.totalInCents,
      itemCount: cart.itemCount,
    };
  }

  /**
   * Holds the current cart aside, returning its hold ID and an empty new cart.
   *
   * @param cart - The cart to place on hold.
   * @returns An object with the new empty cart and the hold ID.
   */
  holdCart(cart: Cart): Result<{ newCart: Cart; holdId: string }, Error> {
    if (cart.isEmpty) return err(new Error('Cannot hold an empty cart'));

    const holdId = `hold_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const heldAt = new Date();
    this.heldCarts.set(holdId, { id: holdId, cart, heldAt });

    return ok({ newCart: new Cart(), holdId });
  }

  /**
   * Resumes a previously held cart by its hold ID.
   *
   * @param holdId - The ID returned by holdCart.
   */
  resumeCart(holdId: string): Result<Cart, Error> {
    const held = this.heldCarts.get(holdId);
    if (!held) return err(new Error(`No held cart found with ID: ${holdId}`));
    this.heldCarts.delete(holdId);
    return ok(held.cart);
  }

  /**
   * Lists all currently held carts.
   */
  listHeldCarts(): Array<{ holdId: string; itemCount: number; totalInCents: number; heldAt: Date }> {
    return Array.from(this.heldCarts.values()).map((h) => ({
      holdId: h.id,
      itemCount: h.cart.itemCount,
      totalInCents: h.cart.totalInCents,
      heldAt: h.heldAt,
    }));
  }

  /**
   * Clears all items and discounts, returning a fresh empty cart.
   */
  clearCart(): Cart {
    return new Cart();
  }
}
