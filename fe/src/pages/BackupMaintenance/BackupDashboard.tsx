import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import PageMeta from '../../components/common/PageMeta';
import Badge from '../../components/ui/badge/Badge';
import * as backupService from '../../services/backupService';
import type {
  BackupDashboard as BackupDashboardType,
  ManualBackupRequest,
  BackupSchedule,
  BackupProgress,
  BackupType,
  StorageLocation,
} from '../../services/backupService';

const BackupDashboardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [activeBackupId, setActiveBackupId] = useState<number | null>(null);
  const [backupForm, setBackupForm] = useState<ManualBackupRequest>({
    backupName: '',
    backupType: 'FULL',
    includes: [],
    storageLocation: 'LOCAL',
    encrypted: false,
  });
  const [scheduleForm, setScheduleForm] = useState<BackupSchedule>({
    name: '',
    backupType: 'FULL',
    cronExpression: '0 2 * * *',
    storageLocation: 'LOCAL',
    retentionDays: 30,
    encrypted: false,
    includes: '',
    enabled: true,
    maxBackups: 10,
  });

  // Queries
  const { data: dashboard, isLoading, error } = useQuery({
    queryKey: ['backup-dashboard'],
    queryFn: backupService.getDashboard,
    refetchInterval: activeBackupId ? 5000 : 30000,
  });

  const { data: schedules } = useQuery({
    queryKey: ['backup-schedules'],
    queryFn: backupService.getSchedules,
  });

  const { data: progress } = useQuery({
    queryKey: ['backup-progress', activeBackupId],
    queryFn: () => backupService.getProgress(activeBackupId!),
    enabled: !!activeBackupId,
    refetchInterval: 2000,
  });

  // Mutations
  const runBackupMutation = useMutation({
    mutationFn: (request: ManualBackupRequest) =>
      backupService.runManualBackup(request),
    onSuccess: (data) => {
      setActiveBackupId(data.id);
      setShowBackupModal(false);
      queryClient.invalidateQueries({ queryKey: ['backup-dashboard'] });
      alert('Backup started successfully!');
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Failed to start backup');
    },
  });

  const createScheduleMutation = useMutation({
    mutationFn: (schedule: BackupSchedule) =>
      backupService.createSchedule(schedule),
    onSuccess: () => {
      setShowScheduleModal(false);
      queryClient.invalidateQueries({ queryKey: ['backup-schedules'] });
      alert('Schedule created successfully!');
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Failed to create schedule');
    },
  });

  const toggleScheduleMutation = useMutation({
    mutationFn: (id: number) => backupService.toggleSchedule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backup-schedules'] });
    },
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: (id: number) => backupService.deleteSchedule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backup-schedules'] });
    },
  });

  const cancelBackupMutation = useMutation({
    mutationFn: (id: number) => backupService.cancelBackup(id),
    onSuccess: () => {
      setActiveBackupId(null);
      queryClient.invalidateQueries({ queryKey: ['backup-dashboard'] });
    },
  });

  const handleRunBackup = () => {
    if (!backupForm.backupName.trim()) {
      alert('Please enter a backup name');
      return;
    }
    runBackupMutation.mutate(backupForm);
  };

  const handleCreateSchedule = () => {
    if (!scheduleForm.name.trim()) {
      alert('Please enter a schedule name');
      return;
    }
    createScheduleMutation.mutate(scheduleForm);
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('vi-VN');
  };

  if (isLoading) {
    return (
      <>
        <PageMeta title="Backup Dashboard | MedicalTech" description="" />
        <PageBreadcrumb pageTitle="Backup Dashboard" />
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-500">Loading dashboard...</span>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title="Backup Dashboard | MedicalTech"
        description="Backup management dashboard"
      />
      <PageBreadcrumb pageTitle="Backup Dashboard" />

      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="font-bold">Error loading dashboard</p>
            <p className="text-sm">{(error as any)?.response?.data?.message || (error as any)?.message || 'Unknown error'}</p>
          </div>
        )}

        {/* Active Backup Progress */}
        {activeBackupId && progress && (
          <div className="p-5 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                <h3 className="font-semibold text-blue-700 dark:text-blue-300">
                  Backup in Progress: {progress.backupName}
                </h3>
              </div>
              <button
                onClick={() => {
                  if (confirm('Cancel this backup?')) cancelBackupMutation.mutate(activeBackupId);
                }}
                className="px-3 py-1 text-sm text-red-600 bg-red-100 rounded-lg hover:bg-red-200"
              >
                Cancel
              </button>
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-3 mb-2">
              <div
                className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress.progressPercent || 0}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-blue-600 dark:text-blue-400">
              <span>{progress.currentStep || 'Initializing...'}</span>
              <span>{progress.progressPercent || 0}%</span>
            </div>
            {progress.status === 'COMPLETED' && (
              <div className="mt-2 text-green-600 font-medium">
                Backup completed successfully!
                <button
                  className="ml-3 text-blue-600 underline"
                  onClick={() => setActiveBackupId(null)}
                >
                  Dismiss
                </button>
              </div>
            )}
            {progress.status === 'FAILED' && (
              <div className="mt-2 text-red-600 font-medium">
                Backup failed: {progress.errorMessage}
                <button
                  className="ml-3 text-blue-600 underline"
                  onClick={() => setActiveBackupId(null)}
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        )}

        {/* ===== STATUS CARDS ===== */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* Last Backup */}
          <div className="p-5 bg-white rounded-xl border border-gray-200 dark:border-white/[0.05] dark:bg-white/[0.03]">
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
                    <p className="text-sm font-bold text-gray-800 dark:text-white/90 truncate">
                      {dashboard.lastBackup.backupName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {backupService.getTypeLabel(dashboard.lastBackup.backupType)} · {dashboard.lastBackup.sizeFormatted || backupService.formatBytes(dashboard.lastBackup.size || 0)}
                    </p>
                    <p className="text-xs text-gray-400">{formatDate(dashboard.lastBackup.completedAt)}</p>
                  </>
                ) : (
                  <p className="text-sm font-bold text-gray-400">No backup yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Next Scheduled */}
          <div className="p-5 bg-white rounded-xl border border-gray-200 dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg dark:bg-blue-500/20">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">Next Scheduled</p>
                {dashboard?.nextScheduled ? (
                  <>
                    <p className="text-sm font-bold text-gray-800 dark:text-white/90 truncate">
                      {dashboard.nextScheduled.scheduleName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {backupService.getTypeLabel(dashboard.nextScheduled.backupType)}
                    </p>
                    <p className="text-xs text-gray-400">{formatDate(dashboard.nextScheduled.nextRunAt)}</p>
                  </>
                ) : (
                  <p className="text-sm font-bold text-gray-400">No schedule</p>
                )}
              </div>
            </div>
          </div>

          {/* Health Status */}
          <div className="p-5 bg-white rounded-xl border border-gray-200 dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${backupService.getHealthBgColor(dashboard?.health?.status || '')}`}>
                <svg className={`w-6 h-6 ${backupService.getHealthColor(dashboard?.health?.status || '')}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Health Status</p>
                <p className={`text-lg font-bold ${backupService.getHealthColor(dashboard?.health?.status || '')}`}>
                  {dashboard?.health?.status || 'Unknown'}
                </p>
                <div className="flex gap-3 text-xs text-gray-400">
                  <span className="text-green-500">{dashboard?.health?.completedCount || 0} OK</span>
                  <span className="text-red-500">{dashboard?.health?.failedCount || 0} Failed</span>
                  <span className="text-yellow-500">{dashboard?.health?.inProgressCount || 0} Running</span>
                </div>
              </div>
            </div>
          </div>

          {/* Storage */}
          <div className="p-5 bg-white rounded-xl border border-gray-200 dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg dark:bg-yellow-500/20">
                <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">Storage</p>
                <p className="text-lg font-bold text-yellow-500">
                  {dashboard?.storageInfo?.usagePercent ?? 0}% Used
                </p>
                <p className="text-xs text-gray-400">
                  {dashboard?.storageInfo?.totalBackupSizeFormatted || '0 B'} / {backupService.formatBytes(dashboard?.storageInfo?.totalSpace || 0)}
                </p>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                  <div
                    className={`h-1.5 rounded-full ${
                      (dashboard?.storageInfo?.usagePercent || 0) > 80
                        ? 'bg-red-500'
                        : (dashboard?.storageInfo?.usagePercent || 0) > 60
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(dashboard?.storageInfo?.usagePercent || 0, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== QUICK ACTIONS ===== */}
        <ComponentCard title="Quick Actions">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <button
              onClick={() => setShowBackupModal(true)}
              className="p-5 bg-gray-50 dark:bg-white/[0.03] rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg dark:bg-blue-500/20 group-hover:bg-blue-200">
                  <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-white/90">Run Backup Now</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Start immediate backup</p>
                </div>
              </div>
            </button>

            <a
              href="/backup-history"
              className="p-5 bg-gray-50 dark:bg-white/[0.03] rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors text-left group block"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg dark:bg-green-500/20 group-hover:bg-green-200">
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-white/90">View History</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Browse backup records</p>
                </div>
              </div>
            </a>

            <button
              onClick={() => setShowScheduleModal(true)}
              className="p-5 bg-gray-50 dark:bg-white/[0.03] rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg dark:bg-purple-500/20 group-hover:bg-purple-200">
                  <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-white/90">Configure</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Manage backup schedules</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => alert('Test restore: Navigate to History, select a backup, and click "Test Restore"')}
              className="p-5 bg-gray-50 dark:bg-white/[0.03] rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-lg dark:bg-orange-500/20 group-hover:bg-orange-200">
                  <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-white/90">Test Restore</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Verify backup integrity</p>
                </div>
              </div>
            </button>
          </div>
        </ComponentCard>

        {/* ===== SCHEDULES TABLE ===== */}
        <ComponentCard title="Backup Schedules">
          <div className="overflow-x-auto">
            {schedules && schedules.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-white/[0.05]">
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Type</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Cron</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Location</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Retention</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {schedules.map((schedule) => (
                    <tr key={schedule.id}>
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-white/90">{schedule.name}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                        {backupService.getTypeLabel(schedule.backupType)}
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          {schedule.cronExpression}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                        {backupService.getLocationLabel(schedule.storageLocation)}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{schedule.retentionDays} days</td>
                      <td className="px-4 py-3">
                        <Badge size="sm" color={schedule.enabled ? 'success' : 'light'}>
                          {schedule.enabled ? 'Active' : 'Disabled'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => schedule.id && toggleScheduleMutation.mutate(schedule.id)}
                            className={`px-2 py-1 text-xs rounded ${
                              schedule.enabled
                                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {schedule.enabled ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Delete this schedule?') && schedule.id) {
                                deleteScheduleMutation.mutate(schedule.id);
                              }
                            }}
                            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                No schedules configured.
                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="ml-2 text-blue-500 hover:underline"
                >
                  Create one
                </button>
              </div>
            )}
          </div>
        </ComponentCard>

        {/* ===== STORAGE INFO CARD ===== */}
        {dashboard?.storageInfo && (
          <ComponentCard title="Storage Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                <p className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  {backupService.getLocationLabel(dashboard.storageInfo.location || 'LOCAL')}
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Backup Size</p>
                <p className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  {dashboard.storageInfo.totalBackupSizeFormatted || backupService.formatBytes(dashboard.storageInfo.totalBackupSize || 0)}
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Space</p>
                <p className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  {backupService.formatBytes(dashboard.storageInfo.totalSpace || 0)}
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Free Space</p>
                <p className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  {backupService.formatBytes(dashboard.storageInfo.freeSpace || 0)}
                </p>
              </div>
            </div>
          </ComponentCard>
        )}
      </div>

      {/* ===== MANUAL BACKUP MODAL ===== */}
      {showBackupModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Run Manual Backup</h3>
                <button onClick={() => setShowBackupModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Backup Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={backupForm.backupName}
                  onChange={(e) => setBackupForm({ ...backupForm, backupName: e.target.value })}
                  placeholder="e.g., manual_backup_20260217"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Backup Type</label>
                <select
                  value={backupForm.backupType}
                  onChange={(e) => setBackupForm({ ...backupForm, backupType: e.target.value as BackupType })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                >
                  <option value="FULL">Full Backup</option>
                  <option value="INCREMENTAL">Incremental</option>
                  <option value="DIFFERENTIAL">Differential</option>
                  <option value="MANUAL">Manual</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Storage Location
                </label>
                <select
                  value={backupForm.storageLocation}
                  onChange={(e) => setBackupForm({ ...backupForm, storageLocation: e.target.value as StorageLocation })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                >
                  <option value="LOCAL">Local Storage</option>
                  <option value="CLOUD">Cloud Storage</option>
                  <option value="EXTERNAL">External Storage</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="encrypted"
                  checked={backupForm.encrypted}
                  onChange={(e) => setBackupForm({ ...backupForm, encrypted: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="encrypted" className="text-sm text-gray-700 dark:text-gray-300">
                  Encrypt backup file
                </label>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setShowBackupModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleRunBackup}
                disabled={runBackupMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {runBackupMutation.isPending ? 'Starting...' : 'Start Backup'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== SCHEDULE MODAL ===== */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Create Backup Schedule</h3>
                <button onClick={() => setShowScheduleModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Schedule Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={scheduleForm.name}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, name: e.target.value })}
                  placeholder="e.g., Daily Full Backup"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                  <select
                    value={scheduleForm.backupType}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, backupType: e.target.value as BackupType })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                  >
                    <option value="FULL">Full</option>
                    <option value="INCREMENTAL">Incremental</option>
                    <option value="DIFFERENTIAL">Differential</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                  <select
                    value={scheduleForm.storageLocation}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, storageLocation: e.target.value as StorageLocation })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                  >
                    <option value="LOCAL">Local</option>
                    <option value="CLOUD">Cloud</option>
                    <option value="EXTERNAL">External</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cron Expression
                </label>
                <input
                  type="text"
                  value={scheduleForm.cronExpression}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, cronExpression: e.target.value })}
                  placeholder="0 2 * * *"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-mono dark:bg-gray-800 dark:text-white"
                />
                <p className="text-xs text-gray-400 mt-1">Default: 0 2 * * * (daily at 2:00 AM)</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Retention (days)
                  </label>
                  <input
                    type="number"
                    value={scheduleForm.retentionDays}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, retentionDays: parseInt(e.target.value) || 30 })}
                    min={1}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Backups
                  </label>
                  <input
                    type="number"
                    value={scheduleForm.maxBackups}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, maxBackups: parseInt(e.target.value) || 10 })}
                    min={1}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="schedule-encrypted"
                  checked={scheduleForm.encrypted}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, encrypted: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="schedule-encrypted" className="text-sm text-gray-700 dark:text-gray-300">
                  Encrypt backups
                </label>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSchedule}
                disabled={createScheduleMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {createScheduleMutation.isPending ? 'Creating...' : 'Create Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BackupDashboardPage;
