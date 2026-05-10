import type { Database } from 'better-sqlite3';

/**
 * Migration 001 — Initial schema.
 * Creates all core tables with proper foreign keys and indexes.
 */
export function up(sqlite: Database): void {
  sqlite.exec(/* sql */ `
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;

    -- Categories
    CREATE TABLE IF NOT EXISTS categories (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL UNIQUE,
      description TEXT,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    -- Products
    CREATE TABLE IF NOT EXISTS products (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      sku                 TEXT    NOT NULL UNIQUE,
      barcode             TEXT    UNIQUE,
      name                TEXT    NOT NULL,
      description         TEXT,
      category_id         INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      price_in_cents      INTEGER NOT NULL,
      cost_in_cents       INTEGER NOT NULL DEFAULT 0,
      stock_quantity      INTEGER NOT NULL DEFAULT 0,
      low_stock_threshold INTEGER NOT NULL DEFAULT 10,
      is_active           INTEGER NOT NULL DEFAULT 1,
      image_url           TEXT,
      created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at          TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_products_barcode    ON products(barcode);
    CREATE INDEX IF NOT EXISTS idx_products_category   ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_is_active  ON products(is_active);

    -- Customers
    CREATE TABLE IF NOT EXISTS customers (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name     TEXT    NOT NULL,
      last_name      TEXT    NOT NULL,
      email          TEXT    UNIQUE,
      phone          TEXT,
      loyalty_points INTEGER NOT NULL DEFAULT 0,
      notes          TEXT,
      created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at     TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

    -- Users
    CREATE TABLE IF NOT EXISTS users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      username    TEXT    NOT NULL UNIQUE,
      pin_hash    TEXT    NOT NULL,
      first_name  TEXT    NOT NULL,
      last_name   TEXT    NOT NULL,
      role        TEXT    NOT NULL,
      is_active   INTEGER NOT NULL DEFAULT 1,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    -- Orders
    CREATE TABLE IF NOT EXISTS orders (
      id                 INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number       TEXT    NOT NULL UNIQUE,
      customer_id        INTEGER REFERENCES customers(id) ON DELETE SET NULL,
      cashier_id         INTEGER NOT NULL REFERENCES users(id),
      status             TEXT    NOT NULL DEFAULT 'PENDING',
      subtotal_in_cents  INTEGER NOT NULL DEFAULT 0,
      tax_in_cents       INTEGER NOT NULL DEFAULT 0,
      discount_in_cents  INTEGER NOT NULL DEFAULT 0,
      total_in_cents     INTEGER NOT NULL DEFAULT 0,
      notes              TEXT,
      created_at         TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at         TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_orders_created_at  ON orders(created_at);
    CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
    CREATE INDEX IF NOT EXISTS idx_orders_cashier_id  ON orders(cashier_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status      ON orders(status);

    -- Order Items
    CREATE TABLE IF NOT EXISTS order_items (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id            INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id          INTEGER NOT NULL REFERENCES products(id),
      quantity            INTEGER NOT NULL,
      unit_price_in_cents INTEGER NOT NULL,
      discount_in_cents   INTEGER NOT NULL DEFAULT 0,
      subtotal_in_cents   INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

    -- Payments
    CREATE TABLE IF NOT EXISTS payments (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id         INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      method           TEXT    NOT NULL,
      amount_in_cents  INTEGER NOT NULL,
      tendered_in_cents INTEGER,
      change_in_cents  INTEGER,
      transaction_ref  TEXT,
      created_at       TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);

    -- Stock Adjustments (audit log)
    CREATE TABLE IF NOT EXISTS stock_adjustments (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id       INTEGER NOT NULL REFERENCES products(id),
      user_id          INTEGER NOT NULL REFERENCES users(id),
      delta            INTEGER NOT NULL,
      quantity_before  INTEGER NOT NULL,
      quantity_after   INTEGER NOT NULL,
      reason           TEXT    NOT NULL,
      created_at       TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_stock_adj_product ON stock_adjustments(product_id);

    -- Migration tracking
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version     TEXT    NOT NULL PRIMARY KEY,
      applied_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  sqlite
    .prepare(`INSERT OR IGNORE INTO schema_migrations (version) VALUES (?)`)
    .run('001_initial_schema');
}

export function down(sqlite: Database): void {
  sqlite.exec(/* sql */ `
    DROP TABLE IF EXISTS stock_adjustments;
    DROP TABLE IF EXISTS payments;
    DROP TABLE IF EXISTS order_items;
    DROP TABLE IF EXISTS orders;
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS customers;
    DROP TABLE IF EXISTS products;
    DROP TABLE IF EXISTS categories;
    DROP TABLE IF EXISTS schema_migrations;
  `);
}
