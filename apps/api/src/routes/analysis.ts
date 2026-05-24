import { eq } from '@nija/db';
import type { FastifyPluginAsync } from 'fastify';
import { analyses, claims, evidence, getDb } from '@nija/db';

export const analysisRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const db = getDb();

    const [analysis] = await db
      .select()
      .from(analyses)
      .where(eq(analyses.id, req.params.id))
      .limit(1);

    if (!analysis) {
      return reply.code(404).send({ error: 'Analysis not found' });
    }

    const analysisClaimsResult = await db
      .select()
      .from(claims)
      .where(eq(claims.analysisId, analysis.id));

    const evidenceResult =
      analysisClaimsResult.length > 0
        ? await db.select().from(evidence).where(eq(evidence.claimId, analysisClaimsResult[0]!.id))
        : [];

    return reply.send({
      ...analysis,
      claims: analysisClaimsResult,
      evidence: evidenceResult,
    });
  });
};
