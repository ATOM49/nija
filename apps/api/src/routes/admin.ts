import { desc } from '@nija/db';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getDb, moderationReviews, moderationRules, retentionPolicies } from '@nija/db';

export const adminRoutes: FastifyPluginAsync = async (app) => {
  app.get('/reviews', async (_req, reply) => {
    const db = getDb();
    const reviews = await db
      .select()
      .from(moderationReviews)
      .orderBy(desc(moderationReviews.createdAt))
      .limit(100);

    return reply.send({ reviews });
  });

  app.post('/rules', async (req, reply) => {
    const schema = z.object({
      type: z.enum(['blocked_domain', 'trusted_domain', 'escalation_threshold']),
      value: z.string().min(1),
    });
    const body = schema.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ error: 'Validation failed' });
    }
    const db = getDb();
    const [rule] = await db.insert(moderationRules).values(body.data).returning();
    return reply.code(201).send(rule);
  });

  app.post('/retention', async (req, reply) => {
    const schema = z.object({
      rawUploadDays: z.number().int().positive(),
      transcriptDays: z.number().int().positive(),
      evidenceDays: z.number().int().positive(),
      verdictDays: z.number().int().positive(),
    });
    const body = schema.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ error: 'Validation failed' });
    }
    const db = getDb();
    const [policy] = await db.insert(retentionPolicies).values(body.data).returning();
    return reply.code(201).send(policy);
  });

  app.post('/verdict-override', async (req, reply) => {
    const schema = z.object({
      submissionId: z.string().uuid(),
      reviewerId: z.string(),
      decision: z.enum(['approved', 'rejected', 'escalated', 'pending']),
      notes: z.string().optional(),
    });
    const body = schema.safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ error: 'Validation failed' });
    }
    const db = getDb();
    const [review] = await db
      .insert(moderationReviews)
      .values({
        submissionId: body.data.submissionId,
        reviewerId: body.data.reviewerId,
        decision: body.data.decision,
        notes: body.data.notes ?? null,
      })
      .returning();
    return reply.code(201).send(review);
  });
};
