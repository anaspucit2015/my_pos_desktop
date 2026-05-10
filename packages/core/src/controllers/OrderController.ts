import { ok, err, type Result, OrderStatus, PaymentMethod } from '@my-pos/shared';
import type { IOrder, CreateOrderDTO, PaymentDTO } from '@my-pos/shared';
import type { OrderRepository, ProductRepository } from '@my-pos/database';
import { TaxService } from '../services/TaxService.js';
import type { DailySummary } from '../services/ReportService.js';
import { ReportService } from '../services/ReportService.js';
import { PaymentService } from '../services/PaymentService.js';

/**
 * Controller for order lifecycle operations.
 * Orchestrates TaxService, PaymentService, and repository calls.
 */
export class OrderController {
  private readonly taxService = new TaxService();
  private readonly paymentService = new PaymentService();
  private readonly reportService: ReportService;

  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly productRepository: ProductRepository,
  ) {
    this.reportService = new ReportService(orderRepository);
  }

  /**
   * Returns all orders.
   */
  async getOrderHistory(): Promise<Result<IOrder[], Error>> {
    return this.orderRepository.findAll();
  }

  /**
   * Returns a single order by ID.
   */
  async getById(id: number): Promise<Result<IOrder, Error>> {
    const result = await this.orderRepository.findById(id);
    if (!result.success) return result;
    if (!result.data) return err(new Error(`Order ${id} not found`));
    return ok(result.data);
  }

  /**
   * Creates a pending order from a DTO.
   * Validates product existence and calculates totals.
   */
  async createOrder(dto: CreateOrderDTO): Promise<Result<IOrder, Error>> {
    if (dto.items.length === 0) return err(new Error('Order must have at least one item'));

    // Validate each product exists
    for (const item of dto.items) {
      const productResult = await this.productRepository.findById(item.productId);
      if (!productResult.success) return productResult;
      if (!productResult.data) {
        return err(new Error(`Product ${item.productId} not found`));
      }
      if (!productResult.data.isActive) {
        return err(new Error(`Product "${productResult.data.name}" is no longer active`));
      }
    }

    const subtotalInCents = dto.items.reduce(
      (sum, item) =>
        sum + item.unitPriceInCents * item.quantity - (item.discountInCents ?? 0),
      0,
    );
    const orderDiscount = dto.discountInCents ?? 0;
    const taxableAmount = Math.max(0, subtotalInCents - orderDiscount);
    const taxInCents = this.taxService.applyTax(taxableAmount);
    const totalInCents = taxableAmount + taxInCents;

    return this.orderRepository.create(dto, subtotalInCents, taxInCents, totalInCents);
  }

  /**
   * Completes an order: validates payment, deducts stock, marks COMPLETED.
   */
  async completeOrder(
    orderId: number,
    payment: PaymentDTO,
    userId: number,
  ): Promise<Result<IOrder, Error>> {
    const orderResult = await this.orderRepository.findById(orderId);
    if (!orderResult.success) return orderResult;
    if (!orderResult.data) return err(new Error(`Order ${orderId} not found`));

    const order = orderResult.data;
    if (order.status !== OrderStatus.PENDING) {
      return err(new Error(`Order is ${order.status}, cannot complete`));
    }

    // Validate payment
    if (payment.method === PaymentMethod.CASH) {
      const payResult = this.paymentService.processCash(order.totalInCents, payment);
      if (!payResult.success) return payResult;
    } else {
      const payResult = this.paymentService.processCard(order.totalInCents, payment);
      if (!payResult.success) return payResult;
    }

    // Deduct stock for each item
    for (const item of order.items) {
      const stockResult = await this.productRepository.updateStock(
        item.productId,
        -item.quantity,
        userId,
        `Sale — Order ${order.orderNumber}`,
      );
      if (!stockResult.success) return stockResult;
    }

    // Record payment
    if (payment.method === PaymentMethod.CASH) {
      await this.orderRepository.recordPayment(
        orderId,
        PaymentMethod.CASH,
        payment.amountInCents,
        payment.tenderedInCents,
      );
    } else {
      await this.orderRepository.recordPayment(
        orderId,
        PaymentMethod.CARD,
        payment.amountInCents,
        undefined,
        payment.transactionRef,
      );
    }

    return this.orderRepository.updateStatus(orderId, OrderStatus.COMPLETED);
  }

  /**
   * Voids an order. Restores stock if the order was previously completed.
   */
  async voidOrder(orderId: number, userId: number): Promise<Result<IOrder, Error>> {
    const orderResult = await this.orderRepository.findById(orderId);
    if (!orderResult.success) return orderResult;
    if (!orderResult.data) return err(new Error(`Order ${orderId} not found`));

    const order = orderResult.data;
    if (order.status === OrderStatus.VOIDED) {
      return err(new Error('Order is already voided'));
    }

    // Restore stock if the order had already been completed
    if (order.status === OrderStatus.COMPLETED) {
      for (const item of order.items) {
        const stockResult = await this.productRepository.updateStock(
          item.productId,
          item.quantity,
          userId,
          `Void — Order ${order.orderNumber}`,
        );
        if (!stockResult.success) return stockResult;
      }
    }

    return this.orderRepository.updateStatus(orderId, OrderStatus.VOIDED);
  }

  /**
   * Returns today's sales summary.
   */
  async getTodaysSummary(): Promise<Result<DailySummary, Error>> {
    return this.reportService.getTodaysSummary();
  }
}
