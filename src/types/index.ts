import { GlobalRole, MeetingRole, TtfuStatus, EvidenceType, ReviewStatus } from "@prisma/client";

export interface User {
  id: string;
  name: string;
  email: string;
  globalRole: GlobalRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Meeting {
  id: string;
  title: string;
  date: Date;
  notes?: string;
  createdById: string;
  createdBy: User;
  participants: MeetingParticipant[];
  ttfus: TTFU[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MeetingParticipant {
  id: string;
  meetingId: string;
  userId: string;
  role: MeetingRole;
  meeting: Meeting;
  user: User;
  createdAt: Date;
}

export interface TTFU {
  id: string;
  meetingId: string;
  title: string;
  description?: string;
  assigneeId: string;
  reviewerId: string;
  status: TtfuStatus;
  dueDate?: Date;
  meeting: Meeting;
  assignee: User;
  reviewer: User;
  evidences: Evidence[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Evidence {
  id: string;
  ttfuId: string;
  type: EvidenceType;
  url?: string;
  filePath?: string;
  description?: string;
  submittedById: string;
  ttfu: TTFU;
  submittedBy: User;
  reviews: Review[];
  createdAt: Date;
}

export interface Review {
  id: string;
  evidenceId: string;
  reviewerId: string;
  status: ReviewStatus;
  comment?: string;
  evidence: Evidence;
  reviewer: User;
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  entity: string;
  entityId: string;
  metadata?: any;
  createdAt: Date;
  user?: User;
}

// Form types
export interface CreateMeetingForm {
  title: string;
  date: string;
  notes?: string;
  participants: Array<{
    userId: string;
    role: MeetingRole;
  }>;
}

export interface CreateTTFUForm {
  title: string;
  description?: string;
  assigneeId: string;
  reviewerId: string;
  dueDate?: string;
}

export interface CreateEvidenceForm {
  type: EvidenceType;
  url?: string;
  description?: string;
}

export interface CreateReviewForm {
  status: ReviewStatus;
  comment?: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
