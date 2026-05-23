import type { RetrievedEvidence } from '@nija/shared-types';

export interface RetrievalQuery {
  claims: string[];
  keywords: string[];
  language: string;
  maxResults?: number;
}

export interface RetrievalResult {
  evidence: RetrievedEvidence[];
  sources: string[];
  retrievedAt: Date;
}

export interface EvidenceRetriever {
  retrieve(query: RetrievalQuery): Promise<RetrievalResult>;
}
