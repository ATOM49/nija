import type { Evidence } from './evidence';

export type VerdictClassification = 'likely_false' | 'misleading' | 'unverified' | 'likely_true';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Analysis {
  id: string;
  submissionId: string;
  verdict: VerdictClassification;
  confidence: number;
  summary: string;
  riskLevel: RiskLevel;
  reasoning: string;
  evidence: Evidence[];
  provenanceWarnings: string[];
  createdAt: Date;
}

export interface VerdictResult {
  classification: VerdictClassification;
  confidence: number;
  reasoning: string;
  evidence: Evidence[];
  provenanceWarnings: string[];
}
