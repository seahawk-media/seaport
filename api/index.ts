import type { IncomingMessage, ServerResponse } from 'node:http';

// Single entrypoint for the whole API; vercel.json rewrites every /api/* path
// here and Hono routes from the request URL.
//
// Vercel's Node runtime invokes this with classic (req, res) objects, so the
// Web-standard `hono/vercel` adapter can't be used — getRequestListener does
// the Node <-> Fetch conversion, the same way the local server does.
//
// The app is imported dynamically so a failure while loading it surfaces as a
// readable response instead of an opaque FUNCTION_INVOCATION_FAILED.
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const [{ getRequestListener }, { app }] = await Promise.all([
      import('@hono/node-server'),
      import('../server/app.js'),
    ]);
    return getRequestListener(app.fetch)(req, res);
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        error: 'API failed to initialize',
        detail: error instanceof Error ? (error.stack ?? error.message) : String(error),
        receivedUrl: req.url,
      }),
    );
  }
}
