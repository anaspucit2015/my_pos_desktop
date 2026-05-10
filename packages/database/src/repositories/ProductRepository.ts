import { eq, like, and, lte, desc } from 'drizzle-orm';
import type { Db } from '../db.js';
import { products, categories, stockAdjustments } from '../schema.js';
import type { StockAdjustmentRow } from '../schema.js';
import type { IProduct, IProductCategory, CreateProductDTO, UpdateProductDTO, CreateCategoryDTO, UpdateCategoryDTO } from '@my-pos/shared';
import { ok, err, type Result } from '@my-pos/shared';

// ─── Mappers ─────────────────────────────────────────────────────────────────

function mapCategory(
  row: typeof categories.$inferSelect,
): IProductCategory {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

function mapProduct(
  row: typeof products.$inferSelect,
  category: typeof categories.$inferSelect | null,
): IProduct {
  return {
    id: row.id,
    sku: row.sku,
    barcode: row.barcode ?? null,
    name: row.name,
    description: row.description ?? null,
    categoryId: row.categoryId ?? null,
    category: category ? mapCategory(category) : null,
    priceInCents: row.priceInCents,
    costInCents: row.costInCents,
    stockQuantity: row.stockQuantity,
    lowStockThreshold: row.lowStockThreshold,
    isActive: row.isActive,
    imageUrl: row.imageUrl ?? null,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

// ─── Repository ──────────────────────────────────────────────────────────────

/**
 * Repository for all product and category database operations.
 */
export class ProductRepository {
  constructor(private readonly db: Db) {}

  /**
   * Returns all active products, joined with their category.
   */
  async findAll(): Promise<Result<IProduct[], Error>> {
    try {
      const rows = await this.db
        .select()
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(eq(products.isActive, true));

      const result = rows.map((r) => mapProduct(r.products, r.categories ?? null));
      return ok(result);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /**
   * Finds a single product by its primary key.
   */
  async findById(id: number): Promise<Result<IProduct | null, Error>> {
    try {
      const rows = await this.db
        .select()
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(eq(products.id, id))
        .limit(1);

      const row = rows[0];
      return ok(row ? mapProduct(row.products, row.categories ?? null) : null);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /**
   * Finds a single product by barcode.
   */
  async findByBarcode(barcode: string): Promise<Result<IProduct | null, Error>> {
    try {
      const rows = await this.db
        .select()
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(eq(products.barcode, barcode))
        .limit(1);

      const row = rows[0];
      return ok(row ? mapProduct(row.products, row.categories ?? null) : null);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /**
   * Searches products by name using a case-insensitive partial match.
   */
  async search(query: string): Promise<Result<IProduct[], Error>> {
    try {
      const rows = await this.db
        .select()
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(and(eq(products.isActive, true), like(products.name, `%${query}%`)));

      return ok(rows.map((r) => mapProduct(r.products, r.categories ?? null)));
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /**
   * Creates a new product record.
   */
  async create(dto: CreateProductDTO): Promise<Result<IProduct, Error>> {
    try {
      const inserted = await this.db
        .insert(products)
        .values({
          sku: dto.sku,
          barcode: dto.barcode ?? null,
          name: dto.name,
          description: dto.description ?? null,
          categoryId: dto.categoryId ?? null,
          priceInCents: dto.priceInCents,
          costInCents: dto.costInCents,
          stockQuantity: dto.stockQuantity,
          lowStockThreshold: dto.lowStockThreshold ?? 10,
          imageUrl: dto.imageUrl ?? null,
        })
        .returning();

      const row = inserted[0];
      if (!row) return err(new Error('Insert returned no rows'));

      return this.findById(row.id);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /**
   * Updates an existing product by id.
   */
  async update(id: number, dto: UpdateProductDTO): Promise<Result<IProduct, Error>> {
    try {
      const now = new Date().toISOString();
      await this.db
        .update(products)
        .set({ ...dto, updatedAt: now })
        .where(eq(products.id, id));

      const result = await this.findById(id);
      if (result.success && result.data === null) {
        return err(new Error(`Product ${id} not found after update`));
      }
      return result as Result<IProduct, Error>;
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /**
   * Soft-deletes a product by marking it inactive.
   */
  async delete(id: number): Promise<Result<void, Error>> {
    try {
      await this.db
        .update(products)
        .set({ isActive: false, updatedAt: new Date().toISOString() })
        .where(eq(products.id, id));
      return ok(undefined);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /**
   * Adjusts stock quantity by a signed delta and records an audit entry.
   *
   * @param productId - The product to adjust.
   * @param delta - Positive to add stock, negative to remove.
   * @param userId - The user performing the adjustment.
   * @param reason - Human-readable reason for the change.
   */
  async updateStock(
    productId: number,
    delta: number,
    userId: number,
    reason: string,
  ): Promise<Result<IProduct, Error>> {
    try {
      const productResult = await this.findById(productId);
      if (!productResult.success) return productResult;
      if (!productResult.data) return err(new Error(`Product ${productId} not found`));

      const quantityBefore = productResult.data.stockQuantity;
      const quantityAfter = quantityBefore + delta;

      if (quantityAfter < 0) {
        return err(new Error(`Insufficient stock: have ${quantityBefore}, need ${Math.abs(delta)}`));
      }

      await this.db
        .update(products)
        .set({ stockQuantity: quantityAfter, updatedAt: new Date().toISOString() })
        .where(eq(products.id, productId));

      await this.db.insert(stockAdjustments).values({
        productId,
        userId,
        delta,
        quantityBefore,
        quantityAfter,
        reason,
      });

      return this.findById(productId) as Promise<Result<IProduct, Error>>;
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /**
   * Returns the stock adjustment history for a product, most recent first.
   */
  async findStockHistory(productId: number): Promise<Result<StockAdjustmentRow[], Error>> {
    try {
      const rows = await this.db
        .select()
        .from(stockAdjustments)
        .where(eq(stockAdjustments.productId, productId))
        .orderBy(desc(stockAdjustments.createdAt));
      return ok(rows);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /**
   * Returns all product categories.
   */
  async findAllCategories(): Promise<Result<IProductCategory[], Error>> {
    try {
      const rows = await this.db.select().from(categories);
      return ok(rows.map(mapCategory));
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /**
   * Creates a new product category.
   */
  async createCategory(dto: CreateCategoryDTO): Promise<Result<IProductCategory, Error>> {
    try {
      const inserted = await this.db
        .insert(categories)
        .values({ name: dto.name, description: dto.description ?? null })
        .returning();
      const row = inserted[0];
      if (!row) return err(new Error('Insert returned no rows'));
      return ok(mapCategory(row));
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /**
   * Updates an existing category by id.
   */
  async updateCategory(id: number, dto: UpdateCategoryDTO): Promise<Result<IProductCategory, Error>> {
    try {
      const now = new Date().toISOString();
      await this.db
        .update(categories)
        .set({ ...dto, updatedAt: now })
        .where(eq(categories.id, id));
      const rows = await this.db.select().from(categories).where(eq(categories.id, id)).limit(1);
      const row = rows[0];
      if (!row) return err(new Error(`Category ${id} not found`));
      return ok(mapCategory(row));
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /**
   * Deletes a category by id.
   * Products in this category will have their categoryId set to null (FK on delete set null).
   */
  async deleteCategory(id: number): Promise<Result<void, Error>> {
    try {
      await this.db.delete(categories).where(eq(categories.id, id));
      return ok(undefined);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /**
   * Returns all products whose stock is at or below their low-stock threshold.
   */
  async findLowStock(): Promise<Result<IProduct[], Error>> {
    try {
      const rows = await this.db
        .select()
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(
          and(
            eq(products.isActive, true),
            lte(products.stockQuantity, products.lowStockThreshold),
          ),
        );

      return ok(rows.map((r) => mapProduct(r.products, r.categories ?? null)));
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }
}
