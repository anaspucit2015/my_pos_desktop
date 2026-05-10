import { ok, err, type Result } from '@my-pos/shared';
import type { IProduct } from '@my-pos/shared';
import type { ProductRepository, StockAdjustmentRow } from '@my-pos/database';

/**
 * Controller for inventory management operations.
 */
export class InventoryController {
  constructor(private readonly productRepository: ProductRepository) {}

  /**
   * Returns all products whose stock is at or below their low-stock threshold.
   */
  async getLowStockItems(): Promise<Result<IProduct[], Error>> {
    return this.productRepository.findLowStock();
  }

  /**
   * Manually adjusts stock for a product with an audit trail.
   *
   * @param productId - The product to adjust.
   * @param delta - Signed quantity change (positive = add, negative = remove).
   * @param userId - The user performing the adjustment.
   * @param reason - Human-readable reason for the adjustment.
   */
  async adjustStock(
    productId: number,
    delta: number,
    userId: number,
    reason: string,
  ): Promise<Result<IProduct, Error>> {
    if (delta === 0) return err(new Error('Stock adjustment delta cannot be zero'));
    if (!reason.trim()) return err(new Error('A reason is required for stock adjustments'));
    return this.productRepository.updateStock(productId, delta, userId, reason);
  }

  /**
   * Returns the stock adjustment history for a product, most recent first.
   *
   * @param productId - The product to retrieve history for.
   */
  async getStockHistory(productId: number): Promise<Result<StockAdjustmentRow[], Error>> {
    return this.productRepository.findStockHistory(productId);
  }
}
