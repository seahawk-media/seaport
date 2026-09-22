import type { Hono } from 'hono';

// Single entrypoint for the whole API. vercel.json rewrites every /api/*
// path here; Hono does the routing from the request URL.
//
// The app is imported dynamically so that a failure while loading it (a bad
// import, a missing env var read at module scope, etc.) surfaces as a readable
// response instead of an opaque FUNCTION_INVOCATION_FAILED.
export default async function handler(req: Request): Promise<Response> {
  let app: Hono;
  let handle: (app: Hono) => (req: Request) => Response | Promise<Response>;

  try {
    ({ app } = await import('../server/app.js'));
    ({ handle } = await import('hono/vercel'));
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
