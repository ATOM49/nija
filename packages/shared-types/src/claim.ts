export interface Claim {
  id: string;
  analysisId: string;
  claimText: string;
  normalizedClaim: string;
  confidence: number;
  createdAt: Date;
}

export interface ExtractedClaim {
  claimText: string;
  normalizedClaim: string;
  confidence: number;
}
