import { CartService } from './CartService.js';
import { Cart } from '../models/Cart.js';
import type { IProduct } from '@my-pos/shared';

const service = new CartService();

function makeProduct(overrides: Partial<IProduct> = {}): IProduct {
  return {
    id: 1,
    sku: 'TEST-001',
    barcode: null,
    name: 'Test Product',
    description: null,
    categoryId: null,
    category: null,
    priceInCents: 1000,
    costInCents: 400,
    stockQuantity: 50,
    lowStockThreshold: 5,
    isActive: true,
    imageUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('CartService.addItem', () => {
  it('adds a new item to an empty cart', () => {
    const result = service.addItem(new Cart(), makeProduct(), 2);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items).toHaveLength(1);
      expect(result.data.items[0]?.quantity).toBe(2);
    }
  });

  it('increments quantity when the same product is added twice', () => {
    const cart = new Cart();
    const r1 = service.addItem(cart, makeProduct(), 1);
    expect(r1.success).toBe(true);
    const r2 = service.addItem(r1.success ? r1.data : cart, makeProduct(), 3);
    expect(r2.success).toBe(true);
    if (r2.success) expect(r2.data.items[0]?.quantity).toBe(4);
  });

  it('rejects quantity of zero', () => {
    expect(service.addItem(new Cart(), makeProduct(), 0).success).toBe(false);
  });

  it('rejects inactive products', () => {
    const result = service.addItem(new Cart(), makeProduct({ isActive: false }), 1);
    expect(result.success).toBe(false);
  });

  it('rejects quantity exceeding stock', () => {
    const result = service.addItem(new Cart(), makeProduct({ stockQuantity: 3 }), 5);
    expect(result.success).toBe(false);
  });
});

describe('CartService.removeItem', () => {
  it('removes an item by product id', () => {
    const r1 = service.addItem(new Cart(), makeProduct({ id: 1 }), 1);
    expect(r1.success).toBe(true);
    const r2 = service.removeItem(r1.success ? r1.data : new Cart(), 1);
    expect(r2.success).toBe(true);
    if (r2.success) expect(r2.data.isEmpty).toBe(true);
  });

  it('returns an error for a product not in the cart', () => {
    const result = service.removeItem(new Cart(), 999);
    expect(result.success).toBe(false);
  });
});

describe('CartService.updateQty', () => {
  it('updates the quantity for an existing item', () => {
    const r1 = service.addItem(new Cart(), makeProduct({ id: 1 }), 1);
    const r2 = service.updateQty(r1.success ? r1.data : new Cart(), 1, 5);
    expect(r2.success).toBe(true);
    if (r2.success) expect(r2.data.items[0]?.quantity).toBe(5);
  });

  it('removes the item when quantity is set to 0', () => {
    const r1 = service.addItem(new Cart(), makeProduct({ id: 1 }), 3);
    const r2 = service.updateQty(r1.success ? r1.data : new Cart(), 1, 0);
    expect(r2.success).toBe(true);
    if (r2.success) expect(r2.data.isEmpty).toBe(true);
  });

  it('rejects negative quantity', () => {
    const r1 = service.addItem(new Cart(), makeProduct({ id: 1 }), 1);
    const r2 = service.updateQty(r1.success ? r1.data : new Cart(), 1, -1);
    expect(r2.success).toBe(false);
  });
});

describe('CartService.applyPercentDiscount', () => {
  it('sets the order-level discount', () => {
    const r1 = service.addItem(new Cart(), makeProduct({ priceInCents: 1000 }), 1);
    const r2 = service.applyPercentDiscount(r1.success ? r1.data : new Cart(), 10);
    expect(r2.success).toBe(true);
    if (r2.success) expect(r2.data.orderDiscountInCents).toBe(100);
  });
});

describe('CartService.calculateTotals', () => {
  it('returns correct totals with a discount', () => {
    const r1 = service.addItem(new Cart(), makeProduct({ priceInCents: 1000 }), 2);
    expect(r1.success).toBe(true);
    const cart = r1.success ? r1.data : new Cart();
    const r2 = service.applyFixedDiscount(cart, 200);
    expect(r2.success).toBe(true);
    const totals = service.calculateTotals(r2.success ? r2.data : cart);

    expect(totals.subtotalInCents).toBe(2000);
    expect(totals.discountInCents).toBe(200);
    // taxable = 1800; tax at 8% = 144
    expect(totals.taxInCents).toBe(144);
    expect(totals.totalInCents).toBe(1944);
  });
});

describe('CartService.holdCart / resumeCart', () => {
  it('holds a cart and resumes it', () => {
    const r1 = service.addItem(new Cart(), makeProduct({ id: 1 }), 1);
    expect(r1.success).toBe(true);
    const cart = r1.success ? r1.data : new Cart();

    const holdResult = service.holdCart(cart);
    expect(holdResult.success).toBe(true);
    if (!holdResult.success) return;

    expect(holdResult.data.newCart.isEmpty).toBe(true);

    const resumeResult = service.resumeCart(holdResult.data.holdId);
    expect(resumeResult.success).toBe(true);
    if (resumeResult.success) expect(resumeResult.data.items[0]?.product.id).toBe(1);
  });

  it('rejects holding an empty cart', () => {
    const result = service.holdCart(new Cart());
    expect(result.success).toBe(false);
  });

  it('returns an error for an unknown hold id', () => {
    const result = service.resumeCart('nonexistent');
    expect(result.success).toBe(false);
  });
});
