export type ContentType = 'text' | 'url' | 'image' | 'audio' | 'video';

export type SubmissionStatus = 'pending' | 'deduplicating' | 'processing' | 'completed' | 'failed';

export interface Submission {
  id: string;
  userId: string;
  contentType: ContentType;
  originalInput: string;
  normalizedHash: string;
  language: string | null;
  status: SubmissionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSubmissionInput {
  userId: string;
  contentType: ContentType;
  originalInput: string;
}
