export interface Provenance {
  id: string;
  submissionId: string;
  c2paDetected: boolean;
  synthIdDetected: boolean;
  metadata: Record<string, unknown>;
  createdAt: Date;
}
