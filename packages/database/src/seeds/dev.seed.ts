/**
 * Development seed: 20 products, 4 categories, 2 users, 5 customers.
 * Run with: pnpm --filter @my-pos/database seed
 *
 * Uses raw SQL via better-sqlite3 to keep it simple and dependency-free
 * from the ORM layer (seeds run before the app starts).
 */
import Database from 'better-sqlite3';
import { up as up001 } from '../migrations/001_initial_schema.js';

const DB_PATH = process.env['DATABASE_PATH'] ?? 'pos.db';

// ─── Raw PIN hash placeholder ─────────────────────────────────────────────────
// In production the AuthService hashes PINs with argon2/bcrypt.
// For seeds we use a well-known bcrypt hash of "1234" (cost 10).
const HASHED_1234 = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
// Hash of "9999" for the admin user
const HASHED_9999 = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LnS3NS3OKvO';

function seed(): void {
  const sqlite = new Database(DB_PATH);

  // Ensure schema exists
  up001(sqlite);

  // ── Categories ────────────────────────────────────────────────────────────
  const insertCategory = sqlite.prepare(
    `INSERT OR IGNORE INTO categories (name, description) VALUES (?, ?)`,
  );

  const categoryIds: Record<string, number> = {};
  const categoryData = [
    ['Beverages', 'Hot and cold drinks'],
    ['Snacks', 'Chips, nuts, and light bites'],
    ['Dairy', 'Milk, cheese, yoghurt'],
    ['Bakery', 'Breads, pastries, and cakes'],
  ] as const;

  for (const [name, description] of categoryData) {
    insertCategory.run(name, description);
    const row = sqlite.prepare(`SELECT id FROM categories WHERE name = ?`).get(name) as {
      id: number;
    };
    categoryIds[name] = row.id;
  }

  // ── Products (20) ─────────────────────────────────────────────────────────
  const insertProduct = sqlite.prepare(`
    INSERT OR IGNORE INTO products
      (sku, barcode, name, description, category_id, price_in_cents, cost_in_cents, stock_quantity, low_stock_threshold)
    VALUES
      (@sku, @barcode, @name, @description, @categoryId, @priceInCents, @costInCents, @stockQuantity, @lowStockThreshold)
  `);

  const productData = [
    // Beverages
    { sku: 'BEV-001', barcode: '5000112637922', name: 'Espresso', description: 'Single shot espresso', category: 'Beverages', price: 299, cost: 80, stock: 999, lowStock: 50 },
    { sku: 'BEV-002', barcode: '5000112637923', name: 'Latte', description: 'Espresso with steamed milk', category: 'Beverages', price: 449, cost: 120, stock: 999, lowStock: 50 },
    { sku: 'BEV-003', barcode: '5000112637924', name: 'Cappuccino', description: 'Equal parts espresso, milk, foam', category: 'Beverages', price: 449, cost: 115, stock: 999, lowStock: 50 },
    { sku: 'BEV-004', barcode: '5000112637925', name: 'Orange Juice', description: 'Freshly squeezed OJ', category: 'Beverages', price: 349, cost: 100, stock: 48, lowStock: 10 },
    { sku: 'BEV-005', barcode: '5000112637926', name: 'Sparkling Water', description: '500 ml sparkling water', category: 'Beverages', price: 199, cost: 50, stock: 120, lowStock: 20 },
    // Snacks
    { sku: 'SNK-001', barcode: '5000112637927', name: 'Salted Crisps', description: 'Classic salted potato crisps 40g', category: 'Snacks', price: 149, cost: 45, stock: 80, lowStock: 15 },
    { sku: 'SNK-002', barcode: '5000112637928', name: 'Mixed Nuts', description: 'Roasted mixed nuts 50g', category: 'Snacks', price: 299, cost: 110, stock: 60, lowStock: 10 },
    { sku: 'SNK-003', barcode: '5000112637929', name: 'Dark Chocolate Bar', description: '70% cocoa 45g', category: 'Snacks', price: 249, cost: 90, stock: 50, lowStock: 10 },
    { sku: 'SNK-004', barcode: '5000112637930', name: 'Granola Bar', description: 'Oat and honey granola bar', category: 'Snacks', price: 179, cost: 55, stock: 70, lowStock: 10 },
    { sku: 'SNK-005', barcode: '5000112637931', name: 'Dried Mango', description: 'Unsweetened dried mango strips 30g', category: 'Snacks', price: 329, cost: 130, stock: 40, lowStock: 8 },
    // Dairy
    { sku: 'DAI-001', barcode: '5000112637932', name: 'Whole Milk 1L', description: 'Full-fat whole milk 1 litre', category: 'Dairy', price: 189, cost: 80, stock: 30, lowStock: 8 },
    { sku: 'DAI-002', barcode: '5000112637933', name: 'Greek Yoghurt', description: 'Plain Greek yoghurt 200g', category: 'Dairy', price: 229, cost: 90, stock: 25, lowStock: 5 },
    { sku: 'DAI-003', barcode: '5000112637934', name: 'Cheddar Cheese', description: 'Mature cheddar 200g', category: 'Dairy', price: 349, cost: 150, stock: 20, lowStock: 5 },
    { sku: 'DAI-004', barcode: '5000112637935', name: 'Butter', description: 'Unsalted butter 250g', category: 'Dairy', price: 299, cost: 130, stock: 18, lowStock: 5 },
    { sku: 'DAI-005', barcode: '5000112637936', name: 'Cream Cheese', description: 'Philadelphia-style cream cheese 180g', category: 'Dairy', price: 269, cost: 110, stock: 15, lowStock: 4 },
    // Bakery
    { sku: 'BAK-001', barcode: '5000112637937', name: 'Sourdough Loaf', description: 'Artisan sourdough 800g', category: 'Bakery', price: 499, cost: 200, stock: 12, lowStock: 3 },
    { sku: 'BAK-002', barcode: '5000112637938', name: 'Croissant', description: 'Butter croissant, freshly baked', category: 'Bakery', price: 229, cost: 80, stock: 24, lowStock: 5 },
    { sku: 'BAK-003', barcode: '5000112637939', name: 'Blueberry Muffin', description: 'Large blueberry muffin', category: 'Bakery', price: 279, cost: 95, stock: 16, lowStock: 4 },
    { sku: 'BAK-004', barcode: '5000112637940', name: 'Cinnamon Roll', description: 'Classic cinnamon roll with icing', category: 'Bakery', price: 329, cost: 110, stock: 10, lowStock: 3 },
    { sku: 'BAK-005', barcode: '5000112637941', name: 'Bagel', description: 'Plain bagel, freshly baked', category: 'Bakery', price: 199, cost: 65, stock: 20, lowStock: 5 },
  ];

  for (const p of productData) {
    insertProduct.run({
      sku: p.sku,
      barcode: p.barcode,
      name: p.name,
      description: p.description,
      categoryId: categoryIds[p.category],
      priceInCents: p.price,
      costInCents: p.cost,
      stockQuantity: p.stock,
      lowStockThreshold: p.lowStock,
    });
  }

  // ── Users ─────────────────────────────────────────────────────────────────
  const insertUser = sqlite.prepare(`
    INSERT OR IGNORE INTO users (username, pin_hash, first_name, last_name, role)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertUser.run('admin', HASHED_9999, 'Admin', 'User', 'ADMIN');
  insertUser.run('cashier1', HASHED_1234, 'Jane', 'Smith', 'CASHIER');

  // ── Customers ─────────────────────────────────────────────────────────────
  const insertCustomer = sqlite.prepare(`
    INSERT OR IGNORE INTO customers (first_name, last_name, email, phone, loyalty_points)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertCustomer.run('Alice', 'Johnson', 'alice@example.com', '555-0101', 120);
  insertCustomer.run('Bob', 'Williams', 'bob@example.com', '555-0102', 45);
  insertCustomer.run('Carol', 'Brown', 'carol@example.com', '555-0103', 300);
  insertCustomer.run('David', 'Jones', null, '555-0104', 0);
  insertCustomer.run('Eva', 'Martinez', 'eva@example.com', null, 75);

  console.warn('Seed complete.');
  sqlite.close();
}

seed();
