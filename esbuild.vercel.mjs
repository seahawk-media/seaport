// Bundles the Vercel serverless entrypoint: inlines all first-party server/**
// code into a single api/index.js, while leaving real npm packages external
// (resolved normally from node_modules at runtime). Vercel's own Node.js
// Function builder doesn't reliably bundle this project's multi-file server
// on its own, so we pre-bundle it ourselves — same approach as the tsup build
// already used for the Docker deployment target.
import { build } from 'esbuild';

await build({
  entryPoints: ['server/vercel.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'api/index.js',
  packages: 'external',
});
