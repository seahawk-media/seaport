import { router } from './trpc.js';
import { setupRouter } from './routes/setup.js';
import { orgRouter } from './routes/org.js';
import { usersRouter } from './routes/users.js';
import { invitationsRouter } from './routes/invitations.js';
import { departmentsRouter } from './routes/departments.js';
import { teamsRouter } from './routes/teams.js';
import { teamMembersRouter } from './routes/team-members.js';
import { profilesRouter } from './routes/profiles.js';
import { positionsRouter } from './routes/positions.js';
import { agentsRouter } from './routes/agents.js';
import { agentChatRouter } from './routes/agent-chat.js';
import { reviewsRouter } from './routes/reviews.js';
import { promotionsRouter } from './routes/promotions.js';
import { measurablesRouter } from './routes/measurables.js';
import { incentivesRouter } from './routes/incentives.js';
import { academyRouter } from './routes/academy.js';
import { toolsRouter } from './routes/tools.js';
import { tasksRouter } from './routes/tasks.js';
import { meetingsRouter } from './routes/meetings.js';
import { sopsRouter } from './routes/sops.js';
import { calendarRouter } from './routes/calendar.js';
import { coreValuesRouter } from './routes/core-values.js';
import { timeOffRouter } from './routes/time-off.js';
import { overtimeRouter } from './routes/overtime.js';
import { feedbackRouter } from './routes/feedback.js';
import { activityRouter } from './routes/activity.js';

import { aiConfigRouter } from './routes/ai-config.js';
import { agentIdentityRouter } from './routes/agent-identity.js';
import { journeyEventTypesRouter } from './routes/journey-event-types.js';

export const appRouter = router({
  setup: setupRouter,
  org: orgRouter,
  users: usersRouter,
  invitations: invitationsRouter,
  departments: departmentsRouter,
  teams: teamsRouter,
  teamMembers: teamMembersRouter,
  profiles: profilesRouter,
  positions: positionsRouter,
  agents: agentsRouter,
  agentChat: agentChatRouter,
  reviews: reviewsRouter,
  promotions: promotionsRouter,
  measurables: measurablesRouter,
  incentives: incentivesRouter,
  academy: academyRouter,
  tools: toolsRouter,
  tasks: tasksRouter,
  meetings: meetingsRouter,
  sops: sopsRouter,
  calendar: calendarRouter,
  coreValues: coreValuesRouter,
  timeOff: timeOffRouter,
  overtime: overtimeRouter,
  feedback: feedbackRouter,
  activity: activityRouter,

  aiConfig: aiConfigRouter,
  agentIdentity: agentIdentityRouter,
  journeyEventTypes: journeyEventTypesRouter,
});

export type AppRouter = typeof appRouter;
