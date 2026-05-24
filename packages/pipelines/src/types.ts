import type { ContentType, VerdictOutput } from '@nija/shared-types';

export interface PipelineInput {
  submissionId: string;
  contentType: ContentType;
  content: string;
  language?: string;
}

export interface PipelineResult {
  submissionId: string;
  verdict: VerdictOutput;
  claims: string[];
  language: string;
  processingMs: number;
}
