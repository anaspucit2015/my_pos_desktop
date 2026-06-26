import { eq, desc } from 'drizzle-orm';
import type { Db } from '../db.js';
import { returns, returnItems, products } from '../schema.js';
import type { IReturn, IReturnItem, CreateReturnDTO } from '@my-pos/shared';
import { ok, err, type Result } from '@my-pos/shared';

// ─── Mappers ─────────────────────────────────────────────────────────────────

function mapReturnItem(row: typeof returnItems.$inferSelect): IReturnItem {
  return {
    id: row.id,
    returnId: row.returnId,
    orderItemId: row.orderItemId,
    productId: row.productId,
    productName: null,
    quantityReturned: row.quantityReturned,
    unitPriceInCents: row.unitPriceInCents,
    subtotalInCents: row.subtotalInCents,
  };
}

function mapReturn(
  row: typeof returns.$inferSelect,
  items: IReturnItem[],
): IReturn {
  return {
    id: row.id,
    returnNumber: row.returnNumber,
    originalOrderId: row.originalOrderId,
    cashierId: row.cashierId,
    reason: row.reason as IReturn['reason'],
    refundMethod: row.refundMethod as IReturn['refundMethod'],
    refundAmountInCents: row.refundAmountInCents,
    notes: row.notes ?? null,
    items,
    createdAt: new Date(row.createdAt),
  };
}

// ─── Repository ──────────────────────────────────────────────────────────────

/**
 * Repository for return and return_items database operations.
 */
export class ReturnRepository {
  constructor(private readonly db: Db) {}

  /**
   * Returns all returns for a given order, most recent first.
   */
  async findByOrderId(orderId: number): Promise<Result<IReturn[], Error>> {
    try {
      const rows = await this.db
        .select()
        .from(returns)
        .where(eq(returns.originalOrderId, orderId))
        .orderBy(desc(returns.createdAt));

      const result = await Promise.all(rows.map((r) => this.hydrateReturn(r)));
      return ok(result);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /**
   * Finds a single return by its primary key, including items.
   */
  async findById(id: number): Promise<Result<IReturn | null, Error>> {
    try {
      const row = await this.db.query.returns.findFirst({
        where: eq(returns.id, id),
      });
      if (!row) return ok(null);
      return ok(await this.hydrateReturn(row));
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /**
   * Returns all returns, most recent first.
   */
  async findAll(): Promise<Result<IReturn[], Error>> {
    try {
      const rows = await this.db
        .select()
        .from(returns)
        .orderBy(desc(returns.createdAt));

      const result = await Promise.all(rows.map((r) => this.hydrateReturn(r)));
      return ok(result);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /**
   * Creates a new return with its line items.
   */
  async create(dto: CreateReturnDTO): Promise<Result<IReturn, Error>> {
    try {
      const returnNumber = this.generateReturnNumber();

      const inserted = await this.db
        .insert(returns)
        .values({
          returnNumber,
          originalOrderId: dto.originalOrderId,
          cashierId: dto.cashierId,
          reason: dto.reason,
          refundMethod: dto.refundMethod,
          refundAmountInCents: dto.refundAmountInCents,
          notes: dto.notes ?? null,
        })
        .returning();

      const row = inserted[0];
      if (!row) return err(new Error('Return insert returned no rows'));

      const itemValues = dto.items.map((item) => ({
        returnId: row.id,
        orderItemId: item.orderItemId,
        productId: item.productId,
        quantityReturned: item.quantityReturned,
        unitPriceInCents: item.unitPriceInCents,
        subtotalInCents: item.unitPriceInCents * item.quantityReturned,
      }));

      await this.db.insert(returnItems).values(itemValues);

      const result = await this.findById(row.id);
      if (result.success && result.data === null) {
        return err(new Error('Return not found immediately after insert'));
      }
      return result as Result<IReturn, Error>;
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private async hydrateReturn(row: typeof returns.$inferSelect): Promise<IReturn> {
    const itemRows = await this.db
      .select()
      .from(returnItems)
      .where(eq(returnItems.returnId, row.id));

    // Hydrate product names
    const hydratedItems: IReturnItem[] = await Promise.all(
      itemRows.map(async (item) => {
        const mapped = mapReturnItem(item);
        const productRow = await this.db.query.products.findFirst({
          where: eq(products.id, item.productId),
        });
        mapped.productName = productRow?.name ?? null;
        return mapped;
      }),
    );

    return mapReturn(row, hydratedItems);
  }

  private generateReturnNumber(): string {
    const date = new Date();
    const datePart = date.toISOString().slice(0, 10).replace(/-/g, '');
    const timePart = Date.now().toString(36).toUpperCase();
    return `RET-${datePart}-${timePart}`;
  }
}
