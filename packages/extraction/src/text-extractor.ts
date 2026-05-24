import type { ExtractionOptions, ExtractionResult } from './types';

export async function extractFromText(
  text: string,
  options: ExtractionOptions = {},
): Promise<ExtractionResult> {
  const { maxClaims = 10, detectLanguage = true } = options;
  const language = detectLanguage ? detectLanguageHeuristic(text) : 'en';

  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);

  const claims = sentences.slice(0, maxClaims);
  const entities = extractEntities(text);
  const keywords = extractKeywords(text);

  return {
    language,
    normalizedText: text.trim(),
    claims,
    entities,
    keywords,
  };
}

function detectLanguageHeuristic(text: string): string {
  if (/[\u0900-\u097F]/.test(text)) return 'hi';
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta';
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te';
  if (/[\u0C80-\u0CFF]/.test(text)) return 'kn';
  if (/[\u0D00-\u0D7F]/.test(text)) return 'ml';
  if (/[\u0980-\u09FF]/.test(text)) return 'bn';
  return 'en';
}

function extractEntities(text: string): string[] {
  const words = text.split(/\s+/);
  const entities = words.filter((w) => /^[A-Z][a-zA-Z]{2,}$/.test(w));
  return [...new Set(entities)].slice(0, 20);
}

const STOPWORDS = new Set([
  'the',
  'a',
  'an',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'have',
  'has',
  'had',
  'do',
  'does',
  'did',
  'will',
  'would',
  'could',
  'should',
  'may',
  'might',
  'shall',
  'can',
  'need',
  'dare',
  'ought',
  'to',
  'of',
  'in',
  'for',
  'on',
  'with',
  'at',
  'by',
  'from',
  'as',
  'into',
  'through',
  'during',
  'before',
  'after',
  'above',
  'below',
  'and',
  'but',
  'or',
  'nor',
  'so',
  'yet',
  'both',
  'either',
  'neither',
  'not',
  'only',
  'own',
  'same',
  'than',
  'too',
  'very',
  'just',
  'that',
  'this',
  'these',
  'those',
  'which',
  'who',
  'whom',
  'whose',
  'what',
  'when',
  'where',
  'why',
  'how',
  'it',
  'its',
  'he',
  'she',
  'they',
  'we',
  'you',
  'i',
  'my',
  'your',
  'his',
  'her',
  'our',
  'their',
]);

function extractKeywords(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w));

  const freq = new Map<string, number>();
  for (const word of words) {
    freq.set(word, (freq.get(word) ?? 0) + 1);
  }

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}
