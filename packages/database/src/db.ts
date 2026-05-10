import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';

/** Path is configurable so tests can pass ':memory:' */
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let _sqlite: Database.Database | null = null;

/**
 * Returns the singleton Drizzle database instance.
 * On first call the connection is opened and WAL mode is enabled.
 *
 * @param dbPath - Filesystem path to the SQLite file, or ':memory:' for tests.
 *                 Only used on the first call; subsequent calls return the cached instance.
 */
export function getDb(
  dbPath: string = process.env['DATABASE_PATH'] ?? 'pos.db',
): ReturnType<typeof drizzle<typeof schema>> {
  if (_db) return _db;

  _sqlite = new Database(dbPath);

  // Enable WAL mode for better concurrent read performance
  _sqlite.pragma('journal_mode = WAL');
  // Enforce foreign key constraints (SQLite has them off by default)
  _sqlite.pragma('foreign_keys = ON');

  _db = drizzle(_sqlite, { schema });
  return _db;
}

/**
 * Closes the active SQLite connection and clears the singleton.
 * Primarily used in tests to reset state between runs.
 */
export function closeDb(): void {
  _sqlite?.close();
  _sqlite = null;
  _db = null;
}

/** Exported type alias for use in repository constructors */
export type Db = ReturnType<typeof getDb>;
