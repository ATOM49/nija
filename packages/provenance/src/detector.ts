export interface ProvenanceDetectionResult {
  c2paDetected: boolean;
  synthIdDetected: boolean;
  metadata: Record<string, unknown>;
  warnings: string[];
}

export async function detectProvenance(
  _input: Buffer | string,
): Promise<ProvenanceDetectionResult> {
  return {
    c2paDetected: false,
    synthIdDetected: false,
    metadata: {},
    warnings: [],
  };
}
