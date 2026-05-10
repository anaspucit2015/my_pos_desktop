import { ok, err, type Result, LOYALTY_POINTS_PER_DOLLAR } from '@my-pos/shared';
import type { ICustomer, CreateCustomerDTO, UpdateCustomerDTO } from '@my-pos/shared';
import type { CustomerRepository } from '@my-pos/database';

/**
 * Controller for customer operations.
 */
export class CustomerController {
  constructor(private readonly customerRepository: CustomerRepository) {}

  /**
   * Returns all customers.
   */
  async getAll(): Promise<Result<ICustomer[], Error>> {
    return this.customerRepository.findAll();
  }

  /**
   * Returns a single customer by ID.
   */
  async getById(id: number): Promise<Result<ICustomer, Error>> {
    const result = await this.customerRepository.findById(id);
    if (!result.success) return result;
    if (!result.data) return err(new Error(`Customer ${id} not found`));
    return ok(result.data);
  }

  /**
   * Creates a new customer.
   * Checks for duplicate email before inserting.
   */
  async createCustomer(dto: CreateCustomerDTO): Promise<Result<ICustomer, Error>> {
    if (!dto.firstName.trim()) return err(new Error('First name is required'));
    if (!dto.lastName.trim()) return err(new Error('Last name is required'));

    if (dto.email) {
      const existing = await this.customerRepository.findByEmail(dto.email);
      if (!existing.success) return existing;
      if (existing.data) {
        return err(new Error(`A customer with email "${dto.email}" already exists`));
      }
    }

    return this.customerRepository.create(dto);
  }

  /**
   * Updates an existing customer's details.
   */
  async update(id: number, dto: UpdateCustomerDTO): Promise<Result<ICustomer, Error>> {
    const existing = await this.customerRepository.findById(id);
    if (!existing.success) return existing;
    if (!existing.data) return err(new Error(`Customer ${id} not found`));

    return this.customerRepository.update(id, dto);
  }

  /**
   * Awards loyalty points for a completed order.
   * Points are calculated as 1 point per dollar spent (rounded down).
   *
   * @param customerId - The customer to award points to.
   * @param orderTotalInCents - The completed order total in cents.
   */
  async addLoyaltyPoints(
    customerId: number,
    orderTotalInCents: number,
  ): Promise<Result<ICustomer, Error>> {
    const points = Math.floor((orderTotalInCents / 100) * LOYALTY_POINTS_PER_DOLLAR);
    if (points === 0) return this.getById(customerId);
    return this.customerRepository.addLoyaltyPoints(customerId, points);
  }
}
