import api from './api';

// ==================== TYPES ====================

export type BackupType = 'FULL' | 'INCREMENTAL' | 'DIFFERENTIAL' | 'MANUAL';
export type BackupStatus = 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type StorageLocation = 'LOCAL' | 'CLOUD' | 'EXTERNAL';

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// Dashboard
export interface LastBackupInfo {
  id: number;
  backupName: string;
  backupType: string;
  status: string;
  size: number;
  sizeFormatted: string;
  duration: number;
  completedAt: string;
}

export interface NextScheduledInfo {
  scheduleId: number;
  scheduleName: string;
  backupType: string;
  cronExpression: string;
  nextRunAt: string;
}

export interface HealthInfo {
  status: string; // HEALTHY, WARNING, NO_BACKUP
  completedCount: number;
  failedCount: number;
  inProgressCount: number;
}

export interface StorageInfo {
  location: string;
  totalBackupSize: number;
  totalBackupSizeFormatted: string;
  totalSpace: number;
  freeSpace: number;
  usableSpace: number;
  usagePercent: number;
}

export interface BackupDashboard {
  lastBackup: LastBackupInfo | null;
  nextScheduled: NextScheduledInfo | null;
  health: HealthInfo;
  storageInfo: StorageInfo;
}

// History
export interface BackupRecord {
  id: number;
  backupName: string;
  backupType: string;
  status: string;
  size: number;
  sizeFormatted: string;
  duration: number;
  durationFormatted: string;
  storageLocation: string;
  includes: string;
  encrypted: boolean;
  startedAt: string;
  completedAt: string;
  createdAt: string;
  createdByName: string;
  // Detail fields
  storagePath?: string;
  checksum?: string;
  metadata?: string;
  progressPercent?: number;
  currentStep?: string;
  errorMessage?: string;
  createdById?: number;
  scheduleId?: number;
}

export interface BackupFilterParams {
  type?: string;
  status?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: string;
}

// Manual Backup
export interface ManualBackupRequest {
  backupName: string;
  backupType: BackupType;
  includes?: string[];
  storageLocation: StorageLocation;
  encrypted: boolean;
}

// Progress
export interface BackupProgress {
  backupId: number;
  backupName: string;
  status: string;
  progressPercent: number;
  currentStep: string;
  timeRemaining: number;
  elapsedTime: number;
  currentSize: number;
  startedAt: string;
  errorMessage: string | null;
}

// Schedule
export interface BackupSchedule {
  id?: number;
  name: string;
  backupType: BackupType;
  cronExpression: string;
  storageLocation: StorageLocation;
  retentionDays: number;
  encrypted: boolean;
  includes: string;
  enabled: boolean;
  storagePath?: string;
  maxBackups: number;
}

// ==================== RESTORE TYPES ====================

export type RestoreType = 'FULL' | 'PARTIAL' | 'TEST';
export type RestoreStatus = 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export interface RestoreRequest {
  backupId: number;
  restoreType: RestoreType;
  items?: string[];
  password?: string;
  createPreRestoreBackup?: boolean;
}

export interface RestoreProgress {
  restoreId: number;
  backupId: number;
  backupName: string;
  restoreType: string;
  status: string;
  progressPercent: number;
  currentStep: string;
  timeRemaining: number;
  elapsedTime: number;
  isTestRestore: boolean;
  preRestoreBackupId: number | null;
  startedAt: string;
  errorMessage: string | null;
}

export interface RestoreResult {
  id: number;
  backupId: number;
  backupName: string;
  restoreType: string;
  status: string;
  restoredItems: string[];
  preRestoreBackupId: number | null;
  duration: number;
  durationFormatted: string;
  progressPercent: number;
  currentStep: string;
  isTestRestore: boolean;
  logs: string;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string;
  createdById: number;
  createdByName: string;
}

export interface RestoreRecord {
  id: number;
  backupRecordId: number;
  backupName: string;
  restoreType: string;
  status: string;
  preRestoreBackupId: number | null;
  restoredItems: string;
  startedAt: string;
  completedAt: string | null;
  duration: number | null;
  logs: string | null;
  errorMessage: string | null;
  progressPercent: number;
  currentStep: string;
  isTestRestore: boolean;
  createdByName: string;
}

// ==================== API FUNCTIONS ====================

// Dashboard
export const getDashboard = async (): Promise<BackupDashboard> => {
  const response = await api.get('/admin/backups/dashboard');
  return response.data;
};

// History
export const getHistory = async (
  params: BackupFilterParams
): Promise<PageResponse<BackupRecord>> => {
  const response = await api.get('/admin/backups/history', { params });
  return response.data;
};

// Detail
export const getDetail = async (id: number): Promise<BackupRecord> => {
  const response = await api.get(`/admin/backups/${id}`);
  return response.data;
};

// Verify
export const verifyBackup = async (
  id: number
): Promise<{ valid: boolean; checksum: string; message: string }> => {
  const response = await api.post(`/admin/backups/${id}/verify`);
  return response.data;
};

// Delete
export const deleteBackup = async (
  id: number
): Promise<{ message: string }> => {
  const response = await api.delete(`/admin/backups/${id}`);
  return response.data;
};

// Download
export const downloadBackup = async (id: number): Promise<Blob> => {
  const response = await api.get(`/admin/backups/${id}/download`, {
    responseType: 'blob',
  });
  return response.data;
};

// Manual Backup
export const runManualBackup = async (
  request: ManualBackupRequest
): Promise<BackupRecord> => {
  const response = await api.post('/admin/backups/manual', request);
  return response.data;
};

// Progress
export const getProgress = async (id: number): Promise<BackupProgress> => {
  const response = await api.get(`/admin/backups/${id}/progress`);
  return response.data;
};

// Cancel
export const cancelBackup = async (
  id: number
): Promise<BackupRecord> => {
  const response = await api.post(`/admin/backups/${id}/cancel`);
  return response.data;
};

// Schedules
export const getSchedules = async (): Promise<BackupSchedule[]> => {
  const response = await api.get('/admin/backups/schedules');
  return response.data;
};

export const createSchedule = async (
  schedule: BackupSchedule
): Promise<BackupSchedule> => {
  const response = await api.post('/admin/backups/schedules', schedule);
  return response.data;
};

export const updateSchedule = async (
  id: number,
  schedule: BackupSchedule
): Promise<BackupSchedule> => {
  const response = await api.put(`/admin/backups/schedules/${id}`, schedule);
  return response.data;
};

export const deleteSchedule = async (
  id: number
): Promise<{ message: string }> => {
  const response = await api.delete(`/admin/backups/schedules/${id}`);
  return response.data;
};

export const toggleSchedule = async (
  id: number
): Promise<BackupSchedule> => {
  const response = await api.put(`/admin/backups/schedules/${id}/toggle`);
  return response.data;
};

// ==================== RESTORE API FUNCTIONS ====================

// Restore from existing backup
export const restoreFromBackup = async (
  request: RestoreRequest
): Promise<RestoreRecord> => {
  const response = await api.post('/admin/restore/from-backup', request);
  return response.data;
};

// Restore from uploaded file
export const restoreFromUpload = async (
  file: File,
  restoreType: RestoreType,
  items?: string[],
  password?: string
): Promise<RestoreRecord> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('restoreType', restoreType);
  if (items && items.length > 0) {
    formData.append('items', items.join(','));
  }
  if (password) {
    formData.append('password', password);
  }
  const response = await api.post('/admin/restore/from-upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// Get restore progress
export const getRestoreProgress = async (
  id: number
): Promise<RestoreProgress> => {
  const response = await api.get(`/admin/restore/${id}/progress`);
  return response.data;
};

// Test restore (sandbox)
export const testRestore = async (
  backupId: number
): Promise<RestoreRecord> => {
  const response = await api.post(`/admin/restore/${backupId}/test`);
  return response.data;
};

// Get restore history
export const getRestoreHistory = async (params: {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: string;
}): Promise<PageResponse<RestoreRecord>> => {
  const response = await api.get('/admin/restore/history', { params });
  return response.data;
};

// Get restore detail
export const getRestoreDetail = async (
  id: number
): Promise<RestoreRecord> => {
  const response = await api.get(`/admin/restore/${id}`);
  return response.data;
};

// Get restore summary
export const getRestoreSummary = async (): Promise<Record<string, any>> => {
  const response = await api.get('/admin/restore/summary');
  return response.data;
};

// ==================== RESTORE HELPERS ====================

export const getRestoreStatusColor = (status: string): BadgeColor => {
  switch (status) {
    case 'COMPLETED':
      return 'success';
    case 'IN_PROGRESS':
      return 'warning';
    case 'FAILED':
      return 'error';
    default:
      return 'light';
  }
};

export const getRestoreTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    FULL: 'Full Restore',
    PARTIAL: 'Partial Restore',
    TEST: 'Test Restore',
  };
  return labels[type] || type;
};

// ==================== HELPER FUNCTIONS ====================

export const downloadFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export type BadgeColor =
  | 'primary'
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'light'
  | 'dark';

export const getStatusColor = (status: string): BadgeColor => {
  switch (status) {
    case 'COMPLETED':
      return 'success';
    case 'IN_PROGRESS':
      return 'warning';
    case 'FAILED':
      return 'error';
    case 'CANCELLED':
      return 'light';
    default:
      return 'light';
  }
};

export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    COMPLETED: 'Completed',
    IN_PROGRESS: 'In Progress',
    FAILED: 'Failed',
    CANCELLED: 'Cancelled',
  };
  return labels[status] || status;
};

export const getTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    FULL: 'Full Backup',
    INCREMENTAL: 'Incremental',
    DIFFERENTIAL: 'Differential',
    MANUAL: 'Manual',
  };
  return labels[type] || type;
};

export const getLocationLabel = (location: string): string => {
  const labels: Record<string, string> = {
    LOCAL: 'Local',
    CLOUD: 'Cloud',
    EXTERNAL: 'External',
  };
  return labels[location] || location;
};

export const getHealthColor = (status: string): string => {
  switch (status) {
    case 'HEALTHY':
      return 'text-green-500';
    case 'WARNING':
      return 'text-yellow-500';
    case 'NO_BACKUP':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
};

export const getHealthBgColor = (status: string): string => {
  switch (status) {
    case 'HEALTHY':
      return 'bg-green-100 dark:bg-green-500/20';
    case 'WARNING':
      return 'bg-yellow-100 dark:bg-yellow-500/20';
    case 'NO_BACKUP':
      return 'bg-red-100 dark:bg-red-500/20';
    default:
      return 'bg-gray-100 dark:bg-gray-500/20';
  }
};

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
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

export default {
  getDashboard,
  getHistory,
  getDetail,
  verifyBackup,
  deleteBackup,
  downloadBackup,
  runManualBackup,
  getProgress,
  cancelBackup,
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  toggleSchedule,
  restoreFromBackup,
  restoreFromUpload,
  getRestoreProgress,
  testRestore,
  getRestoreHistory,
  getRestoreDetail,
  getRestoreSummary,
  downloadFile,
  getStatusColor,
  getStatusLabel,
  getTypeLabel,
  getLocationLabel,
  getHealthColor,
  getHealthBgColor,
  getRestoreStatusColor,
  getRestoreTypeLabel,
  formatBytes,
  formatDuration,
};
