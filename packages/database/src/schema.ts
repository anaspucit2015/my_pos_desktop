import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ─── Categories ──────────────────────────────────────────────────────────────

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  description: text('description'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ─── Products ────────────────────────────────────────────────────────────────

export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sku: text('sku').notNull().unique(),
  barcode: text('barcode').unique(),
  name: text('name').notNull(),
  description: text('description'),
  categoryId: integer('category_id').references(() => categories.id, { onDelete: 'set null' }),
  /** Price in cents */
  priceInCents: integer('price_in_cents').notNull(),
  /** Cost in cents */
  costInCents: integer('cost_in_cents').notNull().default(0),
  stockQuantity: integer('stock_quantity').notNull().default(0),
  lowStockThreshold: integer('low_stock_threshold').notNull().default(10),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  imageUrl: text('image_url'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ─── Customers ───────────────────────────────────────────────────────────────

export const customers = sqliteTable('customers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').unique(),
  phone: text('phone'),
  loyaltyPoints: integer('loyalty_points').notNull().default(0),
  notes: text('notes'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ─── Users ───────────────────────────────────────────────────────────────────

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  /** bcrypt or argon2 hash of the PIN */
  pinHash: text('pin_hash').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  /** 'ADMIN' | 'CASHIER' */
  role: text('role').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ─── Orders ──────────────────────────────────────────────────────────────────

export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderNumber: text('order_number').notNull().unique(),
  customerId: integer('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  cashierId: integer('cashier_id')
    .notNull()
    .references(() => users.id),
  /** 'PENDING' | 'COMPLETED' | 'VOIDED' | 'REFUNDED' */
  status: text('status').notNull().default('PENDING'),
  subtotalInCents: integer('subtotal_in_cents').notNull().default(0),
  taxInCents: integer('tax_in_cents').notNull().default(0),
  discountInCents: integer('discount_in_cents').notNull().default(0),
  totalInCents: integer('total_in_cents').notNull().default(0),
  notes: text('notes'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ─── Order Items ─────────────────────────────────────────────────────────────

export const orderItems = sqliteTable('order_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id),
  quantity: integer('quantity').notNull(),
  unitPriceInCents: integer('unit_price_in_cents').notNull(),
  discountInCents: integer('discount_in_cents').notNull().default(0),
  subtotalInCents: integer('subtotal_in_cents').notNull(),
});

// ─── Payments ────────────────────────────────────────────────────────────────

export const payments = sqliteTable('payments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  /** 'CASH' | 'CARD' | 'SPLIT' */
  method: text('method').notNull(),
  amountInCents: integer('amount_in_cents').notNull(),
  tenderedInCents: integer('tendered_in_cents'),
  changeInCents: integer('change_in_cents'),
  transactionRef: text('transaction_ref'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ─── Stock Adjustments (audit log) ───────────────────────────────────────────

export const stockAdjustments = sqliteTable('stock_adjustments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  /** Signed delta: positive = stock added, negative = stock removed */
  delta: integer('delta').notNull(),
  quantityBefore: integer('quantity_before').notNull(),
  quantityAfter: integer('quantity_after').notNull(),
  reason: text('reason').notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ─── Returns ─────────────────────────────────────────────────────────────────

export const returns = sqliteTable('returns', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  returnNumber: text('return_number').notNull().unique(),
  originalOrderId: integer('original_order_id')
    .notNull()
    .references(() => orders.id),
  cashierId: integer('cashier_id')
    .notNull()
    .references(() => users.id),
  /** 'DEFECTIVE' | 'WRONG_ITEM' | 'CUSTOMER_REQUEST' | 'OTHER' */
  reason: text('reason').notNull(),
  /** 'CASH' | 'CARD_CREDIT' | 'STORE_CREDIT' */
  refundMethod: text('refund_method').notNull(),
  refundAmountInCents: integer('refund_amount_in_cents').notNull(),
  notes: text('notes'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const returnItems = sqliteTable('return_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  returnId: integer('return_id')
    .notNull()
    .references(() => returns.id, { onDelete: 'cascade' }),
  orderItemId: integer('order_item_id')
    .notNull()
    .references(() => orderItems.id),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id),
  quantityReturned: integer('quantity_returned').notNull(),
  unitPriceInCents: integer('unit_price_in_cents').notNull(),
  subtotalInCents: integer('subtotal_in_cents').notNull(),
});

// ─── Schema type exports (used by repositories) ──────────────────────────────

export type CategoryRow = typeof categories.$inferSelect;
export type NewCategoryRow = typeof categories.$inferInsert;

export type ProductRow = typeof products.$inferSelect;
export type NewProductRow = typeof products.$inferInsert;

export type CustomerRow = typeof customers.$inferSelect;
export type NewCustomerRow = typeof customers.$inferInsert;

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;

export type OrderRow = typeof orders.$inferSelect;
export type NewOrderRow = typeof orders.$inferInsert;

export type OrderItemRow = typeof orderItems.$inferSelect;
export type NewOrderItemRow = typeof orderItems.$inferInsert;

export type PaymentRow = typeof payments.$inferSelect;
export type NewPaymentRow = typeof payments.$inferInsert;

export type StockAdjustmentRow = typeof stockAdjustments.$inferSelect;
export type NewStockAdjustmentRow = typeof stockAdjustments.$inferInsert;

export type ReturnRow = typeof returns.$inferSelect;
export type NewReturnRow = typeof returns.$inferInsert;

export type ReturnItemRow = typeof returnItems.$inferSelect;
export type NewReturnItemRow = typeof returnItems.$inferInsert;
