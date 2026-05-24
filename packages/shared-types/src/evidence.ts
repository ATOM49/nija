export type SourceType =
  | 'fact_check'
  | 'news_article'
  | 'government'
  | 'wikipedia'
  | 'social_media'
  | 'other';

export interface Evidence {
  id: string;
  claimId: string;
  sourceUrl: string;
  sourceType: SourceType;
  snippet: string;
  relevanceScore: number;
  createdAt: Date;
}

export interface RetrievedEvidence {
  sourceUrl: string;
  sourceType: SourceType;
  snippet: string;
  relevanceScore: number;
}
