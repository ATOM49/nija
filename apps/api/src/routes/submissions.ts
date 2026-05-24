import { eq } from '@nija/db';
import { Queue } from 'bullmq';
import type { FastifyPluginAsync } from 'fastify';
import IORedis from 'ioredis';
import { z } from 'zod';
import { APP_CONFIG, getEnv } from '@nija/config';
import { getDb, submissions } from '@nija/db';
import { computeContentHash } from '@nija/hashing';
import { validateSubmission } from '@nija/ingestion';

const createSubmissionSchema = z.object({
  contentType: z.enum(['text', 'url', 'image', 'audio', 'video']),
  originalInput: z.string().min(1).max(50_000),
});

export const submissionsRoutes: FastifyPluginAsync = async (app) => {
  const env = getEnv();
  const redis = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
  const ingestQueue = new Queue(APP_CONFIG.queues.ingest, { connection: redis });

  app.post('/', async (req, reply) => {
    const body = createSubmissionSchema.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ error: 'Validation failed', details: body.error.flatten() });
    }

    const userId = (req.headers['x-user-id'] as string) ?? 'anonymous';

    const validation = validateSubmission({
      userId,
      contentType: body.data.contentType,
      originalInput: body.data.originalInput,
    });

    if (!validation.valid) {
      return reply.code(400).send({ error: 'Validation failed', details: validation.errors });
    }

    const normalizedHash = computeContentHash(body.data.originalInput, body.data.contentType);
    const db = getDb();

    const existing = await db
      .select()
      .from(submissions)
      .where(eq(submissions.normalizedHash, normalizedHash))
      .limit(1);

    if (existing.length > 0 && existing[0]?.status === 'completed') {
      return reply.code(200).send({
        submissionId: existing[0].id,
        status: 'completed',
        cached: true,
      });
    }

    const [submission] = await db
      .insert(submissions)
      .values({
        userId,
        contentType: body.data.contentType,
        originalInput: body.data.originalInput,
        normalizedHash,
        status: 'pending',
      })
      .returning();

    await ingestQueue.add(
      'ingest',
      {
        submissionId: submission.id,
        contentType: body.data.contentType,
        content: body.data.originalInput,
        normalizedHash,
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      },
    );

    return reply.code(201).send({
      submissionId: submission.id,
      status: 'pending',
      cached: false,
    });
  });

  app.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const db = getDb();
    const [submission] = await db
      .select()
      .from(submissions)
      .where(eq(submissions.id, req.params.id))
      .limit(1);

    if (!submission) {
      return reply.code(404).send({ error: 'Submission not found' });
    }

    return reply.send(submission);
  });
};
