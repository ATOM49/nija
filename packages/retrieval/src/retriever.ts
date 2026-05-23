import type { RetrievedEvidence } from '@nija/shared-types';
import type { RetrievalQuery, RetrievalResult } from './types';

export async function retrieveEvidence(
  query: RetrievalQuery,
  apiKey?: string,
): Promise<RetrievalResult> {
  const evidence: RetrievedEvidence[] = [];

  if (apiKey && query.claims.length > 0) {
    // Future: call Google Custom Search API.
  }

  return {
    evidence,
    sources: [],
    retrievedAt: new Date(),
  };
}
