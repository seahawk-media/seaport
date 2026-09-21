import { handle } from 'hono/vercel';
import { app } from './app.js';

const honoHandler = handle(app);

export default function debugHandler(req: Request) {
  console.log('[VERCEL-ENTRY]', req.method, req.url);
  return honoHandler(req);
}
