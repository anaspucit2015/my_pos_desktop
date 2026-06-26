import { eq, gte, lte, and, desc } from 'drizzle-orm';
import type { Db } from '../db.js';
import { orders, orderItems, payments, products } from '../schema.js';
import type { IOrder, IOrderItem, IPayment, IProduct, CreateOrderDTO, OrderStatus } from '@my-pos/shared';
import { ok, err, type Result } from '@my-pos/shared';
import { PaymentMethod } from '@my-pos/shared';

// ─── Mappers ─────────────────────────────────────────────────────────────────

function mapPayment(row: typeof payments.$inferSelect): IPayment {
  return {
    id: row.id,
    orderId: row.orderId,
    method: row.method as IPayment['method'],
    amountInCents: row.amountInCents,
    tenderedInCents: row.tenderedInCents ?? null,
    changeInCents: row.changeInCents ?? null,
    transactionRef: row.transactionRef ?? null,
    createdAt: new Date(row.createdAt),
  };
}

function mapOrderItem(row: typeof orderItems.$inferSelect): IOrderItem {
  return {
    id: row.id,
    orderId: row.orderId,
    productId: row.productId,
    product: null, // hydrated separately when needed
    quantity: row.quantity,
    unitPriceInCents: row.unitPriceInCents,
    discountInCents: row.discountInCents,
    subtotalInCents: row.subtotalInCents,
  };
}

function mapOrder(
  row: typeof orders.$inferSelect,
  items: IOrderItem[],
  paymentList: IPayment[],
): IOrder {
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    customerId: row.customerId ?? null,
    customer: null, // hydrated separately when needed
    cashierId: row.cashierId,
    status: row.status as IOrder['status'],
    items,
    payments: paymentList,
    subtotalInCents: row.subtotalInCents,
    taxInCents: row.taxInCents,
    discountInCents: row.discountInCents,
    totalInCents: row.totalInCents,
    notes: row.notes ?? null,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

// ─── Repository ──────────────────────────────────────────────────────────────

/**
 * Repository for all order, order item, and payment database operations.
 */
export class OrderRepository {
  constructor(private readonly db: Db) {}

  /**
   * Returns all orders, most recent first, with their items and payments.
   */
  async findAll(): Promise<Result<IOrder[], Error>> {
    try {
      const orderRows = await this.db
        .select()
        .from(orders)
        .orderBy(desc(orders.createdAt));

      const result = await Promise.all(orderRows.map((o) => this.hydrateOrder(o)));
      return ok(result);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /**
   * Finds a single order by its primary key, including items and payments.
   */
  async findById(id: number): Promise<Result<IOrder | null, Error>> {
    try {
      const row = await this.db.query.orders.findFirst({
        where: eq(orders.id, id),
      });

      if (!row) return ok(null);
      return ok(await this.hydrateOrder(row));
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /**
   * Returns all orders whose createdAt falls within the given date range.
   */
  async getByDateRange(from: Date, to: Date): Promise<Result<IOrder[], Error>> {
    try {
      const fromStr = from.toISOString();
      const toStr = to.toISOString();

      const orderRows = await this.db
        .select()
        .from(orders)
        .where(and(gte(orders.createdAt, fromStr), lte(orders.createdAt, toStr)))
        .orderBy(desc(orders.createdAt));

      const result = await Promise.all(orderRows.map((o) => this.hydrateOrder(o)));
      return ok(result);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /**
   * Creates a new order with its line items in a single transaction.
   * Does NOT process payment — call recordPayment separately.
   */
  async create(
    dto: CreateOrderDTO,
    subtotalInCents: number,
    taxInCents: number,
    totalInCents: number,
  ): Promise<Result<IOrder, Error>> {
    try {
      const orderNumber = this.generateOrderNumber();
      const discountInCents = dto.discountInCents ?? 0;

      let insertedId: number | undefined;

      // better-sqlite3 is synchronous; Drizzle wraps it — use a serialised block
      const insertedOrders = await this.db
        .insert(orders)
        .values({
          orderNumber,
          customerId: dto.customerId ?? null,
          cashierId: dto.cashierId,
          status: 'PENDING',
          subtotalInCents,
          taxInCents,
          discountInCents,
          totalInCents,
          notes: dto.notes ?? null,
        })
        .returning();

      const inserted = insertedOrders[0];
      if (!inserted) return err(new Error('Order insert returned no rows'));
      insertedId = inserted.id;

      // Insert line items
      const itemValues = dto.items.map((item) => ({
        orderId: insertedId!,
        productId: item.productId,
        quantity: item.quantity,
        unitPriceInCents: item.unitPriceInCents,
        discountInCents: item.discountInCents ?? 0,
        subtotalInCents:
          item.unitPriceInCents * item.quantity - (item.discountInCents ?? 0),
      }));

      await this.db.insert(orderItems).values(itemValues);

      const result = await this.findById(insertedId);
      if (result.success && result.data === null) {
        return err(new Error('Order not found immediately after insert'));
      }
      return result as Result<IOrder, Error>;
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /**
   * Updates the status of an existing order.
   */
  async updateStatus(id: number, status: OrderStatus): Promise<Result<IOrder, Error>> {
    try {
      await this.db
        .update(orders)
        .set({ status, updatedAt: new Date().toISOString() })
        .where(eq(orders.id, id));

      const result = await this.findById(id);
      if (result.success && result.data === null) {
        return err(new Error(`Order ${id} not found after status update`));
      }
      return result as Result<IOrder, Error>;
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /**
   * Records a payment against an order.
   */
  async recordPayment(
    orderId: number,
    method: PaymentMethod,
    amountInCents: number,
    tenderedInCents?: number,
    transactionRef?: string,
  ): Promise<Result<IPayment, Error>> {
    try {
      const changeInCents =
        method === PaymentMethod.CASH && tenderedInCents !== undefined
          ? tenderedInCents - amountInCents
          : null;

      const inserted = await this.db
        .insert(payments)
        .values({
          orderId,
          method,
          amountInCents,
          tenderedInCents: tenderedInCents ?? null,
          changeInCents,
          transactionRef: transactionRef ?? null,
        })
        .returning();

      const row = inserted[0];
      if (!row) return err(new Error('Payment insert returned no rows'));
      return ok(mapPayment(row));
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private async hydrateOrder(row: typeof orders.$inferSelect): Promise<IOrder> {
    const [itemRows, paymentRows] = await Promise.all([
      this.db.select().from(orderItems).where(eq(orderItems.orderId, row.id)),
      this.db.select().from(payments).where(eq(payments.orderId, row.id)),
    ]);

    // Hydrate each item with its product using individual lookups
    const hydratedItems: IOrderItem[] = await Promise.all(
      itemRows.map(async (itemRow) => {
        const item = mapOrderItem(itemRow);
        const productRow = await this.db.query.products.findFirst({
          where: eq(products.id, itemRow.productId),
        });
        if (productRow) {
          item.product = {
            id: productRow.id,
            sku: productRow.sku,
            barcode: productRow.barcode ?? null,
            name: productRow.name,
            description: productRow.description ?? null,
            categoryId: productRow.categoryId ?? null,
            category: null,
            priceInCents: productRow.priceInCents,
            costInCents: productRow.costInCents,
            stockQuantity: productRow.stockQuantity,
            lowStockThreshold: productRow.lowStockThreshold,
            isActive: productRow.isActive,
            imageUrl: productRow.imageUrl ?? null,
            createdAt: new Date(productRow.createdAt),
            updatedAt: new Date(productRow.updatedAt),
          } satisfies IProduct;
        }
        return item;
      }),
    );

    return mapOrder(row, hydratedItems, paymentRows.map(mapPayment));
  }

  private generateOrderNumber(): string {
    const date = new Date();
    const datePart = date.toISOString().slice(0, 10).replace(/-/g, '');
    const timePart = Date.now().toString(36).toUpperCase();
    return `ORD-${datePart}-${timePart}`;
  }
}
