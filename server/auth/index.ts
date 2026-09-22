import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../db/index.js';
import * as schema from '../db/schema/auth.js';
import { organizations, userRoles } from '../db/schema/organizations.js';
import { profiles } from '../db/schema/profiles.js';

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || process.env.SESSION_SECRET,
  baseURL: process.env.SITE_URL || 'http://localhost:3000',
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 min cache
    },
    expiresIn: 60 * 60 * 24 * 7, // 7 days
  },
  trustedOrigins: process.env.SITE_URL ? [process.env.SITE_URL] : [],
  databaseHooks: {
    user: {
      create: {
        // Attach every new user to the organization, so signing up can't leave
        // an account with no profile or role. During first-run setup there is
        // no organization yet — the setup wizard creates the profile and
        // super_admin role itself, so this is a no-op then.
        after: async (user) => {
          const [org] = await db.select({ id: organizations.id }).from(organizations).limit(1);
          if (!org) return;

          await db
            .insert(profiles)
            .values({
              userId: user.id,
              organizationId: org.id,
              fullName: user.name,
              email: user.email,
            })
            .onConflictDoNothing();

          await db
            .insert(userRoles)
            .values({ userId: user.id, role: 'employee' })
            .onConflictDoNothing();
        },
      },
    },
  },
});
