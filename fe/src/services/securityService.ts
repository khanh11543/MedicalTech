import api from "./api";

// ==================== ENUMS ====================

export type SecurityEventType =
  | "FAILED_LOGIN"
  | "ACCOUNT_LOCKOUT"
  | "SUSPICIOUS_LOGIN_LOCATION"
  | "MULTIPLE_FAILED_2FA"
  | "PASSWORD_BRUTE_FORCE"
  | "SQL_INJECTION_ATTEMPT"
  | "XSS_ATTEMPT"
  | "UNUSUAL_DATA_ACCESS"
  | "RAPID_API_CALLS"
  | "FILE_UPLOAD_VIOLATION"
  | "PASSWORD_CHANGED"
  | "TWO_FA_ENABLED"
  | "TWO_FA_DISABLED"
  | "ROLE_CHANGED"
  | "ACCOUNT_UNLOCKED";

export type SecuritySeverity = "HIGH" | "MEDIUM" | "LOW";
export type SecurityEventStatus = "NEW" | "REVIEWED" | "RESOLVED";
export type BlockType = "TEMPORARY" | "PERMANENT";
export type BlockScope = "ENTIRE_SYSTEM" | "ADMIN_PANEL_ONLY" | "API_ONLY";
export type IpStatus = "BLOCKED" | "WHITELISTED" | "FLAGGED";
export type ActivityType =
  | "LOGIN"
  | "LOGOUT"
  | "PASSWORD_CHANGE"
  | "PROFILE_UPDATE"
  | "CREATED_USER"
  | "UPDATED_USER"
  | "DISABLED_USER"
  | "ASSIGNED_ROLE"
  | "RESET_PASSWORD"
  | "CREATED_APPOINTMENT"
  | "CONFIRMED_APPOINTMENT"
  | "CHECKED_IN_PATIENT"
  | "CANCELLED_APPOINTMENT"
  | "RESCHEDULED_APPOINTMENT"
  | "CREATED_SCHEDULE"
  | "UPDATED_SCHEDULE"
  | "DELETED_SCHEDULE"
  | "ADDED_SCHEDULE_EXCEPTION"
  | "DELETED_SCHEDULE_EXCEPTION"
  | "GENERATED_TIME_SLOTS"
  | "CREATED_TIME_SLOT"
  | "UPDATED_TIME_SLOT"
  | "DELETED_TIME_SLOT"
  | "BLOCKED_TIME_SLOT"
  | "UNBLOCKED_TIME_SLOT"
  | "BULK_CREATED_TIME_SLOTS"
  | "BULK_BLOCKED_TIME_SLOTS"
  | "BULK_UNBLOCKED_TIME_SLOTS"
  | "ROLLED_BACK_TIME_SLOTS"
  | "CREATED_PRESCRIPTION"
  | "APPLIED_TEMPLATE"
  | "PROCESSED_PAYMENT"
  | "ISSUED_REFUND"
  | "CHANGED_SETTINGS"
  | "CREATED_BACKUP"
  | "ENABLED_MAINTENANCE"
  | "UPDATED_PAGE"
  | "ADDED_SPECIALIZATION"
  | "MODIFIED_TEMPLATE";

export type AuditActionType =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "LOGIN"
  | "LOGOUT"
  | "SENSITIVE_ACCESS";

export type AuditEntityType =
  | "USER"
  | "APPOINTMENT"
  | "PRESCRIPTION"
  | "PAYMENT"
  | "INVOICE"
  | "DOCTOR"
  | "SPECIALTY"
  | "REVIEW"
  | "NOTIFICATION"
  | "SYSTEM_SETTING"
  | "BACKUP"
  | "REFUND"
  | "SCHEDULE"
  | "TIME_SLOT"
  | "MEDICAL_RECORD"
  | "CONSENT"
  | "SESSION"
  | "IP_RULE"
  | "INVESTIGATION";

// ==================== DTOs ====================

export interface UserSummaryDTO {
  id: number;
  fullName: string;
  email: string;
  avatarUrl: string | null;
}

export interface SecurityEventDTO {
  id: number;
  user: UserSummaryDTO | null;
  eventType: SecurityEventType;
  severity: SecuritySeverity;
  status: SecurityEventStatus;
  ipAddress: string;
  userAgent: string | null;
  description: string;
  requestUrl: string | null;
  requestMethod: string | null;
  requestHeaders: Record<string, string> | null;
  geoCountry: string | null;
  geoCity: string | null;
  isp: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: UserSummaryDTO | null;
}

export interface SecurityEventStatsDTO {
  totalEvents: number;
  highSeverityCount: number;
  mediumSeverityCount: number;
  lowSeverityCount: number;
  newCount: number;
  reviewedCount: number;
  resolvedCount: number;
  byEventType: { eventType: string; count: number }[];
  bySeverity: { severity: string; count: number }[];
  byDate: { date: string; count: number }[];
}

export interface SecurityDashboardDTO {
  totalSecurityEvents: number;
  highSeverityEvents: number;
  unresolvedEvents: number;
  activeBlockedIps: number;
  totalIpRules: number;
  totalAuditLogs: number;
  sensitiveAccessCount: number;
  totalActivities: number;
  activeSessions: number;
  idleSessions: number;
  failedLoginAttempts: number;
  openInvestigations: number;
  overdueInvestigations: number;
  periodLabel: string;
}

export interface BlockedIpDTO {
  id: number;
  ipAddress: string;
  reason: string;
  blockedBy: UserSummaryDTO | null;
  blockType: BlockType;
  blockScope: BlockScope;
  geoCountry: string | null;
  geoCity: string | null;
  eventCount: number;
  isAutoBlocked: boolean;
  isActive: boolean;
  expiresAt: string | null;
  blockedAt: string;
  unblockedAt: string | null;
}

export interface IpManagementStatsDTO {
  totalBlockedIps: number;
  activeBlockedIps: number;
  autoBlockedCount: number;
  manuallyBlockedCount: number;
  temporaryBlocksCount: number;
  permanentBlocksCount: number;
  totalIpRules: number;
  blockedRulesCount: number;
  whitelistedCount: number;
  flaggedCount: number;
}

// ==================== IP Rule DTOs ====================

export interface IpRuleDTO {
  id: number;
  ipAddress: string;
  ruleType: string;
  status: IpStatus;
  scope: BlockScope;
  reason: string | null;
  description: string | null;
  isActive: boolean;
  createdBy: UserSummaryDTO | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIpRuleDTO {
  ipAddress: string;
  ruleType: string;
  status: IpStatus;
  scope?: BlockScope;
  reason?: string;
  description?: string;
}

export interface UpdateIpRuleDTO {
  status?: IpStatus;
  scope?: BlockScope;
  reason?: string;
  description?: string;
  isActive?: boolean;
}

// ==================== Audit Log DTOs ====================

export interface AuditLogDTO {
  id: number;
  user: UserSummaryDTO | null;
  action: string;
  actionType: AuditActionType;
  entityType: string;
  entityId: number | null;
  ipAddress: string | null;
  requestUrl: string | null;
  requestMethod: string | null;
  geoCountry: string | null;
  geoCity: string | null;
  createdAt: string;
}

export interface FieldChangeDTO {
  fieldName: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface AuditLogDetailDTO {
  id: number;
  user: UserSummaryDTO | null;
  action: string;
  actionType: AuditActionType;
  entityType: string;
  entityId: number | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  changes: FieldChangeDTO[];
  ipAddress: string | null;
  userAgent: string | null;
  requestUrl: string | null;
  requestMethod: string | null;
  geoCountry: string | null;
  geoCity: string | null;
  createdAt: string;
  previousId: number | null;
  nextId: number | null;
  relatedLogs: AuditLogDTO[];
}

export interface ActionTypeCountDTO {
  actionType: string;
  count: number;
}

export interface EntityTypeCountDTO {
  entityType: string;
  count: number;
}

export interface DateCountDTO {
  date: string;
  count: number;
}

export interface HeatmapEntryDTO {
  dayOfWeek: number;
  hour: number;
  count: number;
}

export interface ActiveUserDTO {
  userId: number;
  fullName: string;
  actionCount: number;
}

export interface AuditLogStatsDTO {
  totalLogs: number;
  sensitiveAccessCount: number;
  deleteCount: number;
  byActionType: ActionTypeCountDTO[];
  byEntityType: EntityTypeCountDTO[];
  byDate: DateCountDTO[];
  heatmap: HeatmapEntryDTO[];
  mostActiveUsers: ActiveUserDTO[];
}

export interface AuditLogFilter {
  search?: string;
  actionTypes?: AuditActionType[];
  entityTypes?: string[];
  userId?: number;
  entityId?: number;
  ipAddress?: string;
  from?: string;
  to?: string;
  sortBy?: string;
  sortDir?: string;
  pageNumber?: number;
  pageSize?: number;
}

// ==================== 10.4 Activity Log DTOs ====================

export interface ActivityLogDTO {
  id: number;
  user: UserSummaryDTO;
  activityType: ActivityType;
  description: string;
  resourceType?: string;
  resourceId?: number;
  ipAddress?: string;
  userAgent?: string;
  geoCountry?: string;
  geoCity?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ActivityTypeCountDTO {
  activityType: string;
  count: number;
}

export interface ActivityLogStatsDTO {
  totalActivities: number;
  byActivityType: ActivityTypeCountDTO[];
  byDate: DateCountDTO[];
  mostActiveUsers: ActiveUserDTO[];
}

export interface ActivityLogFilter {
  search?: string;
  activityTypes?: ActivityType[];
  userId?: number;
  roleName?: string;
  ipAddress?: string;
  resourceType?: string;
  resourceId?: number;
  from?: string;
  to?: string;
  sortBy?: string;
  sortDir?: string;
  pageNumber?: number;
  pageSize?: number;
}

// ==================== 10.5 Session Management Types ====================

export type SessionStatus = "ACTIVE" | "IDLE" | "EXPIRED" | "REVOKED";

export interface UserSessionDTO {
  id: number;
  user: UserSummaryDTO;
  status: SessionStatus;
  deviceId?: string;
  deviceName?: string;
  deviceType?: string;
  browserName?: string;
  browserVersion?: string;
  osName?: string;
  ipAddress?: string;
  geoCountry?: string;
  geoCity?: string;
  requestCount: number;
  lastActivityDescription?: string;
  createdAt: string;
  lastSeenAt?: string;
  expiresAt: string;
  revokedAt?: string;
  revokeReason?: string;
}

export interface SessionFilter {
  search?: string;
  status?: SessionStatus;
  userId?: number;
  ipAddress?: string;
  deviceType?: string;
  browserName?: string;
  from?: string;
  to?: string;
  sortBy?: string;
  sortDir?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface ForceLogoutDTO {
  sessionIds?: number[];
  userId?: number;
  ipAddress?: string;
  reason: string;
  excludeSessionId?: number;
}

export interface DeviceCountDTO {
  deviceType: string;
  count: number;
}
export interface BrowserCountDTO {
  browserName: string;
  count: number;
}
export interface CountryCountDTO {
  country: string;
  count: number;
}
export interface SessionDateCountDTO {
  date: string;
  count: number;
}

export interface SessionStatsDTO {
  totalActiveSessions: number;
  idleSessions: number;
  revokedToday: number;
  byDeviceType: DeviceCountDTO[];
  byBrowser: BrowserCountDTO[];
  byCountry: CountryCountDTO[];
  sessionsByDate: SessionDateCountDTO[];
}

export interface LoginAttemptDTO {
  id: number;
  user?: UserSummaryDTO;
  email: string;
  ipAddress: string;
  userAgent?: string;
  success: boolean;
  failureReason?: string;
  attemptedAt: string;
}

export interface LoginAttemptDateCountDTO {
  date: string;
  successCount: number;
  failedCount: number;
}
export interface HourCountDTO {
  hour: number;
  count: number;
}
export interface IpCountDTO {
  ipAddress: string;
  failedCount: number;
}
export interface LoginCountryCountDTO {
  country: string;
  count: number;
}

export interface LoginAttemptStatsDTO {
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  uniqueIpsWithFailures: number;
  byDate: LoginAttemptDateCountDTO[];
  failedByHour: HourCountDTO[];
  topFailedIps: IpCountDTO[];
  byCountry: LoginCountryCountDTO[];
}

// ==================== 10.6 Investigation Types ====================

export type InvestigationStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type InvestigationType = "SECURITY_BREACH" | "FRAUD_ATTEMPT" | "DATA_LEAK" | "POLICY_VIOLATION" | "OTHER";
export type EvidenceType = "SECURITY_EVENT" | "AUDIT_LOG" | "ACTIVITY_LOG" | "FILE";

export interface InvestigationSummaryDTO {
  id: number;
  title: string;
  severity: SecuritySeverity;
  type: InvestigationType;
  status: InvestigationStatus;
  assignedTo?: UserSummaryDTO;
  createdBy: UserSummaryDTO;
  dueDate?: string;
  notesCount: number;
  evidenceCount: number;
  relatedUsersCount: number;
  overdue: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InvestigationNoteDTO {
  id: number;
  investigationId: number;
  author: UserSummaryDTO;
  content: string;
  createdAt: string;
}

export interface InvestigationEvidenceDTO {
  id: number;
  investigationId: number;
  evidenceType: EvidenceType;
  referenceId?: number;
  referenceType?: string;
  description?: string;
  filePath?: string;
  addedBy: UserSummaryDTO;
  createdAt: string;
}

export interface InvestigationTimelineDTO {
  type: string;
  description: string;
  actor: UserSummaryDTO;
  data?: unknown;
  timestamp: string;
}

export interface InvestigationDTO {
  id: number;
  title: string;
  description?: string;
  severity: SecuritySeverity;
  type: InvestigationType;
  status: InvestigationStatus;
  assignedTo?: UserSummaryDTO;
  createdBy: UserSummaryDTO;
  dueDate?: string;
  resolutionSummary?: string;
  preventiveMeasures?: string;
  relatedUsers: UserSummaryDTO[];
  relatedIps: string[];
  relatedEventIds: number[];
  notes: InvestigationNoteDTO[];
  evidence: InvestigationEvidenceDTO[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface CreateInvestigationDTO {
  title: string;
  description?: string;
  severity: SecuritySeverity;
  type: InvestigationType;
  assignedToId?: number;
  dueDate?: string;
  relatedUserIds?: number[];
  relatedIps?: string[];
  relatedEventIds?: number[];
}

export interface UpdateInvestigationDTO {
  title?: string;
  description?: string;
  severity?: SecuritySeverity;
  type?: InvestigationType;
  status?: InvestigationStatus;
  assignedToId?: number;
  dueDate?: string;
  resolutionSummary?: string;
  preventiveMeasures?: string;
  relatedUserIds?: number[];
  relatedIps?: string[];
  relatedEventIds?: number[];
}

export interface AddInvestigationNoteDTO {
  content: string;
}

export interface AddInvestigationEvidenceDTO {
  evidenceType: EvidenceType;
  referenceId?: number;
  referenceType?: string;
  description?: string;
  filePath?: string;
}

export interface InvestigationTypeCountDTO {
  type: InvestigationType;
  count: number;
}
export interface InvestigationSeverityCountDTO {
  severity: SecuritySeverity;
  count: number;
}
export interface InvestigationAssigneeCountDTO {
  userId: number;
  fullName: string;
  count: number;
}

export interface InvestigationStatsDTO {
  totalInvestigations: number;
  openCount: number;
  inProgressCount: number;
  resolvedCount: number;
  closedCount: number;
  overdueCount: number;
  byType: InvestigationTypeCountDTO[];
  bySeverity: InvestigationSeverityCountDTO[];
  byAssignee: InvestigationAssigneeCountDTO[];
  avgResolutionDays: number;
  resolvedThisMonth: number;
}

export interface InvestigationFilter {
  search?: string;
  statuses?: InvestigationStatus[];
  types?: InvestigationType[];
  severities?: SecuritySeverity[];
  assignedToId?: number;
  createdById?: number;
  overdue?: boolean;
  from?: string;
  to?: string;
  sortBy?: string;
  sortDir?: string;
  pageNumber?: number;
  pageSize?: number;
}

// ==================== Filter Types ====================

export interface SecurityEventFilter {
  search?: string;
  eventTypes?: SecurityEventType[];
  severities?: SecuritySeverity[];
  status?: SecurityEventStatus;
  userId?: number;
  ipAddress?: string;
  geoCountry?: string;
  from?: string;
  to?: string;
  sortBy?: string;
  sortDir?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface BlockedIpFilter {
  search?: string;
  blockType?: BlockType;
  blockScope?: BlockScope;
  isAutoBlocked?: boolean;
  isActive?: boolean;
  from?: string;
  to?: string;
  sortBy?: string;
  sortDir?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface IpRuleFilter {
  search?: string;
  status?: IpStatus;
  ruleType?: string;
  isActive?: boolean;
  sortBy?: string;
  sortDir?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface BlockIpRequest {
  ipAddress: string;
  reason: string;
  blockType: BlockType;
  blockScope?: BlockScope;
  expiresAt?: string;
}

// ==================== Page Response ====================

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

// ==================== API Functions ====================

// --- Dashboard ---
export const getSecurityDashboard = async (
  period: string = "24h"
): Promise<SecurityDashboardDTO> => {
  const response = await api.get("/admin/security/dashboard", {
    params: { period },
  });
  return response.data;
};

// --- Security Events ---
export const getSecurityEvents = async (
  filter: SecurityEventFilter
): Promise<PageResponse<SecurityEventDTO>> => {
  const params: Record<string, unknown> = {};
  if (filter.search) params.search = filter.search;
  if (filter.eventTypes?.length) params.eventTypes = filter.eventTypes.join(",");
  if (filter.severities?.length) params.severities = filter.severities.join(",");
  if (filter.status) params.status = filter.status;
  if (filter.userId) params.userId = filter.userId;
  if (filter.ipAddress) params.ipAddress = filter.ipAddress;
  if (filter.geoCountry) params.geoCountry = filter.geoCountry;
  if (filter.from) params.from = filter.from;
  if (filter.to) params.to = filter.to;
  params.sortBy = filter.sortBy || "createdAt";
  params.sortDir = filter.sortDir || "DESC";
  params.pageNumber = filter.pageNumber ?? 0;
  params.pageSize = filter.pageSize ?? 20;

  const response = await api.get("/admin/security/events", { params });
  return response.data;
};

export const getSecurityEventById = async (
  id: number
): Promise<SecurityEventDTO> => {
  const response = await api.get(`/admin/security/events/${id}`);
  return response.data;
};

export const reviewSecurityEvent = async (
  id: number
): Promise<SecurityEventDTO> => {
  const response = await api.patch(`/admin/security/events/${id}/review`);
  return response.data;
};

export const resolveSecurityEvent = async (
  id: number,
  resolutionNote?: string
): Promise<SecurityEventDTO> => {
  const response = await api.patch(`/admin/security/events/${id}/resolve`, null, {
    params: { resolutionNote },
  });
  return response.data;
};

export const getSecurityEventStats = async (
  period: string = "24h"
): Promise<SecurityEventStatsDTO> => {
  const response = await api.get("/admin/security/events/stats", {
    params: { period },
  });
  return response.data;
};

// --- IP Management ---
export const getBlockedIps = async (
  filter: BlockedIpFilter
): Promise<PageResponse<BlockedIpDTO>> => {
  const response = await api.get("/admin/security/ip/blocked", {
    params: filter,
  });
  return response.data;
};

export const blockIp = async (
  data: BlockIpRequest
): Promise<BlockedIpDTO> => {
  const response = await api.post("/admin/security/ip/blocked", data);
  return response.data;
};

export const unblockIp = async (id: number): Promise<BlockedIpDTO> => {
  const response = await api.patch(`/admin/security/ip/blocked/${id}/unblock`);
  return response.data;
};

export const checkIpBlocked = async (
  ipAddress: string
): Promise<boolean> => {
  const response = await api.get("/admin/security/ip/check", {
    params: { ipAddress },
  });
  return response.data;
};

export const getIpManagementStats = async (): Promise<IpManagementStatsDTO> => {
  const response = await api.get("/admin/security/ip/stats");
  return response.data;
};

// --- IP Rules ---
export const getIpRules = async (
  filter: IpRuleFilter
): Promise<PageResponse<IpRuleDTO>> => {
  const params: Record<string, unknown> = {};
  if (filter.search) params.search = filter.search;
  if (filter.status) params.status = filter.status;
  if (filter.ruleType) params.ruleType = filter.ruleType;
  if (filter.isActive !== undefined) params.isActive = filter.isActive;
  params.sortBy = filter.sortBy || "createdAt";
  params.sortDir = filter.sortDir || "DESC";
  params.pageNumber = filter.pageNumber ?? 0;
  params.pageSize = filter.pageSize ?? 20;
  const response = await api.get("/admin/security/ip/rules", { params });
  return response.data;
};

export const getIpRuleById = async (id: number): Promise<IpRuleDTO> => {
  const response = await api.get(`/admin/security/ip/rules/${id}`);
  return response.data;
};

export const createIpRule = async (
  data: CreateIpRuleDTO
): Promise<IpRuleDTO> => {
  const response = await api.post("/admin/security/ip/rules", data);
  return response.data;
};

export const updateIpRule = async (
  id: number,
  data: UpdateIpRuleDTO
): Promise<IpRuleDTO> => {
  const response = await api.put(`/admin/security/ip/rules/${id}`, data);
  return response.data;
};

export const deleteIpRule = async (id: number): Promise<void> => {
  await api.delete(`/admin/security/ip/rules/${id}`);
};

// --- Export ---
export const exportSecurityEvents = async (
  format: "csv" | "excel" | "pdf",
  filter?: SecurityEventFilter
): Promise<Blob> => {
  const params: Record<string, unknown> = {};
  if (filter?.search) params.search = filter.search;
  if (filter?.eventTypes?.length) params.eventTypes = filter.eventTypes.join(",");
  if (filter?.severities?.length) params.severities = filter.severities.join(",");
  if (filter?.status) params.status = filter.status;
  if (filter?.from) params.from = filter.from;
  if (filter?.to) params.to = filter.to;

  const response = await api.get(
    `/admin/security/export/security-events/${format}`,
    { params, responseType: "blob" }
  );
  return response.data;
};

// --- Audit Logs ---
export const getAuditLogs = async (
  filter: AuditLogFilter
): Promise<PageResponse<AuditLogDTO>> => {
  const params: Record<string, unknown> = {};
  if (filter.search) params.search = filter.search;
  if (filter.actionTypes?.length) params.actionTypes = filter.actionTypes.join(",");
  if (filter.entityTypes?.length) params.entityTypes = filter.entityTypes.join(",");
  if (filter.userId) params.userId = filter.userId;
  if (filter.entityId) params.entityId = filter.entityId;
  if (filter.ipAddress) params.ipAddress = filter.ipAddress;
  if (filter.from) params.from = filter.from;
  if (filter.to) params.to = filter.to;
  params.sortBy = filter.sortBy || "createdAt";
  params.sortDir = filter.sortDir || "DESC";
  params.pageNumber = filter.pageNumber ?? 0;
  params.pageSize = filter.pageSize ?? 20;
  const response = await api.get("/admin/security/audit-logs", { params });
  return response.data;
};

export const getAuditLogDetail = async (
  id: number
): Promise<AuditLogDetailDTO> => {
  const response = await api.get(`/admin/security/audit-logs/${id}`);
  return response.data;
};

export const getAuditLogStats = async (
  period: string = "24h"
): Promise<AuditLogStatsDTO> => {
  const response = await api.get("/admin/security/audit-logs/stats", {
    params: { period },
  });
  return response.data;
};

// ==================== 10.4 Activity Log API ====================

export const getActivityLogs = async (
  filter: ActivityLogFilter
): Promise<PageResponse<ActivityLogDTO>> => {
  const params: Record<string, unknown> = {};
  if (filter.search) params.search = filter.search;
  if (filter.activityTypes?.length) params.activityTypes = filter.activityTypes.join(",");
  if (filter.userId) params.userId = filter.userId;
  if (filter.roleName) params.roleName = filter.roleName;
  if (filter.ipAddress) params.ipAddress = filter.ipAddress;
  if (filter.resourceType) params.resourceType = filter.resourceType;
  if (filter.resourceId) params.resourceId = filter.resourceId;
  if (filter.from) params.from = filter.from;
  if (filter.to) params.to = filter.to;
  params.sortBy = filter.sortBy || "createdAt";
  params.sortDir = filter.sortDir || "DESC";
  params.pageNumber = filter.pageNumber ?? 0;
  params.pageSize = filter.pageSize ?? 20;
  const response = await api.get("/admin/security/activity-logs", { params });
  return response.data;
};

export const getActivityLogById = async (
  id: number
): Promise<ActivityLogDTO> => {
  const response = await api.get(`/admin/security/activity-logs/${id}`);
  return response.data;
};

export const getActivityLogStats = async (
  period: string = "7d"
): Promise<ActivityLogStatsDTO> => {
  const response = await api.get("/admin/security/activity-logs/stats", {
    params: { period },
  });
  return response.data;
};

export const exportActivityLogs = async (
  format: "csv" | "excel" | "pdf",
  filter?: ActivityLogFilter
): Promise<Blob> => {
  const params: Record<string, unknown> = {};
  if (filter?.search) params.search = filter.search;
  if (filter?.activityTypes?.length) params.activityTypes = filter.activityTypes.join(",");
  if (filter?.userId) params.userId = filter.userId;
  if (filter?.resourceType) params.resourceType = filter.resourceType;
  if (filter?.from) params.from = filter.from;
  if (filter?.to) params.to = filter.to;
  const response = await api.get(
    `/admin/security/export/activity-logs/${format}`,
    { params, responseType: "blob" }
  );
  return response.data;
};

// --- Session Management (10.5) ---

export const getSessions = async (
  filter: SessionFilter
): Promise<PageResponse<UserSessionDTO>> => {
  const params: Record<string, unknown> = {};
  if (filter.search) params.search = filter.search;
  if (filter.status) params.status = filter.status;
  if (filter.userId) params.userId = filter.userId;
  if (filter.ipAddress) params.ipAddress = filter.ipAddress;
  if (filter.deviceType) params.deviceType = filter.deviceType;
  if (filter.browserName) params.browserName = filter.browserName;
  if (filter.from) params.from = filter.from;
  if (filter.to) params.to = filter.to;
  params.sortBy = filter.sortBy || "lastSeenAt";
  params.sortDir = filter.sortDir || "DESC";
  params.pageNumber = filter.pageNumber ?? 0;
  params.pageSize = filter.pageSize ?? 20;
  const response = await api.get("/admin/security/sessions", { params });
  return response.data;
};

export const getSessionById = async (id: number): Promise<UserSessionDTO> => {
  const response = await api.get(`/admin/security/sessions/${id}`);
  return response.data;
};

export const forceLogout = async (dto: ForceLogoutDTO): Promise<{ message: string }> => {
  const response = await api.post("/admin/security/sessions/force-logout", dto);
  return response.data;
};

export const getSessionStats = async (): Promise<SessionStatsDTO> => {
  const response = await api.get("/admin/security/sessions/stats");
  return response.data;
};

export const getLoginAttempts = async (
  userId?: number,
  page = 0,
  size = 20
): Promise<PageResponse<LoginAttemptDTO>> => {
  const params: Record<string, unknown> = { page, size };
  if (userId) params.userId = userId;
  const response = await api.get("/admin/security/sessions/login-attempts", { params });
  return response.data;
};

export const getLoginAttemptStats = async (
  period = "24h"
): Promise<LoginAttemptStatsDTO> => {
  const response = await api.get("/admin/security/sessions/login-attempts/stats", {
    params: { period },
  });
  return response.data;
};

// --- Investigations (10.6) ---

export const getInvestigations = async (
  filter: InvestigationFilter
): Promise<PageResponse<InvestigationSummaryDTO>> => {
  const params: Record<string, unknown> = {};
  if (filter.search) params.search = filter.search;
  if (filter.statuses?.length) params.statuses = filter.statuses.join(",");
  if (filter.types?.length) params.types = filter.types.join(",");
  if (filter.severities?.length) params.severities = filter.severities.join(",");
  if (filter.assignedToId) params.assignedToId = filter.assignedToId;
  if (filter.createdById) params.createdById = filter.createdById;
  if (filter.overdue !== undefined) params.overdue = filter.overdue;
  if (filter.from) params.from = filter.from;
  if (filter.to) params.to = filter.to;
  params.sortBy = filter.sortBy || "createdAt";
  params.sortDir = filter.sortDir || "DESC";
  params.pageNumber = filter.pageNumber ?? 0;
  params.pageSize = filter.pageSize ?? 20;
  const response = await api.get("/admin/security/investigations", { params });
  return response.data;
};

export const getInvestigationById = async (id: number): Promise<InvestigationDTO> => {
  const response = await api.get(`/admin/security/investigations/${id}`);
  return response.data;
};

export const createInvestigation = async (
  dto: CreateInvestigationDTO
): Promise<InvestigationDTO> => {
  const response = await api.post("/admin/security/investigations", dto);
  return response.data;
};

export const updateInvestigation = async (
  id: number,
  dto: UpdateInvestigationDTO
): Promise<InvestigationDTO> => {
  const response = await api.put(`/admin/security/investigations/${id}`, dto);
  return response.data;
};

export const deleteInvestigation = async (id: number): Promise<{ message: string }> => {
  const response = await api.delete(`/admin/security/investigations/${id}`);
  return response.data;
};

export const addInvestigationNote = async (
  investigationId: number,
  dto: AddInvestigationNoteDTO
): Promise<InvestigationNoteDTO> => {
  const response = await api.post(
    `/admin/security/investigations/${investigationId}/notes`,
    dto
  );
  return response.data;
};

export const getInvestigationNotes = async (
  investigationId: number
): Promise<InvestigationNoteDTO[]> => {
  const response = await api.get(
    `/admin/security/investigations/${investigationId}/notes`
  );
  return response.data;
};

export const addInvestigationEvidence = async (
  investigationId: number,
  dto: AddInvestigationEvidenceDTO
): Promise<InvestigationEvidenceDTO> => {
  const response = await api.post(
    `/admin/security/investigations/${investigationId}/evidence`,
    dto
  );
  return response.data;
};

export const getInvestigationEvidence = async (
  investigationId: number
): Promise<InvestigationEvidenceDTO[]> => {
  const response = await api.get(
    `/admin/security/investigations/${investigationId}/evidence`
  );
  return response.data;
};

export const getInvestigationTimeline = async (
  investigationId: number
): Promise<InvestigationTimelineDTO[]> => {
  const response = await api.get(
    `/admin/security/investigations/${investigationId}/timeline`
  );
  return response.data;
};

export const getInvestigationStats = async (): Promise<InvestigationStatsDTO> => {
  const response = await api.get("/admin/security/investigations/stats");
  return response.data;
};

export const exportAuditLogs = async (
  format: "csv" | "excel" | "pdf",
  filter?: AuditLogFilter
): Promise<Blob> => {
  const params: Record<string, unknown> = {};
  if (filter?.search) params.search = filter.search;
  if (filter?.actionTypes?.length) params.actionTypes = filter.actionTypes.join(",");
  if (filter?.entityTypes?.length) params.entityTypes = filter.entityTypes.join(",");
  if (filter?.userId) params.userId = filter.userId;
  if (filter?.from) params.from = filter.from;
  if (filter?.to) params.to = filter.to;
  const response = await api.get(
    `/admin/security/export/audit-logs/${format}`,
    { params, responseType: "blob" }
  );
  return response.data;
};

// ==================== 11. Service Order Audit Logs ====================

export interface ServiceOrderAuditLogDTO {
  id: number;
  eventType: string;
  actorName: string;
  actorRole: string;
  patientName: string;
  appointmentId: number | null;
  serviceOrderId: number | null;
  summary: string;
  createdAt: string;
}

export interface ServiceOrderAuditLogDetailDTO {
  id: number;
  eventType: string;
  actorName: string;
  actorRole: string;
  createdAt: string;
  appointmentId: number | null;
  consultationId: number | null;
  patientId: number | null;
  patientName: string;
  serviceOrderId: number | null;
  serviceResultId: number | null;
  summary: string;
  beforeData: unknown;
  afterData: unknown;
  ipAddress: string;
  userAgent: string;
}

export interface ServiceOrderAuditFilter {
  eventTypes?: string[];
  roles?: string[];
  search?: string;
  from?: string;
  to?: string;
  appointmentId?: number;
  serviceOrderId?: number;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: string;
}

export const getServiceOrderAuditLogs = async (
  filter: ServiceOrderAuditFilter
): Promise<PageResponse<ServiceOrderAuditLogDTO>> => {
  const params: Record<string, unknown> = {};
  if (filter.eventTypes?.length) params.eventTypes = filter.eventTypes;
  if (filter.roles?.length) params.roles = filter.roles;
  if (filter.search) params.search = filter.search;
  if (filter.from) params.from = filter.from;
  if (filter.to) params.to = filter.to;
  if (filter.appointmentId) params.appointmentId = filter.appointmentId;
  if (filter.serviceOrderId) params.serviceOrderId = filter.serviceOrderId;
  params.pageNumber = filter.pageNumber ?? 0;
  params.pageSize = filter.pageSize ?? 20;
  params.sortBy = filter.sortBy || "createdAt";
  params.sortDir = filter.sortDir || "DESC";
  const response = await api.get("/admin/service-order-audit", { params });
  return response.data;
};

export const getServiceOrderAuditDetail = async (
  id: number
): Promise<ServiceOrderAuditLogDetailDTO> => {
  const response = await api.get(`/admin/service-order-audit/${id}`);
  return response.data;
};

export const getServiceOrderAuditTimeline = async (
  appointmentId: number
): Promise<ServiceOrderAuditLogDTO[]> => {
  const response = await api.get(
    `/admin/service-order-audit/timeline/${appointmentId}`
  );
  return response.data;
};

export const getServiceOrderAuditEventTypes = async (): Promise<string[]> => {
  const response = await api.get("/admin/service-order-audit/event-types");
  return response.data;
};

export const SO_AUDIT_EVENT_LABELS: Record<string, string> = {
  SERVICE_ORDER_CREATED: "Order Created",
  SERVICE_PAYMENT_COLLECTED: "Payment Collected",
  SERVICE_STARTED: "Service Started",
  SERVICE_RESULT_COMPLETED: "Result Completed",
  SERVICE_RESULT_VIEWED: "Result Viewed",
  CONSULTATION_FINALIZED: "Consultation Finalized",
  SERVICE_ORDER_CANCELLED: "Order Cancelled",
};

export const SO_AUDIT_EVENT_COLORS: Record<string, string> = {
  SERVICE_ORDER_CREATED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  SERVICE_PAYMENT_COLLECTED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  SERVICE_STARTED: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  SERVICE_RESULT_COMPLETED: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  SERVICE_RESULT_VIEWED: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
  CONSULTATION_FINALIZED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  SERVICE_ORDER_CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

// ==================== Helpers ====================

export const EVENT_TYPE_LABELS: Record<SecurityEventType, string> = {
  FAILED_LOGIN: "Failed Login",
  ACCOUNT_LOCKOUT: "Account Lockout",
  SUSPICIOUS_LOGIN_LOCATION: "Suspicious Login Location",
  MULTIPLE_FAILED_2FA: "Multiple Failed 2FA",
  PASSWORD_BRUTE_FORCE: "Password Brute Force",
  SQL_INJECTION_ATTEMPT: "SQL Injection Attempt",
  XSS_ATTEMPT: "XSS Attempt",
  UNUSUAL_DATA_ACCESS: "Unusual Data Access",
  RAPID_API_CALLS: "Rapid API Calls",
  FILE_UPLOAD_VIOLATION: "File Upload Violation",
  PASSWORD_CHANGED: "Password Changed",
  TWO_FA_ENABLED: "2FA Enabled",
  TWO_FA_DISABLED: "2FA Disabled",
  ROLE_CHANGED: "Role Changed",
  ACCOUNT_UNLOCKED: "Account Unlocked",
};

export const SEVERITY_COLORS: Record<SecuritySeverity, string> = {
  HIGH: "error",
  MEDIUM: "warning",
  LOW: "info",
};

export const STATUS_COLORS: Record<SecurityEventStatus, string> = {
  NEW: "warning",
  REVIEWED: "info",
  RESOLVED: "success",
};

export const ALL_EVENT_TYPES: SecurityEventType[] = [
  "FAILED_LOGIN",
  "ACCOUNT_LOCKOUT",
  "SUSPICIOUS_LOGIN_LOCATION",
  "MULTIPLE_FAILED_2FA",
  "PASSWORD_BRUTE_FORCE",
  "SQL_INJECTION_ATTEMPT",
  "XSS_ATTEMPT",
  "UNUSUAL_DATA_ACCESS",
  "RAPID_API_CALLS",
  "FILE_UPLOAD_VIOLATION",
  "PASSWORD_CHANGED",
  "TWO_FA_ENABLED",
  "TWO_FA_DISABLED",
  "ROLE_CHANGED",
  "ACCOUNT_UNLOCKED",
];

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

export const IP_STATUS_LABELS: Record<IpStatus, string> = {
  BLOCKED: "Blocked",
  WHITELISTED: "Whitelisted",
  FLAGGED: "Flagged",
};

export const IP_STATUS_COLORS: Record<IpStatus, string> = {
  BLOCKED: "error",
  WHITELISTED: "success",
  FLAGGED: "warning",
};

export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  TEMPORARY: "Temporary",
  PERMANENT: "Permanent",
};

export const BLOCK_SCOPE_LABELS: Record<BlockScope, string> = {
  ENTIRE_SYSTEM: "Entire System",
  ADMIN_PANEL_ONLY: "Admin Panel Only",
  API_ONLY: "API Only",
};

export const AUDIT_ACTION_LABELS: Record<AuditActionType, string> = {
  CREATE: "Create",
  UPDATE: "Update",
  DELETE: "Delete",
  LOGIN: "Login",
  LOGOUT: "Logout",
  SENSITIVE_ACCESS: "Sensitive Access",
};

export const AUDIT_ACTION_COLORS: Record<AuditActionType, { bg: string; text: string; dot: string }> = {
  CREATE: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", dot: "bg-green-500" },
  UPDATE: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", dot: "bg-blue-500" },
  DELETE: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", dot: "bg-red-500" },
  LOGIN: { bg: "bg-cyan-100 dark:bg-cyan-900/30", text: "text-cyan-700 dark:text-cyan-400", dot: "bg-cyan-500" },
  LOGOUT: { bg: "bg-gray-100 dark:bg-gray-700/50", text: "text-gray-600 dark:text-gray-300", dot: "bg-gray-400" },
  SENSITIVE_ACCESS: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400", dot: "bg-orange-500" },
};

export const ALL_AUDIT_ACTION_TYPES: AuditActionType[] = [
  "CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT", "SENSITIVE_ACCESS",
];

export const ALL_AUDIT_ENTITY_TYPES: AuditEntityType[] = [
  "USER", "APPOINTMENT", "PRESCRIPTION", "PAYMENT", "INVOICE", "DOCTOR",
  "SPECIALTY", "REVIEW", "NOTIFICATION", "SYSTEM_SETTING", "BACKUP", "REFUND",
  "SCHEDULE", "TIME_SLOT", "MEDICAL_RECORD", "CONSENT", "SESSION", "IP_RULE",
  "INVESTIGATION",
];

export const AUDIT_ENTITY_LABELS: Record<AuditEntityType, string> = {
  USER: "User",
  APPOINTMENT: "Appointment",
  PRESCRIPTION: "Prescription",
  PAYMENT: "Payment",
  INVOICE: "Invoice",
  DOCTOR: "Doctor",
  SPECIALTY: "Specialty",
  REVIEW: "Review",
  NOTIFICATION: "Notification",
  SYSTEM_SETTING: "System Setting",
  BACKUP: "Backup",
  REFUND: "Refund",
  SCHEDULE: "Schedule",
  TIME_SLOT: "Time Slot",
  MEDICAL_RECORD: "Medical Record",
  CONSENT: "Consent",
  SESSION: "Session",
  IP_RULE: "IP Rule",
  INVESTIGATION: "Investigation",
};

// ==================== 10.4 Activity Log Helpers ====================

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  LOGIN: "Login",
  LOGOUT: "Logout",
  PASSWORD_CHANGE: "Password Change",
  PROFILE_UPDATE: "Profile Update",
  CREATED_USER: "Created User",
  UPDATED_USER: "Updated User",
  DISABLED_USER: "Disabled User",
  ASSIGNED_ROLE: "Assigned Role",
  RESET_PASSWORD: "Reset Password",
  CREATED_APPOINTMENT: "Created Appointment",
  CONFIRMED_APPOINTMENT: "Confirmed Appointment",
  CHECKED_IN_PATIENT: "Checked-in Patient",
  CANCELLED_APPOINTMENT: "Cancelled Appointment",
  RESCHEDULED_APPOINTMENT: "Rescheduled Appointment",
  CREATED_SCHEDULE: "Created Schedule",
  UPDATED_SCHEDULE: "Updated Schedule",
  DELETED_SCHEDULE: "Deleted Schedule",
  ADDED_SCHEDULE_EXCEPTION: "Added Schedule Exception",
  DELETED_SCHEDULE_EXCEPTION: "Deleted Schedule Exception",
  GENERATED_TIME_SLOTS: "Generated Time Slots",
  CREATED_TIME_SLOT: "Created Time Slot",
  UPDATED_TIME_SLOT: "Updated Time Slot",
  DELETED_TIME_SLOT: "Deleted Time Slot",
  BLOCKED_TIME_SLOT: "Blocked Time Slot",
  UNBLOCKED_TIME_SLOT: "Unblocked Time Slot",
  BULK_CREATED_TIME_SLOTS: "Bulk Created Time Slots",
  BULK_BLOCKED_TIME_SLOTS: "Bulk Blocked Time Slots",
  BULK_UNBLOCKED_TIME_SLOTS: "Bulk Unblocked Time Slots",
  ROLLED_BACK_TIME_SLOTS: "Rolled Back Time Slots",
  CREATED_PRESCRIPTION: "Created Prescription",
  APPLIED_TEMPLATE: "Applied Template",
  PROCESSED_PAYMENT: "Processed Payment",
  ISSUED_REFUND: "Issued Refund",
  CHANGED_SETTINGS: "Changed Settings",
  CREATED_BACKUP: "Created Backup",
  ENABLED_MAINTENANCE: "Enabled Maintenance",
  UPDATED_PAGE: "Updated Page",
  ADDED_SPECIALIZATION: "Added Specialization",
  MODIFIED_TEMPLATE: "Modified Template",
};

export const ACTIVITY_TYPE_ICONS: Record<ActivityType, string> = {
  LOGIN: "Login",
  LOGOUT: "Logout",
  PASSWORD_CHANGE: "Key",
  PROFILE_UPDATE: "Edit",
  CREATED_USER: "+User",
  UPDATED_USER: "Edit",
  DISABLED_USER: "Block",
  ASSIGNED_ROLE: "Role",
  RESET_PASSWORD: "Key",
  CREATED_APPOINTMENT: "Appt",
  CONFIRMED_APPOINTMENT: "OK",
  CHECKED_IN_PATIENT: "In",
  CANCELLED_APPOINTMENT: "Cancel",
  RESCHEDULED_APPOINTMENT: "Move",
  CREATED_SCHEDULE: "Sch+",
  UPDATED_SCHEDULE: "Sch",
  DELETED_SCHEDULE: "Sch-",
  ADDED_SCHEDULE_EXCEPTION: "Ex+",
  DELETED_SCHEDULE_EXCEPTION: "Ex-",
  GENERATED_TIME_SLOTS: "Gen",
  CREATED_TIME_SLOT: "Slot+",
  UPDATED_TIME_SLOT: "Slot",
  DELETED_TIME_SLOT: "Slot-",
  BLOCKED_TIME_SLOT: "Block",
  UNBLOCKED_TIME_SLOT: "Unblk",
  BULK_CREATED_TIME_SLOTS: "Bulk+",
  BULK_BLOCKED_TIME_SLOTS: "BBlk",
  BULK_UNBLOCKED_TIME_SLOTS: "BUn",
  ROLLED_BACK_TIME_SLOTS: "Rb",
  CREATED_PRESCRIPTION: "Rx",
  APPLIED_TEMPLATE: "Tpl",
  PROCESSED_PAYMENT: "Pay",
  ISSUED_REFUND: "Refund",
  CHANGED_SETTINGS: "Cfg",
  CREATED_BACKUP: "Bkp",
  ENABLED_MAINTENANCE: "Maint",
  UPDATED_PAGE: "Page",
  ADDED_SPECIALIZATION: "Spec",
  MODIFIED_TEMPLATE: "Tpl",
};

export const ACTIVITY_TYPE_COLORS: Record<ActivityType, { bg: string; text: string; dot: string }> = {
  LOGIN: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
  LOGOUT: { bg: "bg-slate-100 dark:bg-slate-900/30", text: "text-slate-700 dark:text-slate-400", dot: "bg-slate-500" },
  PASSWORD_CHANGE: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400", dot: "bg-orange-500" },
  PROFILE_UPDATE: { bg: "bg-cyan-100 dark:bg-cyan-900/30", text: "text-cyan-700 dark:text-cyan-400", dot: "bg-cyan-500" },
  CREATED_USER: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", dot: "bg-green-500" },
  UPDATED_USER: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", dot: "bg-blue-500" },
  DISABLED_USER: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", dot: "bg-red-500" },
  ASSIGNED_ROLE: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-400", dot: "bg-purple-500" },
  RESET_PASSWORD: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400", dot: "bg-orange-500" },
  CREATED_APPOINTMENT: { bg: "bg-cyan-100 dark:bg-cyan-900/30", text: "text-cyan-700 dark:text-cyan-400", dot: "bg-cyan-500" },
  CONFIRMED_APPOINTMENT: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
  CHECKED_IN_PATIENT: { bg: "bg-teal-100 dark:bg-teal-900/30", text: "text-teal-700 dark:text-teal-400", dot: "bg-teal-500" },
  CANCELLED_APPOINTMENT: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", dot: "bg-red-500" },
  RESCHEDULED_APPOINTMENT: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400", dot: "bg-amber-500" },
  CREATED_SCHEDULE: { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-400", dot: "bg-indigo-500" },
  UPDATED_SCHEDULE: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", dot: "bg-blue-500" },
  DELETED_SCHEDULE: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", dot: "bg-red-500" },
  ADDED_SCHEDULE_EXCEPTION: { bg: "bg-fuchsia-100 dark:bg-fuchsia-900/30", text: "text-fuchsia-700 dark:text-fuchsia-400", dot: "bg-fuchsia-500" },
  DELETED_SCHEDULE_EXCEPTION: { bg: "bg-rose-100 dark:bg-rose-900/30", text: "text-rose-700 dark:text-rose-400", dot: "bg-rose-500" },
  GENERATED_TIME_SLOTS: { bg: "bg-sky-100 dark:bg-sky-900/30", text: "text-sky-700 dark:text-sky-400", dot: "bg-sky-500" },
  CREATED_TIME_SLOT: { bg: "bg-cyan-100 dark:bg-cyan-900/30", text: "text-cyan-700 dark:text-cyan-400", dot: "bg-cyan-500" },
  UPDATED_TIME_SLOT: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", dot: "bg-blue-500" },
  DELETED_TIME_SLOT: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", dot: "bg-red-500" },
  BLOCKED_TIME_SLOT: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400", dot: "bg-orange-500" },
  UNBLOCKED_TIME_SLOT: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
  BULK_CREATED_TIME_SLOTS: { bg: "bg-sky-100 dark:bg-sky-900/30", text: "text-sky-700 dark:text-sky-400", dot: "bg-sky-500" },
  BULK_BLOCKED_TIME_SLOTS: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400", dot: "bg-orange-500" },
  BULK_UNBLOCKED_TIME_SLOTS: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
  ROLLED_BACK_TIME_SLOTS: { bg: "bg-slate-100 dark:bg-slate-900/30", text: "text-slate-700 dark:text-slate-400", dot: "bg-slate-500" },
  CREATED_PRESCRIPTION: { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-400", dot: "bg-indigo-500" },
  APPLIED_TEMPLATE: { bg: "bg-violet-100 dark:bg-violet-900/30", text: "text-violet-700 dark:text-violet-400", dot: "bg-violet-500" },
  PROCESSED_PAYMENT: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", dot: "bg-green-500" },
  ISSUED_REFUND: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400", dot: "bg-yellow-500" },
  CHANGED_SETTINGS: { bg: "bg-gray-100 dark:bg-gray-700/50", text: "text-gray-600 dark:text-gray-300", dot: "bg-gray-500" },
  CREATED_BACKUP: { bg: "bg-sky-100 dark:bg-sky-900/30", text: "text-sky-700 dark:text-sky-400", dot: "bg-sky-500" },
  ENABLED_MAINTENANCE: { bg: "bg-rose-100 dark:bg-rose-900/30", text: "text-rose-700 dark:text-rose-400", dot: "bg-rose-500" },
  UPDATED_PAGE: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", dot: "bg-blue-500" },
  ADDED_SPECIALIZATION: { bg: "bg-fuchsia-100 dark:bg-fuchsia-900/30", text: "text-fuchsia-700 dark:text-fuchsia-400", dot: "bg-fuchsia-500" },
  MODIFIED_TEMPLATE: { bg: "bg-violet-100 dark:bg-violet-900/30", text: "text-violet-700 dark:text-violet-400", dot: "bg-violet-500" },
};

export const ACTIVITY_CATEGORIES: { label: string; types: ActivityType[] }[] = [
  {
    label: "Authentication",
    types: ["LOGIN", "LOGOUT", "PASSWORD_CHANGE"],
  },
  {
    label: "User Management",
    types: ["CREATED_USER", "UPDATED_USER", "DISABLED_USER", "ASSIGNED_ROLE", "RESET_PASSWORD", "PROFILE_UPDATE"],
  },
  {
    label: "Appointments",
    types: ["CREATED_APPOINTMENT", "CONFIRMED_APPOINTMENT", "CHECKED_IN_PATIENT", "CANCELLED_APPOINTMENT", "RESCHEDULED_APPOINTMENT"],
  },
  {
    label: "Schedule",
    types: [
      "CREATED_SCHEDULE",
      "UPDATED_SCHEDULE",
      "DELETED_SCHEDULE",
      "ADDED_SCHEDULE_EXCEPTION",
      "DELETED_SCHEDULE_EXCEPTION",
      "GENERATED_TIME_SLOTS",
      "CREATED_TIME_SLOT",
      "UPDATED_TIME_SLOT",
      "DELETED_TIME_SLOT",
      "BLOCKED_TIME_SLOT",
      "UNBLOCKED_TIME_SLOT",
      "BULK_CREATED_TIME_SLOTS",
      "BULK_BLOCKED_TIME_SLOTS",
      "BULK_UNBLOCKED_TIME_SLOTS",
      "ROLLED_BACK_TIME_SLOTS",
    ],
  },
  {
    label: "Prescriptions",
    types: ["CREATED_PRESCRIPTION", "APPLIED_TEMPLATE"],
  },
  {
    label: "Payments",
    types: ["PROCESSED_PAYMENT", "ISSUED_REFUND"],
  },
  {
    label: "System",
    types: ["CHANGED_SETTINGS", "CREATED_BACKUP", "ENABLED_MAINTENANCE"],
  },
  {
    label: "Content",
    types: ["UPDATED_PAGE", "ADDED_SPECIALIZATION", "MODIFIED_TEMPLATE"],
  },
];

export const ALL_ACTIVITY_TYPES: ActivityType[] = [
  "LOGIN", "LOGOUT", "PASSWORD_CHANGE", "PROFILE_UPDATE",
  "CREATED_USER", "UPDATED_USER", "DISABLED_USER", "ASSIGNED_ROLE", "RESET_PASSWORD",
  "CREATED_APPOINTMENT", "CONFIRMED_APPOINTMENT", "CHECKED_IN_PATIENT", "CANCELLED_APPOINTMENT", "RESCHEDULED_APPOINTMENT",
  "CREATED_SCHEDULE", "UPDATED_SCHEDULE", "DELETED_SCHEDULE",
  "ADDED_SCHEDULE_EXCEPTION", "DELETED_SCHEDULE_EXCEPTION",
  "GENERATED_TIME_SLOTS",
  "CREATED_TIME_SLOT", "UPDATED_TIME_SLOT", "DELETED_TIME_SLOT",
  "BLOCKED_TIME_SLOT", "UNBLOCKED_TIME_SLOT",
  "BULK_CREATED_TIME_SLOTS", "BULK_BLOCKED_TIME_SLOTS", "BULK_UNBLOCKED_TIME_SLOTS",
  "ROLLED_BACK_TIME_SLOTS",
  "CREATED_PRESCRIPTION", "APPLIED_TEMPLATE",
  "PROCESSED_PAYMENT", "ISSUED_REFUND",
  "CHANGED_SETTINGS", "CREATED_BACKUP", "ENABLED_MAINTENANCE",
  "UPDATED_PAGE", "ADDED_SPECIALIZATION", "MODIFIED_TEMPLATE",
];

export const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Admin" },
  { value: "DOCTOR", label: "Doctor" },
  { value: "RECEPTIONIST", label: "Receptionist" },
  { value: "PATIENT", label: "Patient" },
];

// ==================== 10.5 Session Management Helpers ====================

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  ACTIVE: "Active",
  IDLE: "Idle",
  EXPIRED: "Expired",
  REVOKED: "Revoked",
};

export const SESSION_STATUS_COLORS: Record<SessionStatus, { bg: string; text: string; dot: string }> = {
  ACTIVE: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", dot: "bg-green-500" },
  IDLE: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400", dot: "bg-yellow-500" },
  EXPIRED: { bg: "bg-gray-100 dark:bg-gray-700/50", text: "text-gray-600 dark:text-gray-300", dot: "bg-gray-400" },
  REVOKED: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", dot: "bg-red-500" },
};

export const DEVICE_TYPE_ICONS: Record<string, string> = {
  Desktop: "PC",
  Mobile: "Mobile",
  Tablet: "Tablet",
  Unknown: "?",
};

export const ALL_SESSION_STATUSES: SessionStatus[] = ["ACTIVE", "IDLE", "EXPIRED", "REVOKED"];

// ==================== 10.6 Investigation Helpers ====================

export const INVESTIGATION_STATUS_LABELS: Record<InvestigationStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export const INVESTIGATION_STATUS_COLORS: Record<InvestigationStatus, { bg: string; text: string; dot: string }> = {
  OPEN: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", dot: "bg-blue-500" },
  IN_PROGRESS: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400", dot: "bg-yellow-500" },
  RESOLVED: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", dot: "bg-green-500" },
  CLOSED: { bg: "bg-gray-100 dark:bg-gray-700/50", text: "text-gray-600 dark:text-gray-300", dot: "bg-gray-400" },
};

export const INVESTIGATION_TYPE_LABELS: Record<InvestigationType, string> = {
  SECURITY_BREACH: "Security Breach",
  FRAUD_ATTEMPT: "Fraud Attempt",
  DATA_LEAK: "Data Leak",
  POLICY_VIOLATION: "Policy Violation",
  OTHER: "Other",
};

export const INVESTIGATION_TYPE_ICONS: Record<InvestigationType, string> = {
  SECURITY_BREACH: "Breach",
  FRAUD_ATTEMPT: "Fraud",
  DATA_LEAK: "Leak",
  POLICY_VIOLATION: "Policy",
  OTHER: "Other",
};

export const INVESTIGATION_TYPE_COLORS: Record<InvestigationType, { bg: string; text: string }> = {
  SECURITY_BREACH: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400" },
  FRAUD_ATTEMPT: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400" },
  DATA_LEAK: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-400" },
  POLICY_VIOLATION: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400" },
  OTHER: { bg: "bg-gray-100 dark:bg-gray-700/50", text: "text-gray-600 dark:text-gray-300" },
};

export const EVIDENCE_TYPE_LABELS: Record<EvidenceType, string> = {
  SECURITY_EVENT: "Security Event",
  AUDIT_LOG: "Audit Log",
  ACTIVITY_LOG: "Activity Log",
  FILE: "File",
};

export const EVIDENCE_TYPE_ICONS: Record<EvidenceType, string> = {
  SECURITY_EVENT: "Event",
  AUDIT_LOG: "Audit",
  ACTIVITY_LOG: "Activity",
  FILE: "File",
};

export const ALL_INVESTIGATION_STATUSES: InvestigationStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
export const ALL_INVESTIGATION_TYPES: InvestigationType[] = ["SECURITY_BREACH", "FRAUD_ATTEMPT", "DATA_LEAK", "POLICY_VIOLATION", "OTHER"];
export const ALL_EVIDENCE_TYPES: EvidenceType[] = ["SECURITY_EVENT", "AUDIT_LOG", "ACTIVITY_LOG", "FILE"];
