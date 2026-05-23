import type { ModelConfig } from './types';

export const MODEL_CONFIGS = {
  extraction: {
    provider: 'openai' as const,
    model: 'gpt-4.1-mini',
    maxTokens: 2048,
    temperature: 0,
  } satisfies ModelConfig,
  reasoning: {
    provider: 'anthropic' as const,
    model: 'claude-sonnet-4-5',
    maxTokens: 4096,
    temperature: 0.1,
  } satisfies ModelConfig,
  embeddings: {
    provider: 'openai' as const,
    model: 'text-embedding-3-small',
    maxTokens: 8191,
    temperature: 0,
  } satisfies ModelConfig,
} as const;
