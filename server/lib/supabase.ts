import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: WebSocket as any },
});

/**
 * Broadcasts an event to a Supabase Realtime channel over REST (no persistent
 * connection needed) — works the same from a long-running server or a
 * stateless serverless function.
 */
export async function broadcast(channel: string, event: string, payload: unknown) {
  await supabaseAdmin.channel(channel).httpSend(event, payload);
}
