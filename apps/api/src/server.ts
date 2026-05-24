import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import Fastify from 'fastify';
import { getEnv } from '@nija/config';
import { createLogger } from '@nija/observability';
import { adminRoutes } from './routes/admin';
import { analysisRoutes } from './routes/analysis';
import { healthRoutes } from './routes/health';
import { historyRoutes } from './routes/history';
import { submissionsRoutes } from './routes/submissions';

const logger = createLogger('api');

export async function buildApp() {
  const env = getEnv();

  const app = Fastify({
    logger: {
      level: 'info',
      transport:
        env.NODE_ENV === 'development'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
  });

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: env.NODE_ENV === 'production' ? ['https://nija.app'] : true,
  });
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  await app.register(healthRoutes, { prefix: '/health' });
  await app.register(submissionsRoutes, { prefix: '/v1/submissions' });
  await app.register(analysisRoutes, { prefix: '/v1/analysis' });
  await app.register(historyRoutes, { prefix: '/v1/history' });
  await app.register(adminRoutes, { prefix: '/v1/admin' });

  return app;
}

async function start() {
  const env = getEnv();
  const app = await buildApp();

  try {
    await app.listen({ port: env.API_PORT, host: env.API_HOST });
    logger.info({ port: env.API_PORT }, 'API server started');
  } catch (err) {
    logger.error(err, 'Failed to start server');
    process.exit(1);
  }
}

start();
