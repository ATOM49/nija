import { createLogger } from '@nija/observability';
import { extractFromText } from '@nija/extraction';
import { retrieveEvidence } from '@nija/retrieval';
import type { PipelineInput, PipelineResult } from './types';
import { generateVerdict } from './verdict-generator';

const logger = createLogger('analysis-pipeline');

export async function runAnalysisPipeline(
  input: PipelineInput,
  options: { googleSearchApiKey?: string } = {},
): Promise<PipelineResult> {
  const startMs = Date.now();

  logger.info(
    { submissionId: input.submissionId, contentType: input.contentType },
    'Starting analysis pipeline',
  );

  logger.info({ submissionId: input.submissionId }, 'Stage 1: Extraction');
  const extraction = await extractFromText(input.content, {
    detectLanguage: !input.language,
  });

  const language = input.language ?? extraction.language;

  logger.info(
    { submissionId: input.submissionId, claimsCount: extraction.claims.length },
    'Stage 2: Retrieval',
  );
  const retrieval = await retrieveEvidence(
    {
      claims: extraction.claims,
      keywords: extraction.keywords,
      language,
      maxResults: 10,
    },
    options.googleSearchApiKey,
  );

  logger.info({ submissionId: input.submissionId }, 'Stage 3: Verdict generation');
  const verdict = generateVerdict(extraction, retrieval.evidence);

  const processingMs = Date.now() - startMs;

  logger.info(
    { submissionId: input.submissionId, verdict: verdict.classification, processingMs },
    'Pipeline completed',
  );

  return {
    submissionId: input.submissionId,
    verdict,
    claims: extraction.claims,
    language,
    processingMs,
  };
}
