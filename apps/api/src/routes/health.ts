import type { FastifyPluginAsync } from 'fastify';

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', async (_req, reply) => {
    return reply.code(200).send({ status: 'ok', timestamp: new Date().toISOString() });
  });
};
