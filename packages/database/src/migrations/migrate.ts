import Database from 'better-sqlite3';
import { up as up001 } from './001_initial_schema.js';

const DB_PATH = process.env['DATABASE_PATH'] ?? 'pos.db';

/**
 * Runs all pending migrations in order.
 * Safe to call multiple times — already-applied migrations are skipped.
 */
function migrate(): void {
  const sqlite = new Database(DB_PATH);
  sqlite.pragma('foreign_keys = ON');
  sqlite.pragma('journal_mode = WAL');

  console.warn(`Running migrations on: ${DB_PATH}`);

  up001(sqlite);

  console.warn('Migrations complete.');
  sqlite.close();
}

migrate();
