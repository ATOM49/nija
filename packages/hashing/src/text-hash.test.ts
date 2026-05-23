import { describe, expect, it } from 'vitest';
import { normalizeText, normalizeUrl } from './normalize';
import { computeContentHash, hashText, hashUrl } from './text-hash';

describe('normalizeText', () => {
  it('lowercases text', () => {
    expect(normalizeText('HELLO WORLD')).toBe('hello world');
  });

  it('removes punctuation', () => {
    expect(normalizeText('Hello, World!')).toBe('hello world');
  });

  it('collapses whitespace', () => {
    expect(normalizeText('hello   world')).toBe('hello world');
  });

  it('trims leading/trailing whitespace', () => {
    expect(normalizeText('  hello world  ')).toBe('hello world');
  });
});

describe('normalizeUrl', () => {
  it('removes UTM parameters', () => {
    const url = 'https://example.com/article?utm_source=twitter&utm_medium=social';
    const normalized = normalizeUrl(url);
    expect(normalized).not.toContain('utm_source');
    expect(normalized).toContain('example.com');
  });

  it('removes trailing slash', () => {
    expect(normalizeUrl('https://example.com/')).toBe('https://example.com');
  });
});

describe('hashText', () => {
  it('returns same hash for normalized identical text', () => {
    const h1 = hashText('Hello, World!');
    const h2 = hashText('hello world');
    expect(h1).toBe(h2);
  });

  it('returns a 64-char hex string', () => {
    const hash = hashText('test');
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });

  it('returns different hashes for different content', () => {
    expect(hashText('foo')).not.toBe(hashText('bar'));
  });
});

describe('hashUrl', () => {
  it('returns same hash for URL with and without tracking params', () => {
    const h1 = hashUrl('https://example.com/article');
    const h2 = hashUrl('https://example.com/article?utm_source=twitter');
    expect(h1).toBe(h2);
  });
});

describe('computeContentHash', () => {
  it('delegates to hashText for text content', () => {
    const result = computeContentHash('hello world', 'text');
    expect(result).toBe(hashText('hello world'));
  });

  it('delegates to hashUrl for url content', () => {
    const result = computeContentHash('https://example.com', 'url');
    expect(result).toBe(hashUrl('https://example.com'));
  });
});
