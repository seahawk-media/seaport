import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core';

// Shared rate-limit counters (login attempts, upload throttling, etc.).
// Keyed by "<bucket>:<ip>" so different limiters don't collide.
export const rateLimits = pgTable('rate_limits', {
  key: text('key').primaryKey(),
  count: integer('count').notNull().default(1),
  resetAt: timestamp('reset_at', { withTimezone: true }).notNull(),
});
