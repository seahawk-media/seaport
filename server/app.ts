import 'dotenv/config';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from './trpc/router.js';
import { createContext } from './trpc/context.js';
import { auth } from './auth/index.js';
import { uploadsApp } from './storage/uploads.js';
import { rateLimit } from './middleware/rate-limit.js';

export const app = new Hono();

// DEBUG: unmistakable log at the very first point of Hono's middleware chain
app.use('*', async (c, next) => {
  console.log('[HONO-ENTRY]', c.req.method, c.req.path);
  await next();
});

// DEBUG: echoes back request info directly in the response body, for ANY method,
// so we can see the result in the Network tab without depending on Runtime Logs.
app.all('/api/debug-echo', (c) => {
  return c.json({ ok: true, method: c.req.method, path: c.req.path });
});

// Security headers middleware
app.use('*', async (c, next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '0');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (process.env.NODE_ENV === 'production') {
    c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
});

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: process.env.SITE_URL || 'http://localhost:8080',
  credentials: true,
}));

// Rate limit auth endpoints: 10 attempts per 15 minutes per IP
app.use('/api/auth/*', rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Too many login attempts. Please try again later.', name: 'auth' }));

// Rate limit uploads: 20 per minute per IP
app.use('/api/uploads', rateLimit({ windowMs: 60 * 1000, max: 20, message: 'Upload rate limit exceeded.', name: 'uploads' }));

// Better Auth handler
app.on(['GET', 'POST'], '/api/auth/**', async (c) => {
  return auth.handler(c.req.raw);
});

// tRPC handler
app.use('/trpc/*', async (c) => {
  return fetchRequestHandler({
    endpoint: '/trpc',
    req: c.req.raw,
    router: appRouter,
    createContext: () => createContext(c),
  });
});

// File uploads
app.route('/', uploadsApp);
