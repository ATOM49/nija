import { eq } from '@nija/db';
import { Worker } from 'bullmq';
import type IORedis from 'ioredis';
import { APP_CONFIG } from '@nija/config';
import { analyses, claims, evidence, getDb, submissions } from '@nija/db';
import { createLogger } from '@nija/observability';
import { runAnalysisPipeline } from '@nija/pipelines';
import type { ContentType } from '@nija/shared-types';

const logger = createLogger('verdict-worker');

interface VerdictJobData {
  submissionId: string;
  contentType: string;
  content: string;
}

export function startVerdictWorker(redis: IORedis) {
  const worker = new Worker<VerdictJobData>(
    APP_CONFIG.queues.verdict,
    async (job) => {
      const { submissionId, contentType, content } = job.data;
      logger.info({ submissionId, jobId: job.id }, 'Processing verdict job');

      const db = getDb();

      try {
        const result = await runAnalysisPipeline({
          submissionId,
          contentType: contentType as ContentType,
          content,
        });

        const [analysis] = await db
          .insert(analyses)
          .values({
            submissionId,
            contentHash: submissionId,
            verdict: result.verdict.classification,
            confidence: result.verdict.confidence,
            summary: result.verdict.summary,
            riskLevel: result.verdict.riskLevel,
            reasoning: result.verdict.reasoning,
            provenanceWarnings: result.verdict.provenanceWarnings,
          })
          .returning();

        if (result.claims.length > 0 && analysis) {
          const claimRecords = await db
            .insert(claims)
            .values(
              result.claims.map((claimText) => ({
                analysisId: analysis.id,
                claimText,
                normalizedClaim: claimText.toLowerCase().trim(),
                confidence: 0.7,
              })),
            )
            .returning();

          if (result.verdict.evidence.length > 0 && claimRecords.length > 0) {
            await db.insert(evidence).values(
              result.verdict.evidence.map((entry) => ({
                claimId: claimRecords[0]!.id,
                sourceUrl: entry.sourceUrl,
                sourceType: entry.sourceType,
                snippet: entry.snippet,
                relevanceScore: entry.relevanceScore,
              })),
            );
          }
        }

        await db
          .update(submissions)
          .set({ status: 'completed', updatedAt: new Date() })
          .where(eq(submissions.id, submissionId));

        logger.info(
          {
            submissionId,
            verdict: result.verdict.classification,
            processingMs: result.processingMs,
          },
          'Verdict job completed',
        );
      } catch (err) {
        logger.error({ submissionId, err }, 'Verdict pipeline failed');

        await db
          .update(submissions)
          .set({ status: 'failed', updatedAt: new Date() })
          .where(eq(submissions.id, submissionId));

        throw err;
      }
    },
    { connection: redis, concurrency: 3 },
  );

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Verdict job failed');
  });

  return worker;
}
