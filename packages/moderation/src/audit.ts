export interface AuditEvent {
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, unknown>;
}

export type AuditLogger = (event: AuditEvent) => Promise<void>;

export function createNoopAuditLogger(): AuditLogger {
  return async (_event: AuditEvent) => {
    // no-op
  };
}
