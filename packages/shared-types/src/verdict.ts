import type { VerdictClassification } from './analysis';
import type { RetrievedEvidence } from './evidence';

export interface VerdictOutput {
  classification: VerdictClassification;
  confidence: number;
  reasoning: string;
  summary: string;
  evidence: RetrievedEvidence[];
  provenanceWarnings: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}
