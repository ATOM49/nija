export type ModerationDecision = 'approved' | 'rejected' | 'escalated' | 'pending';

export interface ModerationReview {
  id: string;
  submissionId: string;
  reviewerId: string;
  decision: ModerationDecision;
  notes: string | null;
  createdAt: Date;
}

export interface ModerationRule {
  id: string;
  type: 'blocked_domain' | 'trusted_domain' | 'escalation_threshold';
  value: string;
  createdAt: Date;
}
