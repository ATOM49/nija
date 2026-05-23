import { createHash } from 'crypto';
import type { ContentType } from '@nija/shared-types';
import { normalizeText, normalizeUrl } from './normalize';

export function hashText(text: string): string {
  const normalized = normalizeText(text);
  return createHash('sha256').update(normalized, 'utf8').digest('hex');
}

export function hashUrl(url: string): string {
  const normalized = normalizeUrl(url);
  return createHash('sha256').update(normalized, 'utf8').digest('hex');
}

export function hashBytes(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

export function computeContentHash(input: string | Buffer, contentType: ContentType): string {
  if (contentType === 'text') {
    return hashText(input as string);
  }
  if (contentType === 'url') {
    return hashUrl(input as string);
  }
  if (input instanceof Buffer) {
    return hashBytes(input);
  }
  return createHash('sha256')
    .update(input as string, 'utf8')
    .digest('hex');
}
