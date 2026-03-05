import api from "./api";

// ==================== ENUMS ====================
export type ExportRequestStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
export type DeletionRequestStatus = "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "COMPLETED";
export type ConsentType = "TERMS_OF_SERVICE" | "PRIVACY_POLICY" | "MARKETING_EMAILS" | "SMS_NOTIFICATIONS" | "DATA_PROCESSING" | "THIRD_PARTY_SHARING" | "RESEARCH_PARTICIPATION";
export type ConsentStatus = "ACCEPTED" | "DECLINED" | "REVOKED";

// ==================== EXPORT REQUEST DTOs ====================
export interface DataExportRequestDTO {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  status: ExportRequestStatus;
  requestedDate: string;
  processedDate: string | null;
  processedBy: number | null;
  processedByName: string | null;
  includeProfile: boolean;
  includeAppointments: boolean;
  includePrescriptions: boolean;
  includePayments: boolean;
  includeReviews: boolean;
  includeActivityLogs: boolean;
  exportFormat: string | null;
  filePath: string | null;
  fileSize: number | null;
  errorMessage: string | null;
  emailSent: boolean;
  emailSentDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProcessExportRequestDTO {
  includeProfile: boolean;
  includeAppointments: boolean;
  includePrescriptions: boolean;
  includePayments: boolean;
  includeReviews: boolean;
  includeActivityLogs: boolean;
  format: string;
  sendEmail: boolean;
}

export interface SendExportEmailDTO {
  email: string;
  customMessage: string;
}

export interface AutoProcessConfigDTO {
  enabled: boolean;
  processWithinHours: number;
}

export interface ExportRequestFilter {
  status?: string;
  userId?: number;
  from?: string;
  to?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: string;
}

// ==================== DELETION REQUEST DTOs ====================
export interface DataDeletionRequestDTO {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  status: DeletionRequestStatus;
  requestedDate: string;
  reason: string | null;
  reviewedBy: number | null;
  reviewedByName: string | null;
  reviewedDate: string | null;
  adminNotes: string | null;
  scheduleDate: string | null;
  executeImmediately: boolean;
  rejectionReason: string | null;
  additionalComments: string | null;
  requiredInfo: string | null;
  infoDeadline: string | null;
  cancelReason: string | null;
  cancelledDate: string | null;
  executedDate: string | null;
  executedBy: number | null;
  executedByName: string | null;
  notificationSent: boolean;
  notificationSentDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeletionReviewDetailDTO {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  status: DeletionRequestStatus;
  requestedDate: string;
  reason: string | null;
  reviewedBy: number | null;
  reviewedByName: string | null;
  reviewedDate: string | null;
  adminNotes: string | null;
  scheduleDate: string | null;
  executeImmediately: boolean;
  rejectionReason: string | null;
  additionalComments: string | null;
  totalRecords: number;
  appointmentCount: number;
  prescriptionCount: number;
  paymentCount: number;
  reviewCount: number;
  accountCreatedDate: string | null;
  lastLoginDate: string | null;
  userRole: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApproveDeletionDTO {
  scheduleDate?: string;
  executeImmediately: boolean;
  adminNotes: string;
  sendNotification: boolean;
}

export interface RejectDeletionDTO {
  rejectionReason: string;
  additionalComments?: string;
  sendNotification: boolean;
}

export interface RequestInfoDTO {
  requiredInfo: string;
  deadline?: string;
  sendNotification: boolean;
}

export interface CancelDeletionDTO {
  cancelReason: string;
  sendNotification: boolean;
}

export interface ExecuteDeletionDTO {
  confirmationPhrase: string;
  adminPassword: string;
  adminNotes: string;
}

export interface DeletionExecutionResultDTO {
  deletionRequestId: number;
  userId: number;
  userEmail: string;
  success: boolean;
  totalDeletedRecords: number;
  deletedRecordsByType: Record<string, number>;
  executionNotes: string | null;
  errorMessage: string | null;
}

export interface DeletionLogDTO {
  id: number;
  userId: number;
  userEmail: string;
  userFullName: string;
  deletionRequestId: number;
  deletedDataSummary: string;
  deletedRecordsCount: number;
  executedBy: number;
  executedByName: string;
  executedDate: string;
  executionNotes: string | null;
  success: boolean;
  errorMessage: string | null;
  createdAt: string;
}

export interface DeletionRequestFilter {
  status?: DeletionRequestStatus;
  userId?: number;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: string;
}

// ==================== CONSENT DTOs ====================
export interface ConsentStatsDTO {
  totalConsents: number;
  acceptedCount: number;
  declinedCount: number;
  revokedCount: number;
  acceptanceRate: number;
  totalUsers: number;
  usersWithFullConsent: number;
  usersWithPartialConsent: number;
  recentConsentsCount: number;
  recentRevocationsCount: number;
  consentsByType: Record<string, number>;
}

export interface TrendDataPoint {
  period: string;
  accepted: number;
  declined: number;
  revoked: number;
  total: number;
}

export interface ConsentTrendsDTO {
  dataPoints: TrendDataPoint[];
  groupBy: string;
  consentType: string | null;
  totalAccepted: number;
  totalDeclined: number;
  totalRevoked: number;
}

export interface UserConsentDTO {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  consentType: ConsentType;
  status: ConsentStatus;
  consentDate: string;
  version: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  revokedDate: string | null;
  revokedBy: number | null;
  revokedByName: string | null;
  revocationReason: string | null;
  notificationSent: boolean;
  notificationSentDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserConsentDetailDTO {
  userId: number;
  userName: string;
  userEmail: string;
  userRole: string;
  accountCreatedDate: string | null;
  lastLoginDate: string | null;
  totalConsents: number;
  activeConsents: number;
  revokedConsents: number;
  declinedConsents: number;
  consentsByType: Record<string, UserConsentDTO[]>;
  latestConsents: UserConsentDTO[];
}

export interface RevokeConsentDTO {
  revocationReason: string;
  sendNotification: boolean;
}

export interface ConsentFilter {
  userId?: number;
  consentType?: ConsentType;
  status?: ConsentStatus;
  from?: string;
  to?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: string;
}

// ==================== PAGE RESPONSE ====================
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface MessageDTO {
  message: string;
  success: boolean;
  timestamp?: string;
}

// ==================== SERVICE ====================
const gdprService = {
  // ==================== EXPORT REQUESTS ====================
  getExportRequests: async (filter: ExportRequestFilter): Promise<PageResponse<DataExportRequestDTO>> => {
    const params = new URLSearchParams();
    if (filter.status) params.append("status", filter.status);
    if (filter.userId) params.append("userId", String(filter.userId));
    if (filter.from) params.append("from", filter.from);
    if (filter.to) params.append("to", filter.to);
    params.append("pageNumber", String(filter.pageNumber ?? 0));
    params.append("pageSize", String(filter.pageSize ?? 10));
    params.append("sortBy", filter.sortBy ?? "requestedDate");
    params.append("sortDir", filter.sortDir ?? "DESC");
    const response = await api.get(`/admin/gdpr/export-requests?${params.toString()}`);
    return response.data;
  },

  processExportRequest: async (id: number, dto: ProcessExportRequestDTO): Promise<DataExportRequestDTO> => {
    const response = await api.post(`/admin/gdpr/export-requests/${id}/process`, dto);
    return response.data;
  },

  downloadExportFile: async (id: number): Promise<Blob> => {
    const response = await api.get(`/admin/gdpr/export-requests/${id}/download`, {
      responseType: "blob",
    });
    return response.data;
  },

  sendExportEmail: async (id: number, dto: SendExportEmailDTO): Promise<MessageDTO> => {
    const response = await api.post(`/admin/gdpr/export-requests/${id}/send-email`, dto);
    return response.data;
  },

  deleteExportRequest: async (id: number): Promise<MessageDTO> => {
    const response = await api.delete(`/admin/gdpr/export-requests/${id}`);
    return response.data;
  },

  getAutoProcessConfig: async (): Promise<AutoProcessConfigDTO> => {
    const response = await api.get("/admin/gdpr/export-requests/auto-process");
    return response.data;
  },

  toggleAutoProcess: async (dto: AutoProcessConfigDTO): Promise<AutoProcessConfigDTO> => {
    const response = await api.put("/admin/gdpr/export-requests/auto-process", dto);
    return response.data;
  },

  // ==================== DELETION REQUESTS ====================
  getDeletionRequests: async (filter: DeletionRequestFilter): Promise<PageResponse<DataDeletionRequestDTO>> => {
    const params = new URLSearchParams();
    if (filter.status) params.append("status", filter.status);
    if (filter.userId) params.append("userId", String(filter.userId));
    if (filter.from) params.append("from", filter.from);
    if (filter.to) params.append("to", filter.to);
    params.append("page", String(filter.page ?? 0));
    params.append("size", String(filter.size ?? 10));
    params.append("sortBy", filter.sortBy ?? "createdAt");
    params.append("sortDirection", filter.sortDirection ?? "desc");
    const response = await api.get(`/admin/gdpr/deletion-requests?${params.toString()}`);
    return response.data;
  },

  getReviewDetail: async (id: number): Promise<DeletionReviewDetailDTO> => {
    const response = await api.get(`/admin/gdpr/deletion-requests/${id}/review`);
    return response.data;
  },

  approveDeletion: async (id: number, dto: ApproveDeletionDTO): Promise<DataDeletionRequestDTO> => {
    const response = await api.post(`/admin/gdpr/deletion-requests/${id}/approve`, dto);
    return response.data;
  },

  rejectDeletion: async (id: number, dto: RejectDeletionDTO): Promise<DataDeletionRequestDTO> => {
    const response = await api.post(`/admin/gdpr/deletion-requests/${id}/reject`, dto);
    return response.data;
  },

  requestMoreInfo: async (id: number, dto: RequestInfoDTO): Promise<DataDeletionRequestDTO> => {
    const response = await api.post(`/admin/gdpr/deletion-requests/${id}/request-info`, dto);
    return response.data;
  },

  cancelDeletion: async (id: number, dto: CancelDeletionDTO): Promise<DataDeletionRequestDTO> => {
    const response = await api.post(`/admin/gdpr/deletion-requests/${id}/cancel`, dto);
    return response.data;
  },

  executeDeletion: async (id: number, dto: ExecuteDeletionDTO): Promise<DeletionExecutionResultDTO> => {
    const response = await api.post(`/admin/gdpr/deletion-requests/${id}/execute`, dto);
    return response.data;
  },

  getDeletionLog: async (page = 0, size = 10, sortBy = "executedDate", sortDirection = "desc"): Promise<PageResponse<DeletionLogDTO>> => {
    const params = new URLSearchParams();
    params.append("page", String(page));
    params.append("size", String(size));
    params.append("sortBy", sortBy);
    params.append("sortDirection", sortDirection);
    const response = await api.get(`/admin/gdpr/deletion-requests/log?${params.toString()}`);
    return response.data;
  },

  // ==================== CONSENT MANAGEMENT ====================
  getConsentStatistics: async (from?: string, to?: string): Promise<ConsentStatsDTO> => {
    const params = new URLSearchParams();
    if (from) params.append("from", from);
    if (to) params.append("to", to);
    const response = await api.get(`/admin/gdpr/consents/statistics?${params.toString()}`);
    return response.data;
  },

  getConsentRecords: async (filter: ConsentFilter): Promise<PageResponse<UserConsentDTO>> => {
    const params = new URLSearchParams();
    if (filter.userId) params.append("userId", String(filter.userId));
    if (filter.consentType) params.append("consentType", filter.consentType);
    if (filter.status) params.append("status", filter.status);
    if (filter.from) params.append("from", filter.from);
    if (filter.to) params.append("to", filter.to);
    params.append("pageNumber", String(filter.pageNumber ?? 0));
    params.append("pageSize", String(filter.pageSize ?? 10));
    params.append("sortBy", filter.sortBy ?? "consentDate");
    params.append("sortDir", filter.sortDir ?? "DESC");
    const response = await api.get(`/admin/gdpr/consents?${params.toString()}`);
    return response.data;
  },

  getUserConsentDetail: async (userId: number): Promise<UserConsentDetailDTO> => {
    const response = await api.get(`/admin/gdpr/consents/user/${userId}`);
    return response.data;
  },

  revokeConsent: async (id: number, dto: RevokeConsentDTO): Promise<UserConsentDTO> => {
    const response = await api.post(`/admin/gdpr/consents/${id}/revoke`, dto);
    return response.data;
  },

  exportConsentRecords: async (params: { userId?: number; consentType?: string; from?: string; to?: string; format?: string }): Promise<Blob> => {
    const searchParams = new URLSearchParams();
    if (params.userId) searchParams.append("userId", String(params.userId));
    if (params.consentType) searchParams.append("consentType", params.consentType);
    if (params.from) searchParams.append("from", params.from);
    if (params.to) searchParams.append("to", params.to);
    searchParams.append("format", params.format ?? "CSV");
    const response = await api.get(`/admin/gdpr/consents/export?${searchParams.toString()}`, {
      responseType: "blob",
    });
    return response.data;
  },

  getConsentTrends: async (from: string, to: string, groupBy = "MONTH", consentType?: string): Promise<ConsentTrendsDTO> => {
    const params = new URLSearchParams();
    params.append("from", from);
    params.append("to", to);
    params.append("groupBy", groupBy);
    if (consentType) params.append("consentType", consentType);
    const response = await api.get(`/admin/gdpr/consents/trends?${params.toString()}`);
    return response.data;
  },
};

export default gdprService;
