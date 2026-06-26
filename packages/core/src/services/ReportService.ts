import { ok, err, type Result, OrderStatus } from '@my-pos/shared';
import type { IOrder } from '@my-pos/shared';
import type { OrderRepository } from '@my-pos/database';

export interface DailySummary {
  date: string;
  totalOrders: number;
  completedOrders: number;
  voidedOrders: number;
  totalRevenueInCents: number;
  totalTaxInCents: number;
  totalDiscountInCents: number;
  averageOrderInCents: number;
}

export interface TopProduct {
  productId: number;
  name: string;
  sku: string;
  quantitySold: number;
  revenueInCents: number;
}

export interface RevenueByCategory {
  categoryId: number | null;
  categoryName: string;
  revenueInCents: number;
  orderCount: number;
}

/**
 * Service for generating sales reports and summaries.
 * All reads go through OrderRepository — no direct DB access.
 */
export class ReportService {
  constructor(private readonly orderRepository: OrderRepository) {}

  /**
   * Returns a summary of all activity for a specific calendar date.
   *
   * @param date - The date to summarise (time component is ignored).
   */
  async getDailySummary(date: Date): Promise<Result<DailySummary, Error>> {
    try {
      const from = new Date(date);
      from.setHours(0, 0, 0, 0);
      const to = new Date(date);
      to.setHours(23, 59, 59, 999);

      const result = await this.orderRepository.getByDateRange(from, to);
      if (!result.success) return result;

      const orders = result.data;
      const completed = orders.filter((o) => o.status === OrderStatus.COMPLETED);
      const voided = orders.filter((o) => o.status === OrderStatus.VOIDED);

      const totalRevenueInCents = completed.reduce((s, o) => s + o.totalInCents, 0);
      const totalTaxInCents = completed.reduce((s, o) => s + o.taxInCents, 0);
      const totalDiscountInCents = completed.reduce((s, o) => s + o.discountInCents, 0);
      const averageOrderInCents =
        completed.length > 0 ? Math.round(totalRevenueInCents / completed.length) : 0;

      return ok({
        date: from.toISOString().slice(0, 10),
        totalOrders: orders.length,
        completedOrders: completed.length,
        voidedOrders: voided.length,
        totalRevenueInCents,
        totalTaxInCents,
        totalDiscountInCents,
        averageOrderInCents,
      });
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /**
   * Returns a summary of all activity across a date range.
   * Use this instead of getDailySummary when the user selects a multi-day range.
   *
   * @param from - Start of the range (inclusive, time set to 00:00:00).
   * @param to   - End of the range (inclusive, time set to 23:59:59).
   */
  async getRangeSummary(from: Date, to: Date): Promise<Result<DailySummary, Error>> {
    try {
      const start = new Date(from);
      start.setHours(0, 0, 0, 0);
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);

      const result = await this.orderRepository.getByDateRange(start, end);
      if (!result.success) return result;

      const orders = result.data;
      const completed = orders.filter((o) => o.status === OrderStatus.COMPLETED);
      const voided = orders.filter((o) => o.status === OrderStatus.VOIDED);

      const totalRevenueInCents = completed.reduce((s, o) => s + o.totalInCents, 0);
      const totalTaxInCents = completed.reduce((s, o) => s + o.taxInCents, 0);
      const totalDiscountInCents = completed.reduce((s, o) => s + o.discountInCents, 0);
      const averageOrderInCents =
        completed.length > 0 ? Math.round(totalRevenueInCents / completed.length) : 0;

      return ok({
        date: start.toISOString().slice(0, 10),
        totalOrders: orders.length,
        completedOrders: completed.length,
        voidedOrders: voided.length,
        totalRevenueInCents,
        totalTaxInCents,
        totalDiscountInCents,
        averageOrderInCents,
      });
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /**
   * Returns the top-selling products within a date range, ranked by quantity sold.
   *
   * @param from - Start of the range (inclusive).
   * @param to - End of the range (inclusive).
   * @param limit - Maximum number of products to return (default 10).
   */
  async getTopProducts(
    from: Date,
    to: Date,
    limit = 10,
  ): Promise<Result<TopProduct[], Error>> {
    try {
      const result = await this.orderRepository.getByDateRange(from, to);
      if (!result.success) return result;

      const completed = result.data.filter((o) => o.status === OrderStatus.COMPLETED);

      const productMap = new Map<
        number,
        { name: string; sku: string; quantitySold: number; revenueInCents: number }
      >();

      for (const order of completed) {
        for (const item of order.items) {
          const existing = productMap.get(item.productId);
          if (existing) {
            existing.quantitySold += item.quantity;
            existing.revenueInCents += item.subtotalInCents;
          } else {
            productMap.set(item.productId, {
              name: item.product?.name ?? `Product #${item.productId}`,
              sku: item.product?.sku ?? '',
              quantitySold: item.quantity,
              revenueInCents: item.subtotalInCents,
            });
          }
        }
      }

      const sorted = Array.from(productMap.entries())
        .map(([productId, data]) => ({ productId, ...data }))
        .sort((a, b) => b.quantitySold - a.quantitySold)
        .slice(0, limit);

      return ok(sorted);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /**
   * Returns revenue grouped by product category within a date range.
   *
   * @param from - Start of the range (inclusive).
   * @param to - End of the range (inclusive).
   */
  async getRevenueByCategory(from: Date, to: Date): Promise<Result<RevenueByCategory[], Error>> {
    try {
      const result = await this.orderRepository.getByDateRange(from, to);
      if (!result.success) return result;

      const completed = result.data.filter((o) => o.status === OrderStatus.COMPLETED);

      const categoryMap = new Map<
        number | null,
        { name: string; revenueInCents: number; orderIds: Set<number> }
      >();

      for (const order of completed) {
        for (const item of order.items) {
          const catId = item.product?.categoryId ?? null;
          const catName = item.product?.category?.name ?? 'Uncategorised';
          const existing = categoryMap.get(catId);
          if (existing) {
            existing.revenueInCents += item.subtotalInCents;
            existing.orderIds.add(order.id);
          } else {
            categoryMap.set(catId, {
              name: catName,
              revenueInCents: item.subtotalInCents,
              orderIds: new Set([order.id]),
            });
          }
        }
      }

      const result2 = Array.from(categoryMap.entries())
        .map(([categoryId, data]) => ({
          categoryId,
          categoryName: data.name,
          revenueInCents: data.revenueInCents,
          orderCount: data.orderIds.size,
        }))
        .sort((a, b) => b.revenueInCents - a.revenueInCents);

      return ok(result2);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /**
   * Convenience: returns today's DailySummary.
   */
  async getTodaysSummary(): Promise<Result<DailySummary, Error>> {
    return this.getDailySummary(new Date());
  }
}
