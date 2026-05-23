import { desc, eq } from '@nija/db';
import type { FastifyPluginAsync } from 'fastify';
import { getDb, submissions } from '@nija/db';

export const historyRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', async (req, reply) => {
    const userId = (req.headers['x-user-id'] as string) ?? 'anonymous';
    const db = getDb();

    const userSubmissions = await db
      .select()
      .from(submissions)
      .where(eq(submissions.userId, userId))
      .orderBy(desc(submissions.createdAt))
      .limit(50);

    return reply.send({ submissions: userSubmissions });
  });
};
