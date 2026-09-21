import type { Context, Next } from 'hono';
import { sql } from 'drizzle-orm';
import { db } from '../db/index';
import { rateLimits } from '../db/schema/rate-limits';

/**
 * Postgres-backed rate limiter — works correctly across multiple serverless
 * instances (unlike an in-memory store, which each instance would keep separately).
 * The upsert's CASE logic keeps the increment-or-reset atomic under concurrent requests.
 */
export function rateLimit(opts: {
  windowMs: number;
  max: number;
  message?: string;
  name: string;
}) {
  return async (c: Context, next: Next) => {
    const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
      || c.req.header('x-real-ip')
      || 'unknown';
    const key = `${opts.name}:${ip}`;
    const now = new Date();
    const resetAt = new Date(now.getTime() + opts.windowMs);

    const [row] = await db
      .insert(rateLimits)
      .values({ key, count: 1, resetAt })
      .onConflictDoUpdate({
        target: rateLimits.key,
        set: {
          count: sql`CASE WHEN ${rateLimits.resetAt} <= now() THEN 1 ELSE ${rateLimits.count} + 1 END`,
          resetAt: sql`CASE WHEN ${rateLimits.resetAt} <= now() THEN ${resetAt.toISOString()}::timestamptz ELSE ${rateLimits.resetAt} END`,
        },
      })
      .returning({ count: rateLimits.count, resetAt: rateLimits.resetAt });

    if (row.count > opts.max) {
      const retryAfterSec = Math.max(1, Math.ceil((row.resetAt.getTime() - now.getTime()) / 1000));
      c.header('Retry-After', String(retryAfterSec));
      return c.json({ error: opts.message || 'Too many requests' }, 429);
    }

    await next();
  };
}
