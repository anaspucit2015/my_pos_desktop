import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import { up as up001 } from './migrations/001_initial_schema.js';

const BCRYPT_ROUNDS = 10;

/**
 * Ensures the database schema exists and seeds it with dev data if it is empty.
 * Safe to call on every app launch — migrations use CREATE TABLE IF NOT EXISTS
 * and seed inserts use INSERT OR IGNORE.
 *
 * @param dbPath - Path to the SQLite file (e.g. from app.getPath('userData')).
 */
export function bootstrapDatabase(dbPath: string): void {
  const sqlite = new Database(dbPath);
  sqlite.pragma('foreign_keys = ON');
  sqlite.pragma('journal_mode = WAL');

  // ── Migrations ─────────────────────────────────────────────────────────────
  up001(sqlite);

  // ── Seed (only when users table is empty) ──────────────────────────────────
  const userCount = (sqlite.prepare('SELECT COUNT(*) as n FROM users').get() as { n: number }).n;
  if (userCount > 0) {
    sqlite.close();
    return;
  }

  // Categories
  const insertCat = sqlite.prepare(
    'INSERT OR IGNORE INTO categories (name, description) VALUES (?, ?)',
  );
  const cats: [string, string][] = [
    ['Beverages', 'Hot and cold drinks'],
    ['Snacks', 'Chips, nuts, and light bites'],
    ['Dairy', 'Milk, cheese, yoghurt'],
    ['Bakery', 'Breads, pastries, and cakes'],
  ];
  for (const [name, desc] of cats) insertCat.run(name, desc);

  const catId = (name: string): number =>
    (sqlite.prepare('SELECT id FROM categories WHERE name = ?').get(name) as { id: number }).id;

  // Products (20)
  const insertProduct = sqlite.prepare(`
    INSERT OR IGNORE INTO products
      (sku, barcode, name, description, category_id, price_in_cents, cost_in_cents, stock_quantity, low_stock_threshold)
    VALUES
      (@sku, @barcode, @name, @description, @categoryId, @price, @cost, @stock, @lowStock)
  `);

  const products = [
    { sku: 'BEV-001', barcode: '5000112637922', name: 'Espresso',        description: 'Single shot espresso',               cat: 'Beverages', price: 299,  cost: 80,  stock: 999, lowStock: 50 },
    { sku: 'BEV-002', barcode: '5000112637923', name: 'Latte',           description: 'Espresso with steamed milk',          cat: 'Beverages', price: 449,  cost: 120, stock: 999, lowStock: 50 },
    { sku: 'BEV-003', barcode: '5000112637924', name: 'Cappuccino',      description: 'Equal parts espresso, milk, foam',    cat: 'Beverages', price: 449,  cost: 115, stock: 999, lowStock: 50 },
    { sku: 'BEV-004', barcode: '5000112637925', name: 'Orange Juice',    description: 'Freshly squeezed OJ',                 cat: 'Beverages', price: 349,  cost: 100, stock: 48,  lowStock: 10 },
    { sku: 'BEV-005', barcode: '5000112637926', name: 'Sparkling Water', description: '500 ml sparkling water',              cat: 'Beverages', price: 199,  cost: 50,  stock: 120, lowStock: 20 },
    { sku: 'SNK-001', barcode: '5000112637927', name: 'Salted Crisps',   description: 'Classic salted potato crisps 40g',   cat: 'Snacks',    price: 149,  cost: 45,  stock: 80,  lowStock: 15 },
    { sku: 'SNK-002', barcode: '5000112637928', name: 'Mixed Nuts',      description: 'Roasted mixed nuts 50g',              cat: 'Snacks',    price: 299,  cost: 110, stock: 60,  lowStock: 10 },
    { sku: 'SNK-003', barcode: '5000112637929', name: 'Dark Chocolate',  description: '70% cocoa 45g',                       cat: 'Snacks',    price: 249,  cost: 90,  stock: 50,  lowStock: 10 },
    { sku: 'SNK-004', barcode: '5000112637930', name: 'Granola Bar',     description: 'Oat and honey granola bar',           cat: 'Snacks',    price: 179,  cost: 55,  stock: 70,  lowStock: 10 },
    { sku: 'SNK-005', barcode: '5000112637931', name: 'Dried Mango',     description: 'Unsweetened dried mango strips 30g', cat: 'Snacks',    price: 329,  cost: 130, stock: 40,  lowStock: 8  },
    { sku: 'DAI-001', barcode: '5000112637932', name: 'Whole Milk 1L',   description: 'Full-fat whole milk 1 litre',         cat: 'Dairy',     price: 189,  cost: 80,  stock: 30,  lowStock: 8  },
    { sku: 'DAI-002', barcode: '5000112637933', name: 'Greek Yoghurt',   description: 'Plain Greek yoghurt 200g',            cat: 'Dairy',     price: 229,  cost: 90,  stock: 25,  lowStock: 5  },
    { sku: 'DAI-003', barcode: '5000112637934', name: 'Cheddar Cheese',  description: 'Mature cheddar 200g',                 cat: 'Dairy',     price: 349,  cost: 150, stock: 20,  lowStock: 5  },
    { sku: 'DAI-004', barcode: '5000112637935', name: 'Butter',          description: 'Unsalted butter 250g',               cat: 'Dairy',     price: 299,  cost: 130, stock: 18,  lowStock: 5  },
    { sku: 'DAI-005', barcode: '5000112637936', name: 'Cream Cheese',    description: 'Philadelphia-style 180g',            cat: 'Dairy',     price: 269,  cost: 110, stock: 15,  lowStock: 4  },
    { sku: 'BAK-001', barcode: '5000112637937', name: 'Sourdough Loaf',  description: 'Artisan sourdough 800g',             cat: 'Bakery',    price: 499,  cost: 200, stock: 12,  lowStock: 3  },
    { sku: 'BAK-002', barcode: '5000112637938', name: 'Croissant',       description: 'Butter croissant, freshly baked',    cat: 'Bakery',    price: 229,  cost: 80,  stock: 24,  lowStock: 5  },
    { sku: 'BAK-003', barcode: '5000112637939', name: 'Blueberry Muffin',description: 'Large blueberry muffin',             cat: 'Bakery',    price: 279,  cost: 95,  stock: 16,  lowStock: 4  },
    { sku: 'BAK-004', barcode: '5000112637940', name: 'Cinnamon Roll',   description: 'Classic cinnamon roll with icing',   cat: 'Bakery',    price: 329,  cost: 110, stock: 10,  lowStock: 3  },
    { sku: 'BAK-005', barcode: '5000112637941', name: 'Bagel',           description: 'Plain bagel, freshly baked',         cat: 'Bakery',    price: 199,  cost: 65,  stock: 20,  lowStock: 5  },
  ];

  for (const p of products) {
    insertProduct.run({
      sku: p.sku, barcode: p.barcode, name: p.name,
      description: p.description, categoryId: catId(p.cat),
      price: p.price, cost: p.cost, stock: p.stock, lowStock: p.lowStock,
    });
  }

  // Users — hash PINs at runtime so the values are always correct
  const insertUser = sqlite.prepare(
    'INSERT OR IGNORE INTO users (username, pin_hash, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)',
  );
  insertUser.run('admin',    bcrypt.hashSync('9999', BCRYPT_ROUNDS), 'Admin', 'User',  'ADMIN');
  insertUser.run('cashier1', bcrypt.hashSync('1234', BCRYPT_ROUNDS), 'Jane',  'Smith', 'CASHIER');

  // Customers
  const insertCustomer = sqlite.prepare(
    'INSERT OR IGNORE INTO customers (first_name, last_name, email, phone, loyalty_points) VALUES (?, ?, ?, ?, ?)',
  );
  insertCustomer.run('Alice', 'Johnson', 'alice@example.com', '555-0101', 120);
  insertCustomer.run('Bob',   'Williams','bob@example.com',   '555-0102', 45);
  insertCustomer.run('Carol', 'Brown',   'carol@example.com', '555-0103', 300);
  insertCustomer.run('David', 'Jones',   null,                '555-0104', 0);
  insertCustomer.run('Eva',   'Martinez','eva@example.com',   null,       75);

  sqlite.close();
}
