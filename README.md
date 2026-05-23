# nija — TruthLens / ForwardCheck

> **A platform to flag content that has dubious sources.**

Nija is a monorepo for the TruthLens / ForwardCheck misinformation-detection platform. Users share suspicious content from WhatsApp, X, Instagram, YouTube, or a browser; nija analyses it and returns a structured verdict with confidence, evidence, provenance signals, and safety warnings.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Manual Setup](#manual-setup)
- [Scripts Reference](#scripts-reference)
- [Architecture](#architecture)
- [Monorepo Structure](#monorepo-structure)
- [Package Overview](#package-overview)
- [API Reference](#api-reference)
- [Environment Variables](#environment-variables)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Build Phases](#build-phases)

---

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/ATOM49/nija.git && cd nija

# 2. Run the one-shot bootstrap script
pnpm bootstrap
# — or directly:
bash scripts/bootstrap.sh
```

The bootstrap script will:

1. Check prerequisites (Node 20+, pnpm 9+, Docker)
2. Copy `.env.example` → `.env`
3. Install all workspace dependencies
4. Start postgres + redis via docker-compose
5. Apply database migrations
6. Build all packages

After bootstrapping, open `.env` and fill in your API keys, then start developing:

```bash
pnpm dev                        # start all apps in parallel (turbo)
pnpm --filter @nija/api dev     # start only the API server
pnpm --filter @nija/workers dev # start only the BullMQ workers
pnpm --filter @nija/web dev     # start only the web app
```

---

## Prerequisites

| Tool   | Minimum version | Install                             |
| ------ | --------------- | ----------------------------------- |
| Node   | 20              | https://nodejs.org                  |
| pnpm   | 9               | `npm install -g pnpm@9`             |
| Docker | any             | https://docs.docker.com/get-docker/ |

---

## Manual Setup

If you prefer not to use the bootstrap script:

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment file
cp .env.example .env
# Edit .env and fill in your credentials

# 3. Start infrastructure
pnpm infra:up

# 4. Run database migrations
pnpm db:migrate

# 5. Build all packages
pnpm build
```

---

## Scripts Reference

All scripts are run from the repository root using `pnpm <script>`.

| Script              | Description                                                        |
| ------------------- | ------------------------------------------------------------------ |
| `pnpm bootstrap`    | One-shot setup: prereqs → .env → install → infra → migrate → build |
| `pnpm validate`     | Full health check: deps → lint → format → typecheck → tests        |
| `pnpm validate:fix` | Same as validate but auto-fixes lint and format issues             |
| `pnpm dev`          | Start all apps in parallel (turbo watch mode)                      |
| `pnpm build`        | Build all packages and apps (turbo)                                |
| `pnpm lint`         | Lint all packages (turbo)                                          |
| `pnpm test`         | Run all tests (turbo)                                              |
| `pnpm format`       | Format all files with Prettier                                     |
| `pnpm infra:up`     | Start postgres + redis via docker-compose                          |
| `pnpm infra:down`   | Stop all infrastructure containers                                 |
| `pnpm infra:logs`   | Tail infrastructure container logs                                 |
| `pnpm db:migrate`   | Apply Drizzle ORM migrations                                       |
| `pnpm db:studio`    | Open Drizzle Studio (visual DB browser)                            |

### Bootstrap Script Options

```bash
bash scripts/bootstrap.sh [--skip-infra] [--skip-install]
```

| Flag             | Effect                                           |
| ---------------- | ------------------------------------------------ |
| `--skip-infra`   | Skip docker-compose (useful if infra is running) |
| `--skip-install` | Skip pnpm install (useful in warm CI cache)      |

### Validate Script Options

```bash
bash scripts/validate.sh [--fix]
```

| Flag    | Effect                                           |
| ------- | ------------------------------------------------ |
| `--fix` | Auto-fix ESLint and Prettier issues before check |

---

## Architecture

```
User shares content (WhatsApp / X / Instagram / URL / file)
          │
          ▼
     POST /v1/submissions   (Fastify API)
          │
          ▼
  ┌─ Hash + Dedupe ──────────────────────────────────────┐
  │  normalizedHash lookup → reuse existing analysis?    │
  └──────────────────────────────────────────────────────┘
          │ (new content)
          ▼
  ┌─ BullMQ Pipeline ────────────────────────────────────┐
  │  ingest → dedupe → extract → claims → retrieve       │
  │         → verdict → notify                           │
  └──────────────────────────────────────────────────────┘
          │
          ▼
  ┌─ Analysis Result ────────────────────────────────────┐
  │  verdict · confidence · evidence · provenance        │
  │  safety warnings · similar prior checks              │
  └──────────────────────────────────────────────────────┘
          │
          ▼
  Client polls GET /v1/submissions/:id or receives SSE push
```

### Verdict Structure

Nija returns a structured verdict rather than a binary true/false:

```ts
{
  classification: 'likely_false' | 'misleading' | 'unverified' | 'likely_true';
  confidence: number;          // 0–1
  reasoning: string;           // human-readable explanation
  summary: string;             // one-line summary
  evidence: Evidence[];        // supporting sources
  provenanceWarnings: string[]; // C2PA / SynthID signals
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}
```

---

## Monorepo Structure

```
nija/
├── apps/
│   ├── api/        → Fastify REST API (port 3001)
│   ├── workers/    → BullMQ background workers
│   ├── web/        → Next.js 15 web app (port 3000)
│   ├── admin/      → Next.js 15 admin console (port 3002)
│   └── mobile/     → Expo React Native app
├── packages/
│   ├── shared-types/  → Domain entity TypeScript types
│   ├── config/        → Zod-validated env config + constants
│   ├── db/            → Drizzle ORM schema + Postgres client
│   ├── hashing/       → Content normalisation + SHA256 hashing
│   ├── extraction/    → Claim / entity / keyword extraction
│   ├── retrieval/     → Evidence retrieval interfaces + stubs
│   ├── pipelines/     → Analysis pipeline orchestration
│   ├── moderation/    → Moderation rules + audit logging
│   ├── observability/ → Pino logger + Sentry init
│   ├── provenance/    → C2PA / SynthID detection stubs
│   ├── ingestion/     → Submission input validation
│   └── ai-core/       → AI model config types
├── scripts/
│   ├── bootstrap.sh   → One-shot project setup
│   └── validate.sh    → Project health validation
├── docker-compose.yml → postgres + redis
├── turbo.json         → Turborepo task configuration
└── pnpm-workspace.yaml
```

---

## Package Overview

| Package               | Purpose                                                                   |
| --------------------- | ------------------------------------------------------------------------- |
| `@nija/shared-types`  | TypeScript interfaces for all domain entities                             |
| `@nija/config`        | Zod-validated environment config; app constants (queue names, limits)     |
| `@nija/db`            | Drizzle ORM schema + Postgres client; re-exports drizzle operators        |
| `@nija/hashing`       | Text normalisation, SHA256 hashing, URL deduplication                     |
| `@nija/extraction`    | Sentence-level claim extraction; Indian language detection                |
| `@nija/retrieval`     | `EvidenceRetriever` interface; Phase 1 stub (Google/Wikipedia in Phase 2) |
| `@nija/pipelines`     | Linear extract → retrieve → verdict pipeline; ready for LangGraph swap    |
| `@nija/moderation`    | Blocked/trusted domain rules; escalation thresholds; audit logger         |
| `@nija/observability` | Pino structured logger (JSON in prod, pretty in dev); Sentry init         |
| `@nija/provenance`    | C2PA / SynthID detection stubs (Phase 6 implementation target)            |
| `@nija/ingestion`     | `validateSubmission` — input validation before enqueue                    |
| `@nija/ai-core`       | Model config types; cheap-extraction vs. reasoning model split            |

---

## API Reference

Base URL: `http://localhost:3001`

### Submissions

| Method | Path                  | Description                              |
| ------ | --------------------- | ---------------------------------------- |
| `POST` | `/v1/submissions`     | Create a submission and enqueue analysis |
| `GET`  | `/v1/submissions/:id` | Poll submission status                   |

**POST /v1/submissions**

```jsonc
// Request body
{
  "contentType": "text",           // "text" | "url" | "image" | "audio" | "video"
  "originalInput": "Some claim..."  // text content or URL
}

// Headers
X-User-Id: <user-id>   // optional; defaults to "anonymous"
```

```jsonc
// 201 Created
{ "submissionId": "uuid", "status": "pending", "cached": false }

// 200 OK (content seen before with a completed analysis)
{ "submissionId": "uuid", "status": "completed", "cached": true }
```

### Analysis

| Method | Path               | Description                           |
| ------ | ------------------ | ------------------------------------- |
| `GET`  | `/v1/analysis/:id` | Get full analysis result with verdict |

### History

| Method | Path          | Description                         |
| ------ | ------------- | ----------------------------------- |
| `GET`  | `/v1/history` | Get submission history for the user |

### Admin

| Method | Path                         | Description                  |
| ------ | ---------------------------- | ---------------------------- |
| `GET`  | `/v1/admin/reviews`          | List moderation review queue |
| `POST` | `/v1/admin/rules`            | Create a moderation rule     |
| `POST` | `/v1/admin/retention`        | Update retention policy      |
| `POST` | `/v1/admin/verdict-override` | Moderator verdict override   |

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values.

| Variable                         | Required | Description                            |
| -------------------------------- | -------- | -------------------------------------- |
| `DATABASE_URL`                   | ✅       | Postgres connection URL                |
| `SUPABASE_URL`                   | ✅       | Supabase project URL                   |
| `SUPABASE_ANON_KEY`              | ✅       | Supabase anon (public) key             |
| `SUPABASE_SERVICE_ROLE_KEY`      | ✅       | Supabase service role key              |
| `REDIS_URL`                      | ✅       | Redis connection URL                   |
| `API_PORT`                       | —        | API server port (default: `3001`)      |
| `NODE_ENV`                       | —        | `development` / `test` / `production`  |
| `OPENAI_API_KEY`                 | ⚠️       | Required for LLM extraction (Phase 2+) |
| `ANTHROPIC_API_KEY`              | ⚠️       | Required for LLM reasoning (Phase 2+)  |
| `GOOGLE_AI_API_KEY`              | ⚠️       | Required for Gemini models             |
| `SENTRY_DSN`                     | ⚠️       | Sentry error tracking DSN              |
| `POSTHOG_API_KEY`                | ⚠️       | PostHog analytics key                  |
| `OTEL_EXPORTER_OTLP_ENDPOINT`    | ⚠️       | OpenTelemetry collector endpoint       |
| `GOOGLE_CUSTOM_SEARCH_API_KEY`   | ⚠️       | Evidence retrieval (Phase 2+)          |
| `GOOGLE_CUSTOM_SEARCH_ENGINE_ID` | ⚠️       | Google Custom Search engine ID         |
| `GOOGLE_SAFE_BROWSING_API_KEY`   | ⚠️       | Safe Browsing URL check (Phase 2)      |
| `STORAGE_BUCKET`                 | —        | Supabase storage bucket name           |

> ⚠️ = optional for local development (Phase 1 runs without AI keys)

---

## Development Workflow

### Starting the full stack locally

```bash
pnpm infra:up                        # start postgres + redis
pnpm --filter @nija/api dev          # API on :3001
pnpm --filter @nija/workers dev      # BullMQ workers
pnpm --filter @nija/web dev          # web on :3000
```

Or start everything at once (requires turbo):

```bash
pnpm dev
```

### Making a submission (curl)

```bash
curl -X POST http://localhost:3001/v1/submissions \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user-123" \
  -d '{"contentType":"text","originalInput":"The government has banned all social media."}'
```

### Database

```bash
pnpm db:migrate          # apply pending migrations
pnpm db:studio           # open Drizzle Studio at http://localhost:4983
```

### Adding a new package

```bash
mkdir packages/my-package
# Create packages/my-package/package.json with "name": "@nija/my-package"
# Create packages/my-package/tsconfig.json extending ../../tsconfig.base.json
pnpm install
```

---

## Testing

```bash
pnpm test                             # run all tests (turbo)
pnpm --filter @nija/hashing test      # run a single package's tests
```

Tests use [Vitest](https://vitest.dev). The hashing package has the core unit test suite:

```bash
packages/hashing/src/text-hash.test.ts   # normalisation + hashing (12 tests)
```

To run the full health check (lint + typecheck + tests):

```bash
pnpm validate
```

---

## Build Phases

The platform is built incrementally to keep the MVP small and rewrite costs low.

| Phase | Goal                               | Status      |
| ----- | ---------------------------------- | ----------- |
| 0     | Repo scaffold, CI, tooling         | ✅ Complete |
| 1     | Text analysis end-to-end           | ✅ Complete |
| 2     | URL support + article extraction   | 🔜 Planned  |
| 3     | Image support (OCR + pHash)        | 🔜 Planned  |
| 4     | Moderation console                 | 🔜 Planned  |
| 5     | Audio + video pipelines            | 🔜 Planned  |
| 6     | Advanced provenance (C2PA/SynthID) | 🔜 Planned  |

### Phase 1 — Text Analysis Flow

```
share text → POST /v1/submissions
           → ingest queue
           → dedupe worker (hash match → reuse existing analysis?)
           → verdict worker
               ├── extraction (claims, entities, keywords, language)
               ├── retrieval (Phase 1: stub; Phase 2: Google/Wikipedia)
               └── verdict generation (heuristic in Phase 1; LangGraph in Phase 2+)
           → analysis stored in DB
           → GET /v1/submissions/:id returns completed status
           → GET /v1/analysis/:id returns full result
```
