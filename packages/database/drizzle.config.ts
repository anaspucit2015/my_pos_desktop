import type { Config } from 'drizzle-kit';

export default {
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env['DATABASE_PATH'] ?? 'pos.db',
  },
} satisfies Config;
