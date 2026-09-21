import { db } from '../db/index.js';
import { agentToolConnections } from '../db/schema/agents.js';
import { eq } from 'drizzle-orm';

export async function getAgentTools(agentId: string) {
  return db.select().from(agentToolConnections).where(eq(agentToolConnections.agentId, agentId));
}
