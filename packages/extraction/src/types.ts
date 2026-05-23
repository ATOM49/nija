export interface ExtractionResult {
  language: string;
  normalizedText: string;
  claims: string[];
  entities: string[];
  keywords: string[];
}

export interface ExtractionOptions {
  maxClaims?: number;
  detectLanguage?: boolean;
}
