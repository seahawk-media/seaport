import { handle } from 'hono/vercel';
import { app } from '../server/app.js';

// Catch-all so every /api/* path reaches the Hono app through Vercel's
// filesystem routing, which preserves the original request path.
export default handle(app);
