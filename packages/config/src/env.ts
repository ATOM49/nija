import fs from 'node:fs';
import path from 'node:path';
import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_PUBLISHABLE_KEY: z.string(),
  SUPABASE_SECRET_KEY: z.string(),
  REDIS_URL: z.string().url(),
  API_PORT: z.coerce.number().default(3001),
  API_HOST: z.string().default('0.0.0.0'),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GOOGLE_AI_API_KEY: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  POSTHOG_API_KEY: z.string().optional(),
  POSTHOG_HOST: z.string().url().optional(),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
  GOOGLE_CUSTOM_SEARCH_API_KEY: z.string().optional(),
  GOOGLE_CUSTOM_SEARCH_ENGINE_ID: z.string().optional(),
  GOOGLE_SAFE_BROWSING_API_KEY: z.string().optional(),
  STORAGE_BUCKET: z.string().default('nija-uploads'),
});

export type Env = z.infer<typeof envSchema>;

let _dotenvLoaded = false;

function findEnvFile(startDir = process.cwd()): string | null {
  let currentDir = startDir;

  while (true) {
    const candidate = path.join(currentDir, '.env');
    if (fs.existsSync(candidate)) {
      return candidate;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return null;
    }

    currentDir = parentDir;
  }
}

function ensureDotenvLoaded() {
  if (_dotenvLoaded) {
    return;
  }

  const envFile = findEnvFile();
  if (envFile) {
    loadDotenv({ path: envFile });
  }

  _dotenvLoaded = true;
}

export function loadEnv(): Env {
  ensureDotenvLoaded();

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${missing}`);
  }
  return result.data;
}

let _env: Env | null = null;

export function getEnv(): Env {
  if (!_env) {
    _env = loadEnv();
  }
  return _env;
}
