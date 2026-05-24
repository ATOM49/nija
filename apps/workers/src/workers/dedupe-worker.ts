import { and, eq, ne } from '@nija/db';
import { Queue, Worker } from 'bullmq';
import type IORedis from 'ioredis';
import { APP_CONFIG } from '@nija/config';
import { analyses, getDb, submissions } from '@nija/db';
import { createLogger } from '@nija/observability';

const logger = createLogger('dedupe-worker');

interface DedupeJobData {
  submissionId: string;
  contentType: string;
  content: string;
  normalizedHash: string;
}

export function startDedupeWorker(redis: IORedis) {
  const verdictQueue = new Queue(APP_CONFIG.queues.verdict, { connection: redis });

  const worker = new Worker<DedupeJobData>(
    APP_CONFIG.queues.dedupe,
    async (job) => {
      const { submissionId, contentType, content, normalizedHash } = job.data;
      logger.info({ submissionId, jobId: job.id }, 'Processing dedupe job');

      const db = getDb();

      const existingCompleted = await db
        .select({ analysisId: analyses.id })
        .from(submissions)
        .innerJoin(analyses, eq(analyses.submissionId, submissions.id))
        .where(
          and(eq(submissions.normalizedHash, normalizedHash), ne(submissions.id, submissionId)),
        )
        .limit(1);

      if (existingCompleted.length > 0) {
        await db
          .update(submissions)
          .set({ status: 'completed', updatedAt: new Date() })
          .where(eq(submissions.id, submissionId));

        logger.info(
          { submissionId, reusedAnalysis: existingCompleted[0]?.analysisId },
          'Reused existing analysis',
        );
        return;
      }

      await db
        .update(submissions)
        .set({ status: 'processing', updatedAt: new Date() })
        .where(eq(submissions.id, submissionId));

      await verdictQueue.add(
        'verdict',
        { submissionId, contentType, content },
        { attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
      );

      logger.info({ submissionId }, 'Dedupe complete, enqueued for verdict');
    },
    { connection: redis, concurrency: 10 },
  );

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Dedupe job failed');
  });

  return worker;
}
