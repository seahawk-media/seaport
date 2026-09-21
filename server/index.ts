import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { existsSync } from 'fs';
import { join } from 'path';
import { app } from './app';

// Serve built frontend in production
const distPath = join(process.cwd(), 'dist');
if (existsSync(distPath)) {
  app.use('/*', serveStatic({ root: './dist' }));
  // SPA fallback — serve index.html for all non-file routes
  app.get('*', serveStatic({ root: './dist', path: 'index.html' }));
}

const port = parseInt(process.env.PORT || '3000', 10);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Seaport server running on http://localhost:${info.port}`);
});
