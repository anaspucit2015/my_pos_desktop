import { eq } from 'drizzle-orm';
import type { Db } from '../db.js';
import { users } from '../schema.js';
import type { IUser, CreateUserDTO, UpdateUserDTO } from '@my-pos/shared';
import { UserRole, ok, err, type Result } from '@my-pos/shared';

// ─── Mapper ──────────────────────────────────────────────────────────────────

function mapUser(row: typeof users.$inferSelect): IUser {
  return {
    id: row.id,
    username: row.username,
    firstName: row.firstName,
    lastName: row.lastName,
    role: row.role as UserRole,
    isActive: row.isActive,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

// ─── Repository ──────────────────────────────────────────────────────────────

/**
 * Repository for all user database operations.
 * PIN hashing must be done in the service layer before calling create/update.
 */
export class UserRepository {
  constructor(private readonly db: Db) {}

  /**
   * Returns all users ordered by creation date ascending.
   */
  async getAll(): Promise<Result<IUser[], Error>> {
    try {
      const rows = await this.db.select().from(users);
      return ok(rows.map(mapUser));
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /**
   * Finds a user by primary key. Returns null if not found.
   */
  async findById(id: number): Promise<Result<IUser | null, Error>> {
    try {
      const rows = await this.db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      return ok(rows[0] ? mapUser(rows[0]) : null);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /**
   * Finds a user by username.
   */
  async findByUsername(username: string): Promise<Result<IUser | null, Error>> {
    try {
      const rows = await this.db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      return ok(rows[0] ? mapUser(rows[0]) : null);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /**
   * Returns the stored PIN hash for a given username.
   * Used by the auth service for PIN verification — never exposed to callers directly.
   */
  async getPinHash(username: string): Promise<Result<string | null, Error>> {
    try {
      const rows = await this.db
        .select({ pinHash: users.pinHash })
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      return ok(rows[0]?.pinHash ?? null);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /**
   * Creates a new user. The pinHash must already be hashed by the service layer.
   */
  async create(dto: CreateUserDTO, pinHash: string): Promise<Result<IUser, Error>> {
    try {
      const inserted = await this.db
        .insert(users)
        .values({
          username: dto.username,
          pinHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: dto.role,
        })
        .returning();

      const row = inserted[0];
      if (!row) return err(new Error('Insert returned no rows'));
      return ok(mapUser(row));
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /**
   * Updates an existing user. If pin is included in the DTO the caller must
   * pass the already-hashed value in pinHash.
   */
  async update(
    id: number,
    dto: UpdateUserDTO,
    pinHash?: string,
  ): Promise<Result<IUser, Error>> {
    try {
      const now = new Date().toISOString();
      const { pin: _pin, ...rest } = dto;

      await this.db
        .update(users)
        .set({
          ...rest,
          ...(pinHash !== undefined ? { pinHash } : {}),
          updatedAt: now,
        })
        .where(eq(users.id, id));

      return this.findById(id) as Promise<Result<IUser, Error>>;
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }
}
