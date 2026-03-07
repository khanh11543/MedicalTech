import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import PageMeta from '../../components/common/PageMeta';
import Toast from '../../components/common/Toast';
import { useToast } from '../../hooks/useToast';
import Badge from '../../components/ui/badge/Badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from '../../components/ui/table';
import * as maintService from '../../services/maintenanceService';
import type {
  DatabaseHealth,
  CacheStats,
  CleanupPreview,
  DiskUsage,
  DuplicateFile,
  OptimizationLog,
} from '../../services/maintenanceService';

type Tab = 'database' | 'cache' | 'cleanup' | 'filesystem' | 'history';

const SystemOptimization: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast, showToast, dismissToast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('database');
  const [historyPage, setHistoryPage] = useState(0);

  // Cleanup form
  const [cleanupTypes, setCleanupTypes] = useState<string[]>(['audit_logs']);
  const [cleanupBefore, setCleanupBefore] = useState('');
  const [cleanupPreview, setCleanupPreview] = useState<CleanupPreview | null>(null);

  // ==================== QUERIES ====================
  const { data: dbHealth, isLoading: dbLoading, refetch: refetchDb } = useQuery<DatabaseHealth>({
    queryKey: ['db-health'],
    queryFn: maintService.getDatabaseHealth,
    enabled: activeTab === 'database',
  });

  const { data: cacheStats, isLoading: cacheLoading, refetch: refetchCache } = useQuery<CacheStats>({
    queryKey: ['cache-stats'],
    queryFn: maintService.getCacheStats,
    enabled: activeTab === 'cache',
  });

  const { data: diskUsage, isLoading: diskLoading } = useQuery<DiskUsage>({
    queryKey: ['disk-usage'],
    queryFn: maintService.getDiskUsage,
    enabled: activeTab === 'filesystem',
  });

  const { data: duplicates, isLoading: dupsLoading } = useQuery<DuplicateFile[]>({
    queryKey: ['duplicate-files'],
    queryFn: maintService.findDuplicateFiles,
    enabled: activeTab === 'filesystem',
  });

  const { data: optHistory, isLoading: optHistLoading } = useQuery({
    queryKey: ['optimization-history', historyPage],
    queryFn: () =>
      maintService.getOptimizationHistory({
        pageNumber: historyPage,
        pageSize: 10,
        sortBy: 'startedAt',
        sortDir: 'DESC',
      }),
    enabled: activeTab === 'history',
  });

  // ==================== MUTATIONS ====================
  const defragMutation = useMutation({
    mutationFn: maintService.defragmentDatabase,
    onSuccess: (data) => {
      showToast(`Defragmentation complete! ${data.message || 'Success'}`, 'success');
      queryClient.invalidateQueries({ queryKey: ['db-health'] });
    },
    onError: (err: any) => showToast(err?.response?.data?.message || 'Defragmentation failed', 'error'),
  });

  const rebuildIdxMutation = useMutation({
    mutationFn: maintService.rebuildIndexes,
    onSuccess: (data) => {
      showToast(`Index rebuild complete! ${data.message || 'Success'}`, 'success');
      queryClient.invalidateQueries({ queryKey: ['db-health'] });
    },
    onError: (err: any) => showToast(err?.response?.data?.message || 'Failed to rebuild indexes', 'error'),
  });

  const cleanOrphansMutation = useMutation({
    mutationFn: maintService.cleanOrphans,
    onSuccess: (data) => {
      showToast(`Orphaned records cleaned! ${data.message || 'Success'}`, 'success');
      queryClient.invalidateQueries({ queryKey: ['db-health'] });
    },
    onError: (err: any) => showToast(err?.response?.data?.message || 'Failed to clean orphans', 'error'),
  });

  const vacuumMutation = useMutation({
    mutationFn: maintService.vacuumDatabase,
    onSuccess: (data) => {
      showToast(`Vacuum complete! ${data.message || 'Success'}`, 'success');
      queryClient.invalidateQueries({ queryKey: ['db-health'] });
    },
    onError: (err: any) => showToast(err?.response?.data?.message || 'Vacuum failed', 'error'),
  });

  const clearCacheMutation = useMutation({
    mutationFn: (cacheType?: string) => maintService.clearCache(cacheType),
    onSuccess: () => {
      showToast('Cache cleared successfully!', 'success');
      refetchCache();
    },
    onError: (err: any) => showToast(err?.response?.data?.message || 'Failed to clear cache', 'error'),
  });

  const previewMutation = useMutation({
    mutationFn: () =>
      maintService.previewCleanup({ dataTypes: cleanupTypes, beforeDate: cleanupBefore || undefined }),
    onSuccess: (data) => setCleanupPreview(data),
    onError: (err: any) => showToast(err?.response?.data?.message || 'Preview failed', 'error'),
  });

  const executeCleanupMutation = useMutation({
    mutationFn: () =>
      maintService.executeCleanup({ dataTypes: cleanupTypes, beforeDate: cleanupBefore || undefined }),
    onSuccess: (data) => {
      showToast(`Cleanup complete! ${data.message || 'Success'}`, 'success');
      setCleanupPreview(null);
    },
    onError: (err: any) => showToast(err?.response?.data?.message || 'Cleanup failed', 'error'),
  });

  const archiveLogsMutation = useMutation({
    mutationFn: maintService.archiveLogs,
    onSuccess: (data) => {
      showToast(`Logs archived! ${data.message || 'Success'}`, 'success');
    },
    onError: (err: any) => showToast(err?.response?.data?.message || 'Failed to archive logs', 'error'),
  });

  const isAnyDbRunning =
    defragMutation.isPending || rebuildIdxMutation.isPending || cleanOrphansMutation.isPending || vacuumMutation.isPending;

  // ==================== TAB: DATABASE ====================
  const renderDatabase = () => (
    <div className="space-y-6">
      {/* Health Score */}
      <ComponentCard title="Database Health">
        {dbLoading ? (
          <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">Loading...</p>
        ) : dbHealth ? (
          <div className="space-y-6">
            {/* Score + Status Row */}
            <div className="flex items-center gap-6">
              <div
                className={`flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full ${maintService.getHealthScoreBg(dbHealth.healthScore)}`}
              >
                <span className={`text-3xl font-bold ${maintService.getHealthScoreColor(dbHealth.healthScore)}`}>
                  {dbHealth.healthScore}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                  Health Score: {dbHealth.healthScore}/100
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Status: <strong>{dbHealth.status}</strong> &middot; Size: {maintService.formatBytes(dbHealth.totalSizeBytes || 0)} &middot;
                  Tables: {dbHealth.tableCount || 0}
                </p>
                {/* Recommendations */}
                {dbHealth.recommendations && dbHealth.recommendations.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {dbHealth.recommendations.map((rec, i) => (
                      <p key={i} className="text-xs text-yellow-700 dark:text-yellow-400">
                        {rec}
                      </p>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => refetchDb()}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Refresh
              </button>
            </div>

            {/* Table Stats */}
            {dbHealth.tableStats && dbHealth.tableStats.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Table Statistics</h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableCell isHeader>Table</TableCell>
                        <TableCell isHeader>Rows</TableCell>
                        <TableCell isHeader>Size</TableCell>
                        <TableCell isHeader>Index Size</TableCell>
                        <TableCell isHeader>Fragmentation</TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dbHealth.tableStats.map((t) => (
                        <TableRow key={t.tableName}>
                          <TableCell>
                            <span className="font-mono text-sm">{t.tableName}</span>
                          </TableCell>
                          <TableCell>{t.rowCount?.toLocaleString()}</TableCell>
                          <TableCell>{maintService.formatBytes(t.dataSizeBytes || 0)}</TableCell>
                          <TableCell>{maintService.formatBytes(t.indexSizeBytes || 0)}</TableCell>
                          <TableCell>
                            <span className={maintService.getFragmentationColor(t.fragmentationPercent || 0)}>
                              {(t.fragmentationPercent || 0).toFixed(1)}%
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Fragmentation Details */}
            {dbHealth.fragmentationDetails && dbHealth.fragmentationDetails.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Fragmentation Details
                </h4>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {dbHealth.fragmentationDetails.map((frag) => (
                    <div
                      key={frag.tableName}
                      className="rounded-lg border border-gray-200 p-3 dark:border-gray-600"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm text-gray-800 dark:text-white">
                          {frag.tableName}
                        </span>
                        <span
                          className={`text-sm font-bold ${maintService.getFragmentationColor(frag.fragmentationPercent)}`}
                        >
                          {frag.fragmentationPercent.toFixed(1)}%
                        </span>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                          className={`h-full rounded-full transition-all ${
                            frag.fragmentationPercent > 50
                              ? 'bg-red-500'
                              : frag.fragmentationPercent > 20
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(100, frag.fragmentationPercent)}%` }}
                        />
                      </div>
                      {frag.recommendation && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{frag.recommendation}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </ComponentCard>

      {/* Optimization Actions */}
      <ComponentCard title="Database Optimization Actions">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            {
              title: 'Defragment Tables',
              desc: 'Reorganize table data to reduce fragmentation',
              icon: '',
              mutation: defragMutation,
              color: 'bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-600',
            },
            {
              title: 'Rebuild Indexes',
              desc: 'Rebuild all database indexes for better query performance',
              icon: '',
              mutation: rebuildIdxMutation,
              color: 'bg-purple-50 border-purple-200 dark:bg-purple-500/10 dark:border-purple-600',
            },
            {
              title: 'Clean Orphaned Records',
              desc: 'Remove orphaned references and dangling data',
              icon: '',
              mutation: cleanOrphansMutation,
              color: 'bg-orange-50 border-orange-200 dark:bg-orange-500/10 dark:border-orange-600',
            },
            {
              title: 'Vacuum Database',
              desc: 'Reclaim unused space and optimize storage',
              icon: '',
              mutation: vacuumMutation,
              color: 'bg-green-50 border-green-200 dark:bg-green-500/10 dark:border-green-600',
            },
          ].map((action) => (
            <div key={action.title} className={`rounded-xl border p-4 ${action.color}`}>
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-white">
                    {action.icon} {action.title}
                  </h4>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{action.desc}</p>
                </div>
              </div>
              <div className="mt-3">
                {action.mutation.isSuccess && action.mutation.data && (
                  <p className="mb-2 text-xs text-green-600 dark:text-green-400">
                    {action.mutation.data.message || 'Completed'}{' '}
                    {action.mutation.data.duration ? `(${maintService.formatDuration(action.mutation.data.duration)})` : ''}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Run ${action.title}? This may take a while.`)) {
                      action.mutation.mutate();
                    }
                  }}
                  disabled={isAnyDbRunning}
                  className="w-full rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  {action.mutation.isPending ? 'Running...' : `Run ${action.title}`}
                </button>
              </div>
            </div>
          ))}
        </div>
      </ComponentCard>
    </div>
  );

  // ==================== TAB: CACHE ====================
  const renderCache = () => (
    <div className="space-y-6">
      <ComponentCard title="Cache Statistics">
        {cacheLoading ? (
          <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">Loading...</p>
        ) : cacheStats ? (
          <div className="space-y-5">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: 'Total Size', value: maintService.formatBytes(cacheStats.totalSizeBytes || 0), color: 'bg-blue-50 dark:bg-blue-500/10' },
                { label: 'Hit Rate', value: `${(cacheStats.hitRate || 0).toFixed(1)}%`, color: 'bg-green-50 dark:bg-green-500/10' },
                { label: 'Total Entries', value: cacheStats.totalEntries?.toLocaleString() || '0', color: 'bg-purple-50 dark:bg-purple-500/10' },
                { label: 'Evictions', value: cacheStats.evictionCount?.toLocaleString() || '0', color: 'bg-orange-50 dark:bg-orange-500/10' },
              ].map((stat) => (
                <div key={stat.label} className={`rounded-xl p-4 ${stat.color}`}>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                  <p className="mt-1 text-xl font-bold text-gray-800 dark:text-white">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Cache Types */}
            {cacheStats.caches && cacheStats.caches.length > 0 && (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Cache Types</h4>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Clear ALL caches?')) clearCacheMutation.mutate(undefined);
                    }}
                    disabled={clearCacheMutation.isPending}
                    className="rounded-lg bg-red-500 px-4 py-1.5 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50"
                  >
                    {clearCacheMutation.isPending ? 'Clearing...' : 'Clear All Caches'}
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableCell isHeader>Cache Name</TableCell>
                        <TableCell isHeader>Entries</TableCell>
                        <TableCell isHeader>Size</TableCell>
                        <TableCell isHeader>Hit Rate</TableCell>
                        <TableCell isHeader>Actions</TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cacheStats.caches.map((cache) => (
                        <TableRow key={cache.name}>
                          <TableCell>
                            <span className="font-medium text-gray-800 dark:text-white">
                              {cache.name}
                            </span>
                          </TableCell>
                          <TableCell>{cache.entryCount?.toLocaleString()}</TableCell>
                          <TableCell>{maintService.formatBytes(cache.sizeBytes || 0)}</TableCell>
                          <TableCell>
                            <span
                              className={
                                (cache.hitRate || 0) >= 80
                                  ? 'text-green-600'
                                  : (cache.hitRate || 0) >= 50
                                  ? 'text-yellow-600'
                                  : 'text-red-600'
                              }
                            >
                              {(cache.hitRate || 0).toFixed(1)}%
                            </span>
                          </TableCell>
                          <TableCell>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Clear ${cache.name} cache?`))
                                  clearCacheMutation.mutate(cache.name);
                              }}
                              className="text-xs text-red-500 hover:underline"
                            >
                              Clear
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => refetchCache()}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Refresh
              </button>
            </div>
          </div>
        ) : null}
      </ComponentCard>
    </div>
  );

  // ==================== TAB: CLEANUP ====================
  const allCleanupTypes = [
    { id: 'audit_logs', label: 'Audit Logs', icon: '' },
    { id: 'notifications', label: 'Notifications', icon: '' },
    { id: 'sessions', label: 'Sessions', icon: '' },
    { id: 'login_attempts', label: 'Login Attempts', icon: '' },
    { id: 'temp_files', label: 'Temporary Files', icon: '' },
    { id: 'expired_tokens', label: 'Expired Tokens', icon: '' },
  ];

  const renderCleanup = () => (
    <div className="space-y-6">
      <ComponentCard title="Clean Up Old Data">
        <div className="space-y-5">
          {/* Data Types */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Data Types to Clean
            </label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {allCleanupTypes.map((type) => {
                const selected = cleanupTypes.includes(type.id);
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() =>
                      setCleanupTypes((prev) =>
                        selected ? prev.filter((t) => t !== type.id) : [...prev, type.id]
                      )
                    }
                    className={`rounded-lg border-2 p-3 text-left text-sm transition-all ${
                      selected
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <span className="text-lg">{type.icon}</span>
                    <p className={`mt-1 font-medium ${selected ? 'text-brand-700 dark:text-brand-400' : 'text-gray-700 dark:text-gray-300'}`}>
                      {type.label}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Before Date */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Delete data before (optional)
            </label>
            <input
              type="date"
              value={cleanupBefore}
              onChange={(e) => setCleanupBefore(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white sm:w-64"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                if (cleanupTypes.length === 0) return showToast('Select at least one data type', 'error');
                previewMutation.mutate();
              }}
              disabled={previewMutation.isPending || cleanupTypes.length === 0}
              className="rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50"
            >
              {previewMutation.isPending ? 'Previewing...' : 'Preview'}
            </button>
          </div>

          {/* Preview Result */}
          {cleanupPreview && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-600 dark:bg-yellow-500/10">
              <h4 className="mb-3 text-sm font-bold text-yellow-800 dark:text-yellow-300">
                Cleanup Preview
              </h4>
              {cleanupPreview.items && cleanupPreview.items.length > 0 && (
                <div className="mb-3 space-y-2">
                  {cleanupPreview.items.map((item) => (
                    <div
                      key={item.dataType}
                      className="flex items-center justify-between rounded bg-white px-3 py-2 text-sm dark:bg-gray-800"
                    >
                      <span className="text-gray-700 dark:text-gray-300">{item.dataType}</span>
                      <div className="flex gap-4">
                        <span className="font-medium">{item.recordCount?.toLocaleString()} records</span>
                        <span className="text-gray-500">{maintService.formatBytes(item.sizeBytes || 0)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between border-t border-yellow-200 pt-3 dark:border-yellow-600">
                <div className="text-sm">
                  <strong>Total: {cleanupPreview.totalRecords?.toLocaleString()} records</strong>
                  <span className="ml-2 text-gray-500">
                    ({maintService.formatBytes(cleanupPreview.totalSizeBytes || 0)})
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCleanupPreview(null)}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete ${cleanupPreview.totalRecords?.toLocaleString()} records? This cannot be undone.`)) {
                        executeCleanupMutation.mutate();
                      }
                    }}
                    disabled={executeCleanupMutation.isPending}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {executeCleanupMutation.isPending ? 'Cleaning...' : 'Execute Cleanup'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </ComponentCard>
    </div>
  );

  // ==================== TAB: FILE SYSTEM ====================
  const renderFilesystem = () => (
    <div className="space-y-6">
      {/* Disk Usage */}
      <ComponentCard title="Disk Usage">
        {diskLoading ? (
          <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">Loading...</p>
        ) : diskUsage ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: 'Total Space', value: maintService.formatBytes(diskUsage.totalBytes || 0), color: 'bg-blue-50 dark:bg-blue-500/10' },
                { label: 'Used Space', value: maintService.formatBytes(diskUsage.usedBytes || 0), color: 'bg-orange-50 dark:bg-orange-500/10' },
                { label: 'Free Space', value: maintService.formatBytes(diskUsage.freeBytes || 0), color: 'bg-green-50 dark:bg-green-500/10' },
                { label: 'Usage', value: `${(diskUsage.usagePercent || 0).toFixed(1)}%`, color: 'bg-purple-50 dark:bg-purple-500/10' },
              ].map((stat) => (
                <div key={stat.label} className={`rounded-xl p-4 ${stat.color}`}>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                  <p className="mt-1 text-xl font-bold text-gray-800 dark:text-white">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Usage Bar */}
            <div>
              <div className="mb-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Used: {maintService.formatBytes(diskUsage.usedBytes || 0)}</span>
                <span>Free: {maintService.formatBytes(diskUsage.freeBytes || 0)}</span>
              </div>
              <div className="h-4 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className={`h-full rounded-full transition-all ${
                    (diskUsage.usagePercent || 0) > 90
                      ? 'bg-red-500'
                      : (diskUsage.usagePercent || 0) > 70
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(100, diskUsage.usagePercent || 0)}%` }}
                />
              </div>
            </div>

            {/* Breakdown */}
            {diskUsage.breakdown && Object.keys(diskUsage.breakdown).length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Storage Breakdown
                </h4>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {Object.entries(diskUsage.breakdown).map(([key, bytes]) => (
                    <div key={key} className="rounded-lg border border-gray-200 p-3 dark:border-gray-600">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{key}</p>
                      <p className="mt-1 text-sm font-bold text-gray-800 dark:text-white">
                        {maintService.formatBytes(bytes as number)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </ComponentCard>

      {/* Duplicate Files */}
      <ComponentCard title="Duplicate Files">
        {dupsLoading ? (
          <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">Scanning...</p>
        ) : !duplicates || duplicates.length === 0 ? (
          <div className="py-4 text-center">
            <p className="text-sm text-green-600 dark:text-green-400">No duplicate files found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader>File Name</TableCell>
                  <TableCell isHeader>Path</TableCell>
                  <TableCell isHeader>Size</TableCell>
                  <TableCell isHeader>Hash</TableCell>
                  <TableCell isHeader>Duplicates</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {duplicates.map((dup, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <span className="font-medium text-gray-800 dark:text-white">{dup.fileName}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-gray-500">{dup.filePath}</span>
                    </TableCell>
                    <TableCell>{maintService.formatBytes(dup.sizeBytes || 0)}</TableCell>
                    <TableCell>
                      <span className="font-mono text-xs">{dup.hash?.substring(0, 12)}...</span>
                    </TableCell>
                    <TableCell>
                      <Badge color="warning">{dup.duplicateCount}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </ComponentCard>

      {/* Archive Logs Action */}
      <ComponentCard title="Log Management">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-gray-800 dark:text-white">Archive Old Logs</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Compress and archive old log files to free up disk space
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (confirm('Archive old log files?')) archiveLogsMutation.mutate();
            }}
            disabled={archiveLogsMutation.isPending}
            className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {archiveLogsMutation.isPending ? 'Archiving...' : 'Archive Logs'}
          </button>
        </div>
        {archiveLogsMutation.isSuccess && archiveLogsMutation.data && (
          <p className="mt-2 text-sm text-green-600 dark:text-green-400">
            {archiveLogsMutation.data.message || 'Archived successfully'}
          </p>
        )}
      </ComponentCard>
    </div>
  );

  // ==================== TAB: HISTORY ====================
  const renderHistory = () => (
    <ComponentCard title="Optimization History">
      {optHistLoading ? (
        <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">Loading...</p>
      ) : !optHistory?.content?.length ? (
        <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
          No optimization history found
        </p>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader>Type</TableCell>
                  <TableCell isHeader>Status</TableCell>
                  <TableCell isHeader>Executed At</TableCell>
                  <TableCell isHeader>Duration</TableCell>
                  <TableCell isHeader>Details</TableCell>
                  <TableCell isHeader>Executed By</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {optHistory.content.map((log: OptimizationLog) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge color="primary">
                        {maintService.getOptimizationTypeLabel(log.optimizationType)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge color={maintService.getOptimizationStatusColor(log.status)}>
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {maintService.formatDateTime(log.startedAt)}
                    </TableCell>
                    <TableCell>{log.duration ? maintService.formatDuration(log.duration) : '-'}</TableCell>
                    <TableCell>
                      <span className="line-clamp-1 max-w-[200px] text-sm text-gray-600 dark:text-gray-400">
                        {log.details || log.message || '-'}
                      </span>
                    </TableCell>
                    <TableCell>{log.executedByName || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {optHistory.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Total: {optHistory.totalElements} records
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setHistoryPage((p) => Math.max(0, p - 1))}
                  disabled={historyPage === 0}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs disabled:opacity-40 dark:border-gray-600"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, optHistory.totalPages) }, (_, i) => {
                  const start = Math.max(0, Math.min(historyPage - 2, optHistory.totalPages - 5));
                  const page = start + i;
                  return (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setHistoryPage(page)}
                      className={`rounded-lg border px-3 py-1.5 text-xs ${
                        page === historyPage
                          ? 'border-brand-500 bg-brand-500 text-white'
                          : 'border-gray-300 hover:bg-gray-50 dark:border-gray-600'
                      }`}
                    >
                      {page + 1}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setHistoryPage((p) => Math.min(optHistory.totalPages - 1, p + 1))}
                  disabled={historyPage >= optHistory.totalPages - 1}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs disabled:opacity-40 dark:border-gray-600"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </ComponentCard>
  );

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'database', label: 'Database', icon: '' },
    { key: 'cache', label: 'Cache', icon: '' },
    { key: 'cleanup', label: 'Cleanup', icon: '' },
    { key: 'filesystem', label: 'File System', icon: '' },
    { key: 'history', label: 'History', icon: '' },
  ];

  return (
    <>
      <PageMeta title="System Optimization | MediTech Admin" />
      <PageBreadcrumb pageTitle="System Optimization" />

      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-brand-600 shadow-sm dark:bg-gray-700 dark:text-brand-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'database' && renderDatabase()}
        {activeTab === 'cache' && renderCache()}
        {activeTab === 'cleanup' && renderCleanup()}
        {activeTab === 'filesystem' && renderFilesystem()}
        {activeTab === 'history' && renderHistory()}
      </div>
      <Toast toast={toast} onDismiss={dismissToast} />
    </>
  );
};

export default SystemOptimization;
