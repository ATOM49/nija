/**
 * Normalizes text for consistent hashing across different inputs.
 * - Lowercases
 * - Removes punctuation
 * - Collapses whitespace
 */
export function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizes a URL for deduplication.
 * Removes tracking parameters, normalizes scheme, etc.
 */
export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const trackingParams = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'fbclid',
      'gclid',
      'ref',
    ];
    trackingParams.forEach((p) => parsed.searchParams.delete(p));
    parsed.hostname = parsed.hostname.toLowerCase();
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return url.toLowerCase().trim();
  }
}
