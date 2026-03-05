import api from './api';

// ==================== MAINTENANCE TYPES ====================

export type MaintenanceType = 'SCHEDULED' | 'EMERGENCY' | 'ROUTINE';
export type MaintenanceStatus = 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type OptimizationType =
  | 'DB_DEFRAGMENT'
  | 'INDEX_REBUILD'
  | 'CACHE_CLEAR'
  | 'ORPHAN_CLEANUP'
  | 'VACUUM'
  | 'DUPLICATE_REMOVE'
  | 'LOG_ARCHIVE'
  | 'OLD_DATA_CLEANUP';

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// ----- Dashboard -----
export interface ActiveMaintenanceInfo {
  id: number;
  title: string;
  message: string;
  maintenanceType: string;
  actualStartTime: string;
  endTime: string;
  remainingMinutes: number;
  allowAdminAccess: boolean;
  whitelistedIps: string[];
}

export interface UpcomingMaintenanceInfo {
  id: number;
  title: string;
  maintenanceType: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  impact: string;
}

export interface MaintenanceStatsInfo {
  totalScheduled: number;
  totalCompleted: number;
  totalCancelled: number;
  lastMaintenanceAt: string | null;
}

export interface MaintenanceDashboard {
  isMaintenanceActive: boolean;
  activeMaintenance: ActiveMaintenanceInfo | null;
  upcomingMaintenance: UpcomingMaintenanceInfo[];
  stats: MaintenanceStatsInfo;
}

// ----- Create / Edit -----
export interface MaintenanceWindowCreateDTO {
  title: string;
  description?: string;
  maintenanceType: MaintenanceType;
  startTime: string; // yyyy-MM-dd HH:mm:ss
  endTime: string;
  message?: string;
  notifyBeforeMinutes?: number;
  allowAdminAccess?: boolean;
  whitelistedIps?: string[];
  impact?: string;
  affectedServices?: string;
}

export interface ActivateMaintenanceDTO {
  message: string;
  durationMinutes: number;
  whitelistedIps?: string[];
  allowAdminAccess?: boolean;
}

// ----- List / Detail -----
export interface MaintenanceRecord {
  id: number;
  title: string;
  maintenanceType: string;
  status: string;
  startTime: string;
  endTime: string;
  actualStartTime?: string;
  actualEndTime?: string;
  durationMinutes?: number;
  description?: string;
  message?: string;
  notifyBeforeMinutes?: number;
  allowAdminAccess?: boolean;
  whitelistedIps?: string[];
  impact?: string;
  affectedServices?: string;
  createdByName?: string;
  createdById?: number;
  createdAt?: string;
  updatedAt?: string;
}

// ==================== OPTIMIZATION TYPES ====================

export interface TableStat {
  tableName: string;
  rows: number;
  dataLength: number;
  indexLength: number;
  totalSize: number;
  totalSizeFormatted: string;
  engine: string;
  collation: string;
}

export interface FragmentationInfo {
  tableName: string;
  dataLength: number;
  dataFree: number;
  fragmentationPercent: number;
  status: string;
}

export interface DatabaseHealth {
  healthScore: number;
  status: string;
  totalSize: number;
  totalSizeFormatted: string;
  tableCount: number;
  tableStats: TableStat[];
  fragmentationInfo: FragmentationInfo[];
  recommendations: string[];
}

export interface CacheDetail {
  cacheName: string;
  entryCount: number;
  estimatedSize: number;
  estimatedSizeFormatted: string;
  hitRate: number;
  hitCount: number;
  missCount: number;
}

export interface CacheStats {
  totalCaches: number;
  totalEntries: number;
  estimatedSize: number;
  estimatedSizeFormatted: string;
  caches: CacheDetail[];
}

export interface CleanupItem {
  dataType: string;
  displayName: string;
  recordCount: number;
  estimatedSize: number;
  estimatedSizeFormatted: string;
  oldestRecord: string;
  newestRecord: string;
}

export interface CleanupPreview {
  totalRecords: number;
  estimatedSpaceSaved: number;
  estimatedSpaceSavedFormatted: string;
  beforeDate: string;
  items: CleanupItem[];
}

export interface CleanupRequest {
  dataTypes: string[];
  beforeDate: string;
  createBackupFirst?: boolean;
  notes?: string;
}

export interface OptimizationLog {
  id: number;
  optimizationType: string;
  status: string;
  details: string;
  sizeBefore: number;
  sizeAfter: number;
  recordsAffected: number;
  duration: number;
  startedAt: string;
  completedAt: string;
  errorMessage: string | null;
  createdByName?: string;
}

export interface DiskUsage {
  totalSpace: number;
  freeSpace: number;
  usedSpace: number;
  usagePercent: number;
  totalFormatted: string;
  freeFormatted: string;
  usedFormatted: string;
  [key: string]: unknown;
}

export interface DuplicateFile {
  fileName: string;
  size: number;
  sizeFormatted: string;
  count: number;
  paths: string[];
  [key: string]: unknown;
}

// ==================== MAINTENANCE API ====================

export const getMaintenanceDashboard = async (): Promise<MaintenanceDashboard> => {
  const response = await api.get('/admin/maintenance/dashboard');
  return response.data;
};

export const getMaintenanceStatus = async (): Promise<{ isMaintenanceActive: boolean; activeMaintenance: ActiveMaintenanceInfo | null }> => {
  const response = await api.get('/admin/maintenance/status');
  return response.data;
};

export const scheduleMaintenance = async (dto: MaintenanceWindowCreateDTO): Promise<MaintenanceRecord> => {
  const response = await api.post('/admin/maintenance/schedule', dto);
  return response.data;
};

export const activateMaintenanceNow = async (dto: ActivateMaintenanceDTO): Promise<MaintenanceRecord> => {
  const response = await api.post('/admin/maintenance/activate', dto);
  return response.data;
};

export const deactivateMaintenance = async (id: number): Promise<MaintenanceRecord> => {
  const response = await api.post(`/admin/maintenance/${id}/deactivate`);
  return response.data;
};

export const updateMaintenance = async (id: number, dto: MaintenanceWindowCreateDTO): Promise<MaintenanceRecord> => {
  const response = await api.put(`/admin/maintenance/${id}`, dto);
  return response.data;
};

export const cancelMaintenance = async (id: number): Promise<{ message: string }> => {
  const response = await api.delete(`/admin/maintenance/${id}`);
  return response.data;
};

export const getMaintenanceHistory = async (params: {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: string;
}): Promise<PageResponse<MaintenanceRecord>> => {
  const response = await api.get('/admin/maintenance/history', { params });
  return response.data;
};

export const getUpcomingMaintenance = async (): Promise<MaintenanceRecord[]> => {
  const response = await api.get('/admin/maintenance/upcoming');
  return response.data;
};

export const getMaintenanceDetail = async (id: number): Promise<MaintenanceRecord> => {
  const response = await api.get(`/admin/maintenance/${id}`);
  return response.data;
};

// ==================== OPTIMIZATION API ====================

export const getDatabaseHealth = async (): Promise<DatabaseHealth> => {
  const response = await api.get('/admin/optimization/database-health');
  return response.data;
};

export const defragmentDatabase = async (): Promise<OptimizationLog> => {
  const response = await api.post('/admin/optimization/defragment');
  return response.data;
};

export const rebuildIndexes = async (): Promise<OptimizationLog> => {
  const response = await api.post('/admin/optimization/rebuild-indexes');
  return response.data;
};

export const cleanOrphans = async (): Promise<OptimizationLog> => {
  const response = await api.post('/admin/optimization/clean-orphans');
  return response.data;
};

export const vacuumDatabase = async (): Promise<OptimizationLog> => {
  const response = await api.post('/admin/optimization/vacuum');
  return response.data;
};

export const getCacheStats = async (): Promise<CacheStats> => {
  const response = await api.get('/admin/optimization/cache');
  return response.data;
};

export const clearCache = async (cacheTypes?: string[]): Promise<OptimizationLog> => {
  const response = await api.post('/admin/optimization/cache/clear', null, {
    params: cacheTypes ? { cacheTypes: cacheTypes.join(',') } : undefined,
  });
  return response.data;
};

export const previewCleanup = async (
  dataTypes: string[],
  beforeDate: string
): Promise<CleanupPreview> => {
  const response = await api.post('/admin/optimization/cleanup/preview', null, {
    params: { dataTypes: dataTypes.join(','), beforeDate },
  });
  return response.data;
};

export const executeCleanup = async (dto: CleanupRequest): Promise<OptimizationLog> => {
  const response = await api.post('/admin/optimization/cleanup/execute', dto);
  return response.data;
};

export const getDiskUsage = async (): Promise<DiskUsage> => {
  const response = await api.get('/admin/optimization/disk-usage');
  return response.data;
};

export const findDuplicateFiles = async (): Promise<DuplicateFile[]> => {
  const response = await api.get('/admin/optimization/duplicate-files');
  return response.data;
};

export const archiveLogs = async (beforeDate: string): Promise<OptimizationLog> => {
  const response = await api.post('/admin/optimization/archive-logs', null, {
    params: { beforeDate },
  });
  return response.data;
};

export const getOptimizationHistory = async (params: {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: string;
}): Promise<PageResponse<OptimizationLog>> => {
  const response = await api.get('/admin/optimization/history', { params });
  return response.data;
};

// ==================== HELPERS ====================

export type BadgeColor =
  | 'primary'
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'light'
  | 'dark';

export const getMaintenanceStatusColor = (status: string): BadgeColor => {
  switch (status) {
    case 'ACTIVE': return 'error';
    case 'SCHEDULED': return 'warning';
    case 'COMPLETED': return 'success';
    case 'CANCELLED': return 'light';
    default: return 'light';
  }
};

export const getMaintenanceStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    ACTIVE: 'Active',
    SCHEDULED: 'Scheduled',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
  };
  return labels[status] || status;
};

export const getMaintenanceTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    SCHEDULED: 'Scheduled',
    EMERGENCY: 'Emergency',
    ROUTINE: 'Routine',
  };
  return labels[type] || type;
};

export const getOptimizationTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    DB_DEFRAGMENT: 'Defragment',
    INDEX_REBUILD: 'Rebuild Indexes',
    CACHE_CLEAR: 'Clear Cache',
    ORPHAN_CLEANUP: 'Clean Orphans',
    VACUUM: 'Vacuum DB',
    DUPLICATE_REMOVE: 'Remove Duplicates',
    LOG_ARCHIVE: 'Archive Logs',
    OLD_DATA_CLEANUP: 'Data Cleanup',
  };
  return labels[type] || type;
};

export const getOptimizationStatusColor = (status: string): BadgeColor => {
  switch (status) {
    case 'COMPLETED': return 'success';
    case 'IN_PROGRESS': return 'warning';
    case 'FAILED': return 'error';
    default: return 'light';
  }
};

export const getHealthScoreColor = (score: number): string => {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
  return 'text-red-500';
};

export const getHealthScoreBg = (score: number): string => {
  if (score >= 80) return 'bg-green-100 dark:bg-green-500/20';
  if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-500/20';
  return 'bg-red-100 dark:bg-red-500/20';
};

export const getFragmentationColor = (pct: number): string => {
  if (pct < 10) return 'text-green-600';
  if (pct < 30) return 'text-yellow-600';
  return 'text-red-600';
};

export const formatBytes = (bytes: number): string => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDuration = (ms: number): string => {
  if (!ms || ms <= 0) return '0s';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
};

export const formatDateTime = (dt: string | null | undefined): string => {
  if (!dt) return '-';
  return new Date(dt).toLocaleString();
};

export const formatMinutes = (min: number | undefined): string => {
  if (!min) return '-';
  if (min >= 60) return `${Math.floor(min / 60)}h ${min % 60}m`;
  return `${min}m`;
};
