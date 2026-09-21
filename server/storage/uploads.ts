import { Hono } from 'hono';
import { randomUUID } from 'crypto';
import { requireAuth } from '../middleware/auth.js';
import { supabaseAdmin } from '../lib/supabase.js';

const MAX_SIZE = parseInt(process.env.UPLOAD_MAX_SIZE || '10485760', 10); // 10MB
const BUCKET = 'uploads';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

const MIME_TO_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export const uploadsApp = new Hono();

// Upload endpoint — requires authentication
uploadsApp.post('/api/uploads', requireAuth, async (c) => {
  const body = await c.req.parseBody();
  const file = body['file'];

  if (!file || !(file instanceof File)) {
    return c.json({ error: 'No file provided' }, 400);
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return c.json({ error: 'Invalid file type. Allowed: PNG, JPEG, WebP, GIF' }, 400);
  }

  if (file.size > MAX_SIZE) {
    return c.json({ error: `File too large. Max ${MAX_SIZE / 1024 / 1024}MB` }, 413);
  }

  const ext = MIME_TO_EXT[file.type] || 'bin';
  const filename = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabaseAdmin.storage.from(BUCKET).upload(filename, buffer, {
    contentType: file.type,
  });

  if (error) {
    return c.json({ error: 'Upload failed' }, 500);
  }

  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(filename);
  return c.json({ url: data.publicUrl, filename });
});
