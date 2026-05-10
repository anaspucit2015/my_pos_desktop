import { create } from 'zustand';
import type { IProduct } from '@my-pos/shared';
import { TAX_RATE } from '@my-pos/shared';

export interface CartItem {
  product: IProduct;
  quantity: number;
  /** Unit price captured at add-time (in cents) */
  unitPriceInCents: number;
  /** Line-item discount in cents */
  discountInCents: number;
}

interface HeldCart {
  items: CartItem[];
  discountInCents: number;
  heldAt: Date;
}

interface CartState {
  items: CartItem[];
  /** Order-level discount in cents */
  discountInCents: number;
  heldCarts: HeldCart[];

  // ── Computed helpers (not stored, derived on read) ──────────────────────────
  /** Sum of (unitPrice * qty - lineDiscount) for all items, in cents */
  subtotal(): number;
  /** Tax amount in cents, based on TAX_RATE */
  tax(): number;
  /** Final total in cents */
  total(): number;

  // ── Actions ─────────────────────────────────────────────────────────────────
  /** Add one unit of a product, or increment qty if already in cart. */
  addItem(product: IProduct): void;
  /** Remove a product line entirely. */
  removeItem(productId: number): void;
  /** Set quantity for a product. Removes the item if qty <= 0. */
  updateQuantity(productId: number, qty: number): void;
  /** Apply or replace the order-level discount. */
  applyDiscount(cents: number): void;
  /** Clear all items and discounts. */
  clearCart(): void;
  /** Save the current cart and start a fresh one. */
  holdCart(): void;
  /** Restore a previously held cart by index and remove it from holds. */
  resumeCart(index: number): void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  discountInCents: 0,
  heldCarts: [],

  subtotal() {
    return get().items.reduce((sum, item) => {
      const lineTotal = item.unitPriceInCents * item.quantity - item.discountInCents;
      return sum + lineTotal;
    }, 0);
  },

  tax() {
    return Math.round(get().subtotal() * TAX_RATE);
  },

  total() {
    const s = get();
    return s.subtotal() + s.tax() - s.discountInCents;
  },

  addItem(product) {
    set((state) => {
      const existing = state.items.find((i) => i.product.id === product.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
          ),
        };
      }
      const newItem: CartItem = {
        product,
        quantity: 1,
        unitPriceInCents: product.priceInCents,
        discountInCents: 0,
      };
      return { items: [...state.items, newItem] };
    });
  },

  removeItem(productId) {
    set((state) => ({
      items: state.items.filter((i) => i.product.id !== productId),
    }));
  },

  updateQuantity(productId, qty) {
    if (qty <= 0) {
      get().removeItem(productId);
      return;
    }
    set((state) => ({
      items: state.items.map((i) =>
        i.product.id === productId ? { ...i, quantity: qty } : i,
      ),
    }));
  },

  applyDiscount(cents) {
    set({ discountInCents: cents });
  },

  clearCart() {
    set({ items: [], discountInCents: 0 });
  },

  holdCart() {
    const { items, discountInCents, heldCarts } = get();
    if (items.length === 0) return;
    set({
      heldCarts: [...heldCarts, { items, discountInCents, heldAt: new Date() }],
      items: [],
      discountInCents: 0,
    });
  },

  resumeCart(index) {
    const { heldCarts } = get();
    const held = heldCarts[index];
    if (!held) return;
    set({
      items: held.items,
      discountInCents: held.discountInCents,
      heldCarts: heldCarts.filter((_, i) => i !== index),
    });
  },
}));
