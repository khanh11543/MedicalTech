import api from "./api";

// ============== SECURITY AUDIT TYPES ==============

export interface SecurityEvent {
  id: number;
  userId: number | null;
  username: string;
  eventType: string;
  severity: string;
  ipAddress: string;
  userAgent: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface AuditLog {
  id: number;
  userId: number | null;
  username: string;
  action: string;
  entityType: string;
  entityId: number | null;
  oldValues: Record<string, unknown>;
  newValues: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

export interface UserActivity {
  userId: number;
  username: string;
  fullName: string;
  activityCount: number;
  lastActivity: string;
}

export interface SecurityAuditDashboard {
  totalSecurityEvents: number;
  failedLoginAttempts: number;
  accountLockouts: number;
  passwordChanges: number;
  suspiciousActivities: number;
  totalAuditLogs: number;
  todayAuditLogs: number;
  weekAuditLogs: number;
  recentSecurityEvents: SecurityEvent[];
  recentAuditLogs: AuditLog[];
  highSeverityEvents: SecurityEvent[];
  topActiveUsers: UserActivity[];
  generatedAt: string;
}

// ============== REPORTS ANALYTICS TYPES ==============

export interface DailyAppointment {
  date: string;
  count: number;
}

export interface DailyRevenue {
  date: string;
  revenue: number;
}

export interface MonthlyUserGrowth {
  month: string;
  newUsers: number;
  totalUsers: number;
}

export interface TopDoctor {
  doctorId: number;
  name: string;
  specialty: string;
  appointmentCount: number;
  averageRating: number;
}

export interface SpecialtyStats {
  specialtyId: number;
  specialtyName: string;
  doctorCount: number;
  appointmentCount: number;
  totalRevenue: number;
}

export interface ReportsAnalytics {
  totalUsers: number;
  totalAppointments: number;
  totalPayments: number;
  totalRevenue: number;
  appointmentsByStatus: Record<string, number>;
  appointmentsBySpecialty: Record<string, number>;
  appointmentTrend: DailyAppointment[];
  revenueByPaymentMethod: Record<string, number>;
  paymentsByStatus: Record<string, number>;
  revenueTrend: DailyRevenue[];
  usersByRole: Record<string, number>;
  userGrowthTrend: MonthlyUserGrowth[];
  topDoctorsByAppointments: TopDoctor[];
  topDoctorsByRating: TopDoctor[];
  specialtyStatistics: SpecialtyStats[];
  generatedAt: string;
}

// ============== GDPR COMPLIANCE TYPES ==============

export interface DataRequest {
  id: number;
  userId: number;
  username: string;
  userEmail: string;
  requestType: string;
  status: string;
  requestReason: string;
  adminNotes: string | null;
  processedBy: number | null;
  processedByName: string | null;
  processedAt: string | null;
  dataFilePath: string | null;
  ipAddress: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserConsent {
  id: number;
  userId: number;
  username: string;
  consentType: string;
  consentGiven: boolean;
  consentText: string;
  ipAddress: string;
  grantedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DataProcessingActivity {
  id: number;
  activityName: string;
  purpose: string;
  legalBasis: string;
  dataCategories: string;
  dataSubjects: string;
  recipients: string;
  transferCountries: string | null;
  retentionPeriod: string;
  securityMeasures: string;
  dpoNotes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GDPRComplianceDashboard {
  totalDataRequests: number;
  pendingRequests: number;
  completedRequests: number;
  overdueRequests: number;
  totalConsents: number;
  activeConsents: number;
  revokedConsents: number;
  totalProcessingActivities: number;
  activeProcessingActivities: number;
  recentDataRequests: DataRequest[];
  recentConsents: UserConsent[];
  exportRequests: number;
  deletionRequests: number;
  rectificationRequests: number;
  processingActivities: DataProcessingActivity[];
  generatedAt: string;
}

// ============== SECURITY AUDIT API ==============

export const securityAuditAPI = {
  getDashboard: () =>
    api.get<SecurityAuditDashboard>("/admin/security-audit/dashboard"),

  getAllSecurityEvents: () =>
    api.get<SecurityEvent[]>("/admin/security-audit/events"),

  getSecurityEventsByUser: (userId: number) =>
    api.get<SecurityEvent[]>(`/admin/security-audit/events/user/${userId}`),

  getAllAuditLogs: () =>
    api.get<AuditLog[]>("/admin/security-audit/audit-logs"),

  getAuditLogsByUser: (userId: number) =>
    api.get<AuditLog[]>(`/admin/security-audit/audit-logs/user/${userId}`),

  getAuditLogsByEntity: (entityType: string, entityId: number) =>
    api.get<AuditLog[]>("/admin/security-audit/audit-logs/entity", {
      params: { entityType, entityId },
    }),
};

// ============== REPORTS ANALYTICS API ==============

export const reportsAnalyticsAPI = {
  getAnalytics: () =>
    api.get<ReportsAnalytics>("/admin/reports-analytics"),

  getDashboard: () =>
    api.get<ReportsAnalytics>("/admin/reports-analytics/dashboard"),
};

// ============== GDPR COMPLIANCE API ==============

export const gdprComplianceAPI = {
  getDashboard: () =>
    api.get<GDPRComplianceDashboard>("/admin/gdpr-compliance/dashboard"),

  getAllDataRequests: () =>
    api.get<DataRequest[]>("/admin/gdpr-compliance/data-requests"),

  getDataRequestById: (id: number) =>
    api.get<DataRequest>(`/admin/gdpr-compliance/data-requests/${id}`),

  updateDataRequestStatus: (
    id: number,
    status: string,
    adminNotes: string,
    processedById: number | null
  ) =>
    api.put<DataRequest>(`/admin/gdpr-compliance/data-requests/${id}/status`, {
      status,
      adminNotes,
      processedById,
    }),

  getAllUserConsents: () =>
    api.get<UserConsent[]>("/admin/gdpr-compliance/consents"),

  getUserConsentsByUserId: (userId: number) =>
    api.get<UserConsent[]>(`/admin/gdpr-compliance/consents/user/${userId}`),

  getAllProcessingActivities: () =>
    api.get<DataProcessingActivity[]>("/admin/gdpr-compliance/processing-activities"),

  getActiveProcessingActivities: () =>
    api.get<DataProcessingActivity[]>("/admin/gdpr-compliance/processing-activities/active"),

  createProcessingActivity: (data: Partial<DataProcessingActivity>) =>
    api.post<DataProcessingActivity>("/admin/gdpr-compliance/processing-activities", data),

  updateProcessingActivity: (id: number, data: Partial<DataProcessingActivity>) =>
    api.put<DataProcessingActivity>(`/admin/gdpr-compliance/processing-activities/${id}`, data),
};

export default {
  securityAuditAPI,
  reportsAnalyticsAPI,
  gdprComplianceAPI,
};
