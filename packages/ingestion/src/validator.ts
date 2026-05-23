import type { CreateSubmissionInput } from '@nija/shared-types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const MAX_TEXT_LENGTH = 50_000;
const MAX_URL_LENGTH = 2048;

export function validateSubmission(input: CreateSubmissionInput): ValidationResult {
  const errors: string[] = [];

  if (!input.userId || input.userId.trim().length === 0) {
    errors.push('userId is required');
  }

  if (!input.contentType) {
    errors.push('contentType is required');
  }

  if (!input.originalInput || input.originalInput.trim().length === 0) {
    errors.push('originalInput is required');
  }

  if (input.contentType === 'text' && input.originalInput.length > MAX_TEXT_LENGTH) {
    errors.push(`Text content exceeds maximum length of ${MAX_TEXT_LENGTH} characters`);
  }

  if (input.contentType === 'url') {
    if (input.originalInput.length > MAX_URL_LENGTH) {
      errors.push(`URL exceeds maximum length of ${MAX_URL_LENGTH} characters`);
    }
    try {
      new URL(input.originalInput);
    } catch {
      errors.push('Invalid URL format');
    }
  }

  return { valid: errors.length === 0, errors };
}
