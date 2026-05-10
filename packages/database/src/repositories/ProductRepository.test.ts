import { getDb, closeDb } from '../db.js';
import { up as up001 } from '../migrations/001_initial_schema.js';
import Database from 'better-sqlite3';
import { ProductRepository } from './ProductRepository.js';

// We need the raw sqlite handle to run the migration before drizzle wraps it
let sqlite: Database.Database;
let repo: ProductRepository;

beforeEach(() => {
  sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');
  up001(sqlite);
  // Inject same in-memory DB into drizzle via getDb with a known path trick:
  // We bypass getDb's cache by closing any existing connection first.
  closeDb();
  // Patch: create DB from the already-open sqlite instance directly
  const { drizzle } = require('drizzle-orm/better-sqlite3');
  const schema = require('../schema.js');
  const db = drizzle(sqlite, { schema });
  repo = new ProductRepository(db);
});

afterEach(() => {
  sqlite.close();
  closeDb();
});

// ── Seed helpers ──────────────────────────────────────────────────────────────

function seedCategory(name = 'Test Category'): number {
  const result = sqlite
    .prepare(`INSERT INTO categories (name) VALUES (?) RETURNING id`)
    .get(name) as { id: number };
  return result.id;
}

function seedProduct(overrides: Partial<{
  sku: string;
  name: string;
  barcode: string;
  categoryId: number;
  priceInCents: number;
  stockQuantity: number;
}> = {}): number {
  const params = {
    sku: overrides.sku ?? 'SKU-001',
    barcode: overrides.barcode ?? null,
    name: overrides.name ?? 'Test Product',
    categoryId: overrides.categoryId ?? null,
    priceInCents: overrides.priceInCents ?? 999,
    costInCents: 400,
    stockQuantity: overrides.stockQuantity ?? 50,
  };
  const result = sqlite
    .prepare(`
      INSERT INTO products (sku, barcode, name, category_id, price_in_cents, cost_in_cents, stock_quantity)
      VALUES (@sku, @barcode, @name, @categoryId, @priceInCents, @costInCents, @stockQuantity)
      RETURNING id
    `)
    .get(params) as { id: number };
  return result.id;
}

function seedUser(): number {
  const result = sqlite
    .prepare(`INSERT INTO users (username, pin_hash, first_name, last_name, role) VALUES (?, ?, ?, ?, ?) RETURNING id`)
    .get('testuser', 'hash', 'Test', 'User', 'CASHIER') as { id: number };
  return result.id;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ProductRepository.findAll', () => {
  it('returns an empty array when no products exist', async () => {
    const result = await repo.findAll();
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual([]);
  });

  it('returns active products', async () => {
    seedProduct({ sku: 'A-001', name: 'Apple' });
    seedProduct({ sku: 'B-001', name: 'Banana' });
    const result = await repo.findAll();
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toHaveLength(2);
  });

  it('excludes inactive products', async () => {
    const id = seedProduct({ sku: 'A-001' });
    sqlite.prepare(`UPDATE products SET is_active = 0 WHERE id = ?`).run(id);
    const result = await repo.findAll();
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toHaveLength(0);
  });
});

describe('ProductRepository.findById', () => {
  it('returns null for a non-existent id', async () => {
    const result = await repo.findById(999);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBeNull();
  });

  it('returns the product with category hydrated', async () => {
    const catId = seedCategory('Drinks');
    const id = seedProduct({ sku: 'D-001', name: 'Cola', categoryId: catId });
    const result = await repo.findById(id);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data?.name).toBe('Cola');
      expect(result.data?.category?.name).toBe('Drinks');
    }
  });
});

describe('ProductRepository.findByBarcode', () => {
  it('finds a product by barcode', async () => {
    seedProduct({ sku: 'X-001', barcode: '123456789' });
    const result = await repo.findByBarcode('123456789');
    expect(result.success).toBe(true);
    if (result.success) expect(result.data?.barcode).toBe('123456789');
  });

  it('returns null for unknown barcode', async () => {
    const result = await repo.findByBarcode('000000000');
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBeNull();
  });
});

describe('ProductRepository.create', () => {
  it('creates a product and returns it', async () => {
    const result = await repo.create({
      sku: 'NEW-001',
      name: 'New Product',
      priceInCents: 1500,
      costInCents: 600,
      stockQuantity: 20,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sku).toBe('NEW-001');
      expect(result.data.priceInCents).toBe(1500);
    }
  });
});

describe('ProductRepository.update', () => {
  it('updates product fields', async () => {
    const id = seedProduct({ sku: 'U-001', name: 'Old Name' });
    const result = await repo.update(id, { name: 'New Name', priceInCents: 2000 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('New Name');
      expect(result.data.priceInCents).toBe(2000);
    }
  });
});

describe('ProductRepository.delete', () => {
  it('soft-deletes a product', async () => {
    const id = seedProduct({ sku: 'D-001' });
    const deleteResult = await repo.delete(id);
    expect(deleteResult.success).toBe(true);

    const allResult = await repo.findAll();
    if (allResult.success) expect(allResult.data).toHaveLength(0);
  });
});

describe('ProductRepository.updateStock', () => {
  it('increases stock and records an audit row', async () => {
    const userId = seedUser();
    const id = seedProduct({ sku: 'S-001', stockQuantity: 10 });

    const result = await repo.updateStock(id, 5, userId, 'restock');
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.stockQuantity).toBe(15);

    const adj = sqlite
      .prepare(`SELECT * FROM stock_adjustments WHERE product_id = ?`)
      .get(id) as { delta: number; quantity_before: number; quantity_after: number };
    expect(adj.delta).toBe(5);
    expect(adj.quantity_before).toBe(10);
    expect(adj.quantity_after).toBe(15);
  });

  it('returns an error when stock would go negative', async () => {
    const userId = seedUser();
    const id = seedProduct({ sku: 'S-002', stockQuantity: 3 });

    const result = await repo.updateStock(id, -10, userId, 'sale');
    expect(result.success).toBe(false);
  });
});
