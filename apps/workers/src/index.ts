import IORedis from 'ioredis';
import { getEnv } from '@nija/config';
import { createLogger } from '@nija/observability';
import { startDedupeWorker } from './workers/dedupe-worker';
import { startIngestWorker } from './workers/ingest-worker';
import { startVerdictWorker } from './workers/verdict-worker';

const logger = createLogger('workers');

async function main() {
  const env = getEnv();
  const redis = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });

  logger.info('Starting BullMQ workers...');

  startIngestWorker(redis);
  startDedupeWorker(redis);
  startVerdictWorker(redis);

  logger.info('All workers started');

  const shutdown = async () => {
    logger.info('Shutting down workers...');
    await redis.quit();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  console.error('Worker startup failed:', err);
  process.exit(1);
});
