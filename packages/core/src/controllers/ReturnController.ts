import type { Result } from '@my-pos/shared';
import type { IReturn, CreateReturnDTO } from '@my-pos/shared';
import type { ReturnRepository, OrderRepository, ProductRepository } from '@my-pos/database';
import { ReturnService } from '../services/ReturnService.js';

/**
 * Controller for return lifecycle operations.
 * Delegates to ReturnService for all business logic.
 */
export class ReturnController {
  private readonly returnService: ReturnService;

  constructor(
    returnRepository: ReturnRepository,
    orderRepository: OrderRepository,
    productRepository: ProductRepository,
  ) {
    this.returnService = new ReturnService(returnRepository, orderRepository, productRepository);
  }

  /**
   * Processes a return for one or more items from a completed order.
   */
  async processReturn(dto: CreateReturnDTO): Promise<Result<IReturn, Error>> {
    return this.returnService.processReturn(dto);
  }

  /**
   * Returns all return transactions for a given order.
   */
  async getByOrderId(orderId: number): Promise<Result<IReturn[], Error>> {
    return this.returnService.getByOrderId(orderId);
  }
}
