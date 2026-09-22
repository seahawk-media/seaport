import 'dotenv/config';
import { Hono, type Context } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from './trpc/router.js';
import { createContext } from './trpc/context.js';
import { auth } from './auth/index.js';
import { uploadsApp } from './storage/uploads.js';
import { rateLimit } from './middleware/rate-limit.js';

export const app = new Hono();

// Liveness check — confirms the API is reachable and which commit is serving it.
app.get('/api/health', (c) => {
  return c.json({
    ok: true,
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? 'local',
    pathSeenByServer: c.req.path,
  });
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

// tRPC handler. Mounted under /api so Vercel routes it to this function via
// filesystem routing; /trpc is kept for local dev and older clients.
const trpcHandler = (endpoint: string) => async (c: Context) =>
  fetchRequestHandler({
    endpoint,
    req: c.req.raw,
    router: appRouter,
    createContext: () => createContext(c),
  });

app.use('/api/trpc/*', trpcHandler('/api/trpc'));
app.use('/trpc/*', trpcHandler('/trpc'));

// File uploads
app.route('/', uploadsApp);

// On Vercel this app owns every /api/* path, so an unmatched request means the
// path arrived differently than expected — report it rather than 404 silently.
// Not registered locally, where server/index.ts serves the SPA from here.
if (process.env.VERCEL) {
  app.all('*', (c) =>
    c.json({ error: 'No route matched', pathSeenByServer: c.req.path, url: c.req.url }, 404),
  );
}
