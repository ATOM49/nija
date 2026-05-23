import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const contentTypeEnum = pgEnum('content_type', ['text', 'url', 'image', 'audio', 'video']);

export const submissionStatusEnum = pgEnum('submission_status', [
  'pending',
  'deduplicating',
  'processing',
  'completed',
  'failed',
]);

export const verdictEnum = pgEnum('verdict', [
  'likely_false',
  'misleading',
  'unverified',
  'likely_true',
]);

export const riskLevelEnum = pgEnum('risk_level', ['low', 'medium', 'high', 'critical']);

export const sourceTypeEnum = pgEnum('source_type', [
  'fact_check',
  'news_article',
  'government',
  'wikipedia',
  'social_media',
  'other',
]);

export const moderationDecisionEnum = pgEnum('moderation_decision', [
  'approved',
  'rejected',
  'escalated',
  'pending',
]);

export const submissions = pgTable('submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  contentType: contentTypeEnum('content_type').notNull(),
  originalInput: text('original_input').notNull(),
  normalizedHash: text('normalized_hash').notNull(),
  language: text('language'),
  status: submissionStatusEnum('status').notNull().default('pending'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const analyses = pgTable('analyses', {
  id: uuid('id').primaryKey().defaultRandom(),
  submissionId: uuid('submission_id')
    .notNull()
    .references(() => submissions.id, { onDelete: 'cascade' }),
  contentHash: text('content_hash').notNull(),
  verdict: verdictEnum('verdict').notNull(),
  confidence: real('confidence').notNull(),
  summary: text('summary').notNull(),
  riskLevel: riskLevelEnum('risk_level').notNull(),
  reasoning: text('reasoning').notNull(),
  provenanceWarnings: jsonb('provenance_warnings').$type<string[]>().notNull().default([]),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const claims = pgTable('claims', {
  id: uuid('id').primaryKey().defaultRandom(),
  analysisId: uuid('analysis_id')
    .notNull()
    .references(() => analyses.id, { onDelete: 'cascade' }),
  claimText: text('claim_text').notNull(),
  normalizedClaim: text('normalized_claim').notNull(),
  confidence: real('confidence').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const evidence = pgTable('evidence', {
  id: uuid('id').primaryKey().defaultRandom(),
  claimId: uuid('claim_id')
    .notNull()
    .references(() => claims.id, { onDelete: 'cascade' }),
  sourceUrl: text('source_url').notNull(),
  sourceType: sourceTypeEnum('source_type').notNull(),
  snippet: text('snippet').notNull(),
  relevanceScore: real('relevance_score').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const provenance = pgTable('provenance', {
  id: uuid('id').primaryKey().defaultRandom(),
  submissionId: uuid('submission_id')
    .notNull()
    .references(() => submissions.id, { onDelete: 'cascade' }),
  c2paDetected: boolean('c2pa_detected').notNull().default(false),
  synthIdDetected: boolean('synth_id_detected').notNull().default(false),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const moderationReviews = pgTable('moderation_reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  submissionId: uuid('submission_id')
    .notNull()
    .references(() => submissions.id, { onDelete: 'cascade' }),
  reviewerId: text('reviewer_id').notNull(),
  decision: moderationDecisionEnum('decision').notNull().default('pending'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const moderationRules = pgTable('moderation_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: text('type').notNull(),
  value: text('value').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const retentionPolicies = pgTable('retention_policies', {
  id: uuid('id').primaryKey().defaultRandom(),
  rawUploadDays: integer('raw_upload_days').notNull().default(7),
  transcriptDays: integer('transcript_days').notNull().default(30),
  evidenceDays: integer('evidence_days').notNull().default(90),
  verdictDays: integer('verdict_days').notNull().default(365),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  actorId: text('actor_id').notNull(),
  action: text('action').notNull(),
  resourceType: text('resource_type').notNull(),
  resourceId: text('resource_id').notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
