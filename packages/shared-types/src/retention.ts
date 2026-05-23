export interface RetentionPolicy {
  id: string;
  rawUploadDays: number;
  transcriptDays: number;
  evidenceDays: number;
  verdictDays: number;
  updatedAt: Date;
}
