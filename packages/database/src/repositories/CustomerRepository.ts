import { eq, like } from 'drizzle-orm';
import type { Db } from '../db.js';
import { customers } from '../schema.js';
import type { ICustomer, CreateCustomerDTO, UpdateCustomerDTO } from '@my-pos/shared';
import { ok, err, type Result } from '@my-pos/shared';

// ─── Mapper ──────────────────────────────────────────────────────────────────

function mapCustomer(row: typeof customers.$inferSelect): ICustomer {
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email ?? null,
    phone: row.phone ?? null,
    loyaltyPoints: row.loyaltyPoints,
    notes: row.notes ?? null,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

// ─── Repository ──────────────────────────────────────────────────────────────

/**
 * Repository for all customer database operations.
 */
export class CustomerRepository {
  constructor(private readonly db: Db) {}

  /**
   * Returns all customers ordered by last name.
   */
  async findAll(): Promise<Result<ICustomer[], Error>> {
    try {
      const rows = await this.db.select().from(customers);
      return ok(rows.map(mapCustomer));
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /**
   * Finds a customer by primary key.
   */
  async findById(id: number): Promise<Result<ICustomer | null, Error>> {
    try {
      const rows = await this.db
        .select()
        .from(customers)
        .where(eq(customers.id, id))
        .limit(1);

      return ok(rows[0] ? mapCustomer(rows[0]) : null);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /**
   * Finds a customer by their email address.
   */
  async findByEmail(email: string): Promise<Result<ICustomer | null, Error>> {
    try {
      const rows = await this.db
        .select()
        .from(customers)
        .where(eq(customers.email, email))
        .limit(1);

      return ok(rows[0] ? mapCustomer(rows[0]) : null);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /**
   * Searches customers by first or last name using a partial match.
   */
  async search(query: string): Promise<Result<ICustomer[], Error>> {
    try {
      const pattern = `%${query}%`;
      const rows = await this.db
        .select()
        .from(customers)
        .where(like(customers.firstName, pattern));

      return ok(rows.map(mapCustomer));
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /**
   * Creates a new customer.
   */
  async create(dto: CreateCustomerDTO): Promise<Result<ICustomer, Error>> {
    try {
      const inserted = await this.db
        .insert(customers)
        .values({
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email ?? null,
          phone: dto.phone ?? null,
          notes: dto.notes ?? null,
        })
        .returning();

      const row = inserted[0];
      if (!row) return err(new Error('Insert returned no rows'));
      return ok(mapCustomer(row));
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /**
   * Updates an existing customer.
   */
  async update(id: number, dto: UpdateCustomerDTO): Promise<Result<ICustomer, Error>> {
    try {
      const now = new Date().toISOString();
      await this.db
        .update(customers)
        .set({ ...dto, updatedAt: now })
        .where(eq(customers.id, id));

      return this.findById(id) as Promise<Result<ICustomer, Error>>;
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /**
   * Adds loyalty points to a customer's balance.
   *
   * @param id - Customer id.
   * @param points - Number of points to add (must be positive).
   */
  async addLoyaltyPoints(id: number, points: number): Promise<Result<ICustomer, Error>> {
    try {
      if (points <= 0) return err(new Error('Points must be a positive integer'));

      const existing = await this.findById(id);
      if (!existing.success) return existing;
      if (!existing.data) return err(new Error(`Customer ${id} not found`));

      const newTotal = existing.data.loyaltyPoints + points;

      await this.db
        .update(customers)
        .set({ loyaltyPoints: newTotal, updatedAt: new Date().toISOString() })
        .where(eq(customers.id, id));

      return this.findById(id) as Promise<Result<ICustomer, Error>>;
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }
}
