import { ok, err, type Result, OrderStatus } from '@my-pos/shared';
import type { IReturn, CreateReturnDTO } from '@my-pos/shared';
import type { ReturnRepository, OrderRepository, ProductRepository } from '@my-pos/database';

/**
 * Business logic for processing returns.
 * Validates the original order, restores stock, and persists the return record.
 */
export class ReturnService {
  constructor(
    private readonly returnRepository: ReturnRepository,
    private readonly orderRepository: OrderRepository,
    private readonly productRepository: ProductRepository,
  ) {}

  /**
   * Processes a return: validates items, restores stock, persists the return.
   */
  async processReturn(dto: CreateReturnDTO): Promise<Result<IReturn, Error>> {
    // ── Validate original order ──────────────────────────────────────────────
    const orderResult = await this.orderRepository.findById(dto.originalOrderId);
    if (!orderResult.success) return orderResult;
    if (!orderResult.data) {
      return err(new Error(`Order #${dto.originalOrderId} not found`));
    }

    const order = orderResult.data;
    if (order.status !== OrderStatus.COMPLETED && order.status !== OrderStatus.REFUNDED) {
      return err(new Error(`Order is ${order.status} — only COMPLETED orders can be returned`));
    }

    if (dto.items.length === 0) {
      return err(new Error('Return must include at least one item'));
    }

    // ── Validate each return item against the order ──────────────────────────
    for (const returnItem of dto.items) {
      const orderItem = order.items.find((i) => i.id === returnItem.orderItemId);
      if (!orderItem) {
        return err(new Error(`Order item ${returnItem.orderItemId} does not belong to order #${dto.originalOrderId}`));
      }
      if (returnItem.quantityReturned <= 0) {
        return err(new Error('Return quantity must be greater than zero'));
      }
      if (returnItem.quantityReturned > orderItem.quantity) {
        return err(
          new Error(
            `Cannot return ${returnItem.quantityReturned} of item ${returnItem.orderItemId} — only ${orderItem.quantity} were sold`,
          ),
        );
      }
    }

    // ── Restore stock for each returned item ─────────────────────────────────
    for (const returnItem of dto.items) {
      const stockResult = await this.productRepository.updateStock(
        returnItem.productId,
        returnItem.quantityReturned,
        dto.cashierId,
        `Return — Order #${dto.originalOrderId}`,
      );
      if (!stockResult.success) return stockResult;
    }

    // ── Persist the return ───────────────────────────────────────────────────
    const createResult = await this.returnRepository.create(dto);
    if (!createResult.success) return createResult;

    // ── Mark original order as REFUNDED ──────────────────────────────────────
    await this.orderRepository.updateStatus(dto.originalOrderId, OrderStatus.REFUNDED);

    return ok(createResult.data);
  }

  /**
   * Returns all returns associated with a given order.
   */
  async getByOrderId(orderId: number): Promise<Result<IReturn[], Error>> {
    return this.returnRepository.findByOrderId(orderId);
  }
}
