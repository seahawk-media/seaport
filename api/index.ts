import type { Hono } from 'hono';

// Loads a module with a time limit so a hang is reported instead of stalling
// until the platform's function timeout.
async function loadWithTimeout<T>(label: string, load: () => Promise<T>, ms = 5000) {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      load(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`TIMEOUT loading ${label} after ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

// Single entrypoint for the whole API. vercel.json rewrites every /api/* path
// here; Hono routes from the request URL.
export default async function handler(req: Request): Promise<Response> {
  const pathname = new URL(req.url).pathname;

  // Diagnostics that run before any application import, so they answer even
  // when loading the app is what's broken.
  if (pathname.startsWith('/api/__probe')) {
    if (pathname === '/api/__probe') {
      return Response.json({ ok: true, stage: 'handler-reached', url: req.url });
    }
    const targets: Record<string, () => Promise<unknown>> = {
      '/api/__probe/hono': () => import('hono/vercel'),
      '/api/__probe/db': () => import('../server/db/index.js'),
      '/api/__probe/supabase': () => import('../server/lib/supabase.js'),
      '/api/__probe/auth': () => import('../server/auth/index.js'),
      '/api/__probe/router': () => import('../server/trpc/router.js'),
      '/api/__probe/app': () => import('../server/app.js'),
    };
    const target = targets[pathname];
    if (!target) return Response.json({ error: 'unknown probe', pathname }, { status: 404 });
    const started = Date.now();
    try {
      await loadWithTimeout(pathname, target);
      return Response.json({ ok: true, loaded: pathname, ms: Date.now() - started });
    } catch (error) {
      return Response.json(
        {
          ok: false,
          probe: pathname,
          ms: Date.now() - started,
          detail: error instanceof Error ? (error.stack ?? error.message) : String(error),
        },
        { status: 500 },
      );
    }
  }

  let app: Hono;
  let handle: (app: Hono) => (req: Request) => Response | Promise<Response>;
  try {
    ({ app } = await loadWithTimeout('server/app', () => import('../server/app.js'), 8000));
    ({ handle } = await loadWithTimeout('hono/vercel', () => import('hono/vercel'), 8000));
  } catch (error) {
    return Response.json(
      {
        error: 'API failed to initialize',
        detail: error instanceof Error ? (error.stack ?? error.message) : String(error),
        receivedUrl: req.url,
      },
      { status: 500 },
    );
  }

  try {
    return await handle(app)(req);
  } catch (error) {
    return Response.json(
      {
        error: 'Request failed',
        detail: error instanceof Error ? (error.stack ?? error.message) : String(error),
        receivedUrl: req.url,
      },
      { status: 500 },
    );
  }
}
