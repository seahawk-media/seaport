import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index';

const connectionString = process.env.DATABASE_URL!;
// `prepare: false` is required for Supabase's transaction-mode pooler (PgBouncer),
// which doesn't support session-level prepared statements.
const queryClient = postgres(connectionString, { prepare: false });

export const db = drizzle(queryClient, { schema });
export type Database = typeof db;
