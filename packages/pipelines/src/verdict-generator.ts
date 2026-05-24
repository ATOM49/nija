import type { ExtractionResult } from '@nija/extraction';
import type { RetrievedEvidence, VerdictOutput } from '@nija/shared-types';

export function generateVerdict(
  extraction: ExtractionResult,
  evidence: RetrievedEvidence[],
): VerdictOutput {
  const hasEvidence = evidence.length > 0;
  const hasClaims = extraction.claims.length > 0;

  const classification = hasEvidence
    ? evidence.some((entry) => entry.relevanceScore > 0.8)
      ? 'likely_true'
      : 'misleading'
    : 'unverified';

  const confidence = hasEvidence
    ? Math.min(
        0.9,
        evidence.reduce((acc, entry) => acc + entry.relevanceScore, 0) / evidence.length,
      )
    : 0.4;

  const riskLevel: 'low' | 'medium' | 'high' | 'critical' =
    classification === 'misleading' ? 'medium' : 'low';

  return {
    classification,
    confidence,
    reasoning: hasClaims
      ? `Analysis based on ${extraction.claims.length} extracted claim(s). ${
          hasEvidence
            ? `Found ${evidence.length} piece(s) of supporting evidence.`
            : 'No supporting evidence found in available sources.'
        }`
      : 'No specific claims could be extracted from this content.',
    summary: `Content classified as "${classification}" with ${Math.round(confidence * 100)}% confidence.`,
    evidence,
    provenanceWarnings: [],
    riskLevel,
  };
}
