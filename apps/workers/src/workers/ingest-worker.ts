import { eq } from '@nija/db';
import { Queue, Worker } from 'bullmq';
import type IORedis from 'ioredis';
import { APP_CONFIG } from '@nija/config';
import { getDb, submissions } from '@nija/db';
import { createLogger } from '@nija/observability';

const logger = createLogger('ingest-worker');

interface IngestJobData {
  submissionId: string;
  contentType: string;
  content: string;
  normalizedHash: string;
}

export function startIngestWorker(redis: IORedis) {
  const dedupeQueue = new Queue(APP_CONFIG.queues.dedupe, { connection: redis });

  const worker = new Worker<IngestJobData>(
    APP_CONFIG.queues.ingest,
    async (job) => {
      const { submissionId, contentType, content, normalizedHash } = job.data;
      logger.info({ submissionId, jobId: job.id }, 'Processing ingest job');

      const db = getDb();

      await db
        .update(submissions)
        .set({ status: 'deduplicating', updatedAt: new Date() })
        .where(eq(submissions.id, submissionId));

      await dedupeQueue.add(
        'dedupe',
        { submissionId, contentType, content, normalizedHash },
        { attempts: 3, backoff: { type: 'exponential', delay: 1000 } },
      );

      logger.info({ submissionId }, 'Ingest job completed, enqueued for dedupe');
    },
    { connection: redis, concurrency: 5 },
  );

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Ingest job failed');
  });

  return worker;
}
