import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Toast from "../../components/common/Toast";
import { useToast } from "../../hooks/useToast";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Badge from "../../components/ui/badge/Badge";
import * as backupService from '../../services/backupService';
import * as maintService from '../../services/maintenanceService';

export default function BackupMaintenance() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast, showToast, dismissToast } = useToast();

  // --- Fetch backup dashboard data (last backup, health, storage) ---
  const { data: dashboard, isLoading: dashLoading } = useQuery({
    queryKey: ['backup-dashboard'],
    queryFn: backupService.getDashboard,
    refetchInterval: 30000,
  });

  // --- Fetch recent backup history (latest 5) ---
  const { data: historyData, isLoading: histLoading } = useQuery({
    queryKey: ['backup-history-overview'],
    queryFn: () =>
      backupService.getHistory({
        pageNumber: 0,
        pageSize: 5,
        sortBy: 'startedAt',
        sortDir: 'DESC',
      }),
  });

  // --- Fetch backup schedules ---
  const { data: schedules } = useQuery({
    queryKey: ['backup-schedules'],
    queryFn: backupService.getSchedules,
  });

  // --- Fetch maintenance dashboard ---
  const { data: maintDashboard } = useQuery({
    queryKey: ['maintenance-dashboard'],
    queryFn: maintService.getMaintenanceDashboard,
    refetchInterval: 30000,
  });

  // --- Fetch database health ---
  const { data: dbHealth } = useQuery({
    queryKey: ['db-health'],
    queryFn: maintService.getDatabaseHealth,
  });

  // --- Mutations ---
  const clearCacheMutation = useMutation({
    mutationFn: () => maintService.clearCache(),
    onSuccess: () => {
      showToast('Cache cleared successfully!', 'success');
      queryClient.invalidateQueries({ queryKey: ['db-health'] });
    },
    onError: (err: any) => showToast(err?.response?.data?.message || 'Failed to clear cache', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => backupService.deleteBackup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backup-history-overview'] });
      queryClient.invalidateQueries({ queryKey: ['backup-dashboard'] });
      showToast('Backup deleted', 'success');
    },
    onError: (err: any) => showToast(err?.response?.data?.message || 'Delete failed', 'error'),
  });

  const handleDownload = async (record: backupService.BackupRecord) => {
    try {
      const blob = await backupService.downloadBackup(record.id);
      backupService.downloadFile(blob, `${record.backupName}.sql.gz`);
    } catch {
      showToast('Download failed', 'error');
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this backup?')) {
      deleteMutation.mutate(id);
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('vi-VN');
  };

  const isLoading = dashLoading || histLoading;
  const records = historyData?.content || [];

  // Determine system status from health + maintenance
  const healthStatus = dashboard?.health?.status || 'Unknown';
  const isMaintenanceActive = maintDashboard?.isMaintenanceActive || false;

  const getSystemStatusColor = () => {
    if (isMaintenanceActive) return 'text-yellow-500';
    if (healthStatus === 'HEALTHY') return 'text-green-500';
    if (healthStatus === 'WARNING') return 'text-yellow-500';
    return 'text-red-500';
  };

  const getSystemStatusLabel = () => {
    if (isMaintenanceActive) return 'Maintenance';
    if (healthStatus === 'HEALTHY') return 'Healthy';
    if (healthStatus === 'WARNING') return 'Warning';
    if (healthStatus === 'NO_BACKUP') return 'No Backup';
    return healthStatus;
  };

  const getSystemStatusBg = () => {
    if (isMaintenanceActive) return 'bg-yellow-100 dark:bg-yellow-500/20';
    if (healthStatus === 'HEALTHY') return 'bg-green-100 dark:bg-green-500/20';
    if (healthStatus === 'WARNING') return 'bg-yellow-100 dark:bg-yellow-500/20';
    return 'bg-red-100 dark:bg-red-500/20';
  };

  return (
    <>
      <PageMeta title="Backup & Maintenance | MediTech Admin" description="Manage system backups and maintenance" />
      <PageBreadcrumb pageTitle="Backup & Maintenance" />
      <div className="space-y-6">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-500 dark:text-gray-400">Loading backup & maintenance data...</span>
          </div>
        )}

        {/* Status Cards (real data from API) */}
        {!isLoading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* System Status */}
            <div className="p-6 bg-white rounded-xl border border-gray-200 dark:border-white/[0.05] dark:bg-white/[0.03]">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${getSystemStatusBg()}`}>
                  <svg className={`w-6 h-6 ${getSystemStatusColor()}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">System Status</p>
                  <h3 className={`text-lg font-bold ${getSystemStatusColor()}`}>{getSystemStatusLabel()}</h3>
                  <div className="flex gap-2 mt-1 text-xs text-gray-400">
                    <span className="text-green-500">{dashboard?.health?.completedCount || 0} OK</span>
                    <span className="text-red-500">{dashboard?.health?.failedCount || 0} Failed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Database Size */}
            <div className="p-6 bg-white rounded-xl border border-gray-200 dark:border-white/[0.05] dark:bg-white/[0.03]">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg dark:bg-blue-500/20">
                  <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Database Size</p>
                  <h3 className="text-lg font-bold text-blue-500">
                    {dbHealth ? maintService.formatBytes(dbHealth.totalSize || 0) : dashboard?.storageInfo?.totalBackupSizeFormatted || '—'}
                  </h3>
                  {dbHealth && (
                    <p className="text-xs text-gray-400 mt-1">
                      {dbHealth.tableCount || 0} tables · Score: {dbHealth.healthScore}/100
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Last Backup */}
            <div className="p-6 bg-white rounded-xl border border-gray-200 dark:border-white/[0.05] dark:bg-white/[0.03]">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg dark:bg-purple-500/20">
                  <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Last Backup</p>
                  {dashboard?.lastBackup ? (
                    <>
                      <p className="text-sm font-bold text-purple-500 truncate">{dashboard.lastBackup.backupName}</p>
                      <p className="text-xs text-gray-400">
                        {dashboard.lastBackup.sizeFormatted} · {formatDate(dashboard.lastBackup.completedAt)}
                      </p>
                    </>
                  ) : (
                    <h3 className="text-lg font-bold text-gray-400">No backup yet</h3>
                  )}
                </div>
              </div>
            </div>

            {/* Storage Used */}
            <div className="p-6 bg-white rounded-xl border border-gray-200 dark:border-white/[0.05] dark:bg-white/[0.03]">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-lg dark:bg-yellow-500/20">
                  <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Storage Used</p>
                  <h3 className="text-lg font-bold text-yellow-500">
                    {dashboard?.storageInfo?.usagePercent != null
                      ? `${dashboard.storageInfo.usagePercent.toFixed(1)}%`
                      : '—'}
                  </h3>
                  {dashboard?.storageInfo && (
                    <p className="text-xs text-gray-400 mt-1">
                      {backupService.formatBytes(dashboard.storageInfo.totalBackupSize)} of {backupService.formatBytes(dashboard.storageInfo.totalSpace)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Backup Schedules (real data from API) */}
        <ComponentCard title="Backup Schedules">
          {!schedules || schedules.length === 0 ? (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              <p>No backup schedules configured.</p>
              <button
                onClick={() => navigate('/backup-dashboard')}
                className="mt-2 text-sm text-blue-500 hover:underline"
              >
                Go to Backup Dashboard to create one →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {schedules.map((schedule: backupService.BackupSchedule) => (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg"
                >
                  <div>
                    <h4 className="font-medium text-gray-800 dark:text-white/90">{schedule.name}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {backupService.getTypeLabel(schedule.backupType)} · Cron: {schedule.cronExpression} · Retention: {schedule.retentionDays} days
                    </p>
                  </div>
                  <Badge size="sm" color={schedule.enabled ? 'success' : 'error'}>
                    {schedule.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </ComponentCard>

        {/* Backup History (real data from API) */}
        <ComponentCard title={`Recent Backups${historyData ? ` (${historyData.totalElements} total)` : ''}`}>
          {histLoading ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
              Loading backup history...
            </div>
          ) : records.length === 0 ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              No backup records found.
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                <div className="max-w-full overflow-x-auto">
                  <Table>
                    <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                      <TableRow>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                          Backup Name
                        </TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                          Type
                        </TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                          Size
                        </TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                          Created At
                        </TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                          Status
                        </TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHeader>

                    <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                      {records.map((backup) => (
                        <TableRow key={backup.id}>
                          <TableCell className="px-5 py-4 sm:px-6 text-start">
                            <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                              {backup.backupName}
                            </span>
                            {backup.encrypted && <span className="ml-1 text-xs text-yellow-600"></span>}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                            {backupService.getTypeLabel(backup.backupType)}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                            {backup.sizeFormatted || backupService.formatBytes(backup.size || 0)}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                            {formatDate(backup.startedAt || backup.createdAt)}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-start">
                            <Badge
                              size="sm"
                              color={backupService.getStatusColor(backup.status)}
                            >
                              {backupService.getStatusLabel(backup.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-start">
                            <div className="flex items-center gap-2">
                              {backup.status === 'COMPLETED' && (
                                <>
                                  <button
                                    onClick={() => handleDownload(backup)}
                                    className="px-3 py-1.5 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
                                  >
                                    Download
                                  </button>
                                  <button
                                    onClick={() => navigate('/restore-backup')}
                                    className="px-3 py-1.5 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
                                  >
                                    Restore
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleDelete(backup.id)}
                                disabled={deleteMutation.isPending}
                                className="px-3 py-1.5 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                              >
                                Delete
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              {historyData && historyData.totalElements > 5 && (
                <div className="mt-3 text-center">
                  <button
                    onClick={() => navigate('/backup-history')}
                    className="text-sm text-blue-500 hover:underline"
                  >
                    View all {historyData.totalElements} backup records →
                  </button>
                </div>
              )}
            </>
          )}
        </ComponentCard>

        {/* Maintenance Actions (functional buttons linked to API) */}
        <ComponentCard title="Maintenance Actions">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <button
              onClick={() => navigate('/manual-backup')}
              className="p-6 bg-gray-50 dark:bg-white/[0.03] rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg dark:bg-blue-500/20">
                  <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-white/90">Run Backup Now</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Start a manual backup</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/system-optimization')}
              className="p-6 bg-gray-50 dark:bg-white/[0.03] rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg dark:bg-green-500/20">
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>No activity logs yet. Run a backup or maintenance task to see logs here.</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-white/90">Health Check</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    DB Score: {dbHealth ? `${dbHealth.healthScore}/100` : '—'}
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                if (confirm('Clear all system caches?')) clearCacheMutation.mutate();
              }}
              disabled={clearCacheMutation.isPending}
              className="p-6 bg-gray-50 dark:bg-white/[0.03] rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors text-left disabled:opacity-50"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-lg dark:bg-yellow-500/20">
                  <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-white/90">
                    {clearCacheMutation.isPending ? 'Clearing...' : 'Clear Cache'}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Clear system cache files</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/system-optimization')}
              className="p-6 bg-gray-50 dark:bg-white/[0.03] rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg dark:bg-purple-500/20">
                  <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-white/90">Optimize Database</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Optimize tables and indexes</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/restore-backup')}
              className="p-6 bg-gray-50 dark:bg-white/[0.03] rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 rounded-lg dark:bg-red-500/20">
                  <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-white/90">Restore Backup</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Restore from backup file</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/scheduled-maintenance')}
              className="p-6 bg-gray-50 dark:bg-white/[0.03] rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-100 rounded-lg dark:bg-indigo-500/20">
                  <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-white/90">Scheduled Maintenance</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {isMaintenanceActive ? 'Maintenance Active' : `${maintDashboard?.stats?.totalScheduled || 0} scheduled`}
                  </p>
                </div>
              </div>
            </button>
          </div>
        </ComponentCard>
      </div>
      <Toast toast={toast} onDismiss={dismissToast} />
    </>
  );
}
