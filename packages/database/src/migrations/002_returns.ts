import type { Database } from 'better-sqlite3';

/**
 * Migration 002 — Returns schema.
 * Adds `returns` and `return_items` tables for processing refunds.
 */
export function up(sqlite: Database): void {
  sqlite.exec(/* sql */ `
    -- Returns (one row per return transaction)
    CREATE TABLE IF NOT EXISTS returns (
      id                     INTEGER PRIMARY KEY AUTOINCREMENT,
      return_number          TEXT    NOT NULL UNIQUE,
      original_order_id      INTEGER NOT NULL REFERENCES orders(id),
      cashier_id             INTEGER NOT NULL REFERENCES users(id),
      reason                 TEXT    NOT NULL,
      refund_method          TEXT    NOT NULL,
      refund_amount_in_cents INTEGER NOT NULL,
      notes                  TEXT,
      created_at             TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_returns_order    ON returns(original_order_id);
    CREATE INDEX IF NOT EXISTS idx_returns_cashier  ON returns(cashier_id);
    CREATE INDEX IF NOT EXISTS idx_returns_created  ON returns(created_at);

    -- Return line items (one row per product returned)
    CREATE TABLE IF NOT EXISTS return_items (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      return_id           INTEGER NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
      order_item_id       INTEGER NOT NULL REFERENCES order_items(id),
      product_id          INTEGER NOT NULL REFERENCES products(id),
      quantity_returned   INTEGER NOT NULL,
      unit_price_in_cents INTEGER NOT NULL,
      subtotal_in_cents   INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_return_items_return ON return_items(return_id);
  `);

  sqlite
    .prepare(`INSERT OR IGNORE INTO schema_migrations (version) VALUES (?)`)
    .run('002_returns');
}

export function down(sqlite: Database): void {
  sqlite.exec(/* sql */ `
    DROP TABLE IF EXISTS return_items;
    DROP TABLE IF EXISTS returns;
  `);
}
