import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import PageMeta from '../../components/common/PageMeta';
import Badge from '../../components/ui/badge/Badge';
import * as backupService from '../../services/backupService';
import type {
  BackupRecord,
  BackupFilterParams,
  BackupType,
  BackupStatus,
  StorageLocation,
} from '../../services/backupService';

const BackupHistory: React.FC = () => {
  const queryClient = useQueryClient();

  // Filter state
  const [filters, setFilters] = useState<{
    type: string;
    status: string;
    location: string;
    startDate: string;
    endDate: string;
  }>({
    type: '',
    status: '',
    location: '',
    startDate: '',
    endDate: '',
  });

  // Pagination
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  // Detail modal
  const [selectedBackup, setSelectedBackup] = useState<BackupRecord | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Verify result
  const [verifyResult, setVerifyResult] = useState<{ valid: boolean; message: string } | null>(null);

  // Query: history
  const { data: historyData, isLoading, error } = useQuery({
    queryKey: ['backup-history', filters, pagination],
    queryFn: async () => {
      const params: BackupFilterParams = {
        type: filters.type || undefined,
        status: filters.status || undefined,
        location: filters.location || undefined,
        startDate: filters.startDate ? `${filters.startDate}T00:00:00` : undefined,
        endDate: filters.endDate ? `${filters.endDate}T23:59:59` : undefined,
        pageNumber: pagination.current - 1,
        pageSize: pagination.pageSize,
        sortBy: 'startedAt',
        sortDir: 'DESC',
      };
      return backupService.getHistory(params);
    },
  });

  // Query: detail (when selected)
  const { data: detailData } = useQuery({
    queryKey: ['backup-detail', selectedBackup?.id],
    queryFn: () => backupService.getDetail(selectedBackup!.id),
    enabled: !!selectedBackup?.id && showDetailModal,
  });

  // Mutations
  const verifyMutation = useMutation({
    mutationFn: (id: number) => backupService.verifyBackup(id),
    onSuccess: (data) => {
      setVerifyResult(data);
      queryClient.invalidateQueries({ queryKey: ['backup-history'] });
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Verify failed');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => backupService.deleteBackup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backup-history'] });
      alert('Backup deleted successfully');
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Delete failed');
    },
  });

  const handleDownload = async (backup: BackupRecord) => {
    try {
      const blob = await backupService.downloadBackup(backup.id);
      backupService.downloadFile(blob, `${backup.backupName}.sql.gz`);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Download failed');
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this backup? This action cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleVerify = (id: number) => {
    setVerifyResult(null);
    verifyMutation.mutate(id);
  };

  const openDetail = (backup: BackupRecord) => {
    setSelectedBackup(backup);
    setShowDetailModal(true);
    setVerifyResult(null);
  };

  const handleResetFilters = () => {
    setFilters({ type: '', status: '', location: '', startDate: '', endDate: '' });
    setPagination({ ...pagination, current: 1 });
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('vi-VN');
  };

  const records = historyData?.content || [];
  const totalElements = historyData?.totalElements || 0;
  const totalPages = historyData?.totalPages || 0;

  return (
    <>
      <PageMeta
        title="Backup History | MedicalTech"
        description="View backup history and manage records"
      />
      <PageBreadcrumb pageTitle="Backup History" />

      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="font-bold">Error loading backup history</p>
            <p className="text-sm">
              {(error as any)?.response?.data?.message || (error as any)?.message || 'Unknown error'}
            </p>
          </div>
        )}

        {/* ===== FILTERS ===== */}
        <ComponentCard title="Filters">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
              <select
                value={filters.type}
                onChange={(e) => {
                  setFilters({ ...filters, type: e.target.value });
                  setPagination({ ...pagination, current: 1 });
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white text-sm"
              >
                <option value="">All Types</option>
                <option value="FULL">Full Backup</option>
                <option value="INCREMENTAL">Incremental</option>
                <option value="DIFFERENTIAL">Differential</option>
                <option value="MANUAL">Manual</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => {
                  setFilters({ ...filters, status: e.target.value });
                  setPagination({ ...pagination, current: 1 });
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white text-sm"
              >
                <option value="">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="FAILED">Failed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
              <select
                value={filters.location}
                onChange={(e) => {
                  setFilters({ ...filters, location: e.target.value });
                  setPagination({ ...pagination, current: 1 });
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white text-sm"
              >
                <option value="">All Locations</option>
                <option value="LOCAL">Local</option>
                <option value="CLOUD">Cloud</option>
                <option value="EXTERNAL">External</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => {
                  setFilters({ ...filters, startDate: e.target.value });
                  setPagination({ ...pagination, current: 1 });
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => {
                  setFilters({ ...filters, endDate: e.target.value });
                  setPagination({ ...pagination, current: 1 });
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white text-sm"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
            >
              Reset Filters
            </button>
          </div>
        </ComponentCard>

        {/* ===== TABLE ===== */}
        <ComponentCard title={`Backup Records (${totalElements})`}>
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
              Loading backup history...
            </div>
          ) : records.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No backup records found. Try adjusting your filters.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-white/[0.05]">
                      <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">ID</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Date</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Name</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Type</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Size</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Duration</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Location</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {records.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                        <td className="px-4 py-3 text-gray-500">#{record.id}</td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {formatDate(record.startedAt || record.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => openDetail(record)}
                            className="font-medium text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400"
                          >
                            {record.backupName}
                          </button>
                          {record.encrypted && (
                            <span className="ml-2 text-xs text-yellow-600" title="Encrypted"></span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                          {backupService.getTypeLabel(record.backupType)}
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {record.sizeFormatted || backupService.formatBytes(record.size || 0)}
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {record.durationFormatted || backupService.formatDuration(record.duration || 0)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge size="sm" color={backupService.getStatusColor(record.status)}>
                            {backupService.getStatusLabel(record.status)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                          {backupService.getLocationLabel(record.storageLocation)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDownload(record)}
                              className="px-2 py-1 text-xs font-medium text-white bg-blue-500 rounded hover:bg-blue-600"
                              title="Download"
                            >
                              Download
                            </button>
                            <button
                              onClick={() => handleVerify(record.id)}
                              className="px-2 py-1 text-xs font-medium text-white bg-green-500 rounded hover:bg-green-600"
                              title="Verify Integrity"
                            >
                              Verify
                            </button>
                            <button
                              onClick={() => handleDelete(record.id)}
                              className="px-2 py-1 text-xs font-medium text-white bg-red-500 rounded hover:bg-red-600"
                              title="Delete"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalElements > 0 && (
                <div className="flex items-center justify-between px-4 py-4 border-t border-gray-100 dark:border-white/[0.05]">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {(pagination.current - 1) * pagination.pageSize + 1} to{' '}
                    {Math.min(pagination.current * pagination.pageSize, totalElements)} of {totalElements} records
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPagination({ ...pagination, current: pagination.current - 1 })}
                      disabled={pagination.current === 1}
                      className="px-3 py-1 text-sm text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400"
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.current <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.current >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = pagination.current - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPagination({ ...pagination, current: pageNum })}
                          className={`px-3 py-1 text-sm font-medium rounded-md border ${
                            pagination.current === pageNum
                              ? 'bg-blue-500 text-white border-blue-500'
                              : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setPagination({ ...pagination, current: pagination.current + 1 })}
                      disabled={pagination.current >= totalPages}
                      className="px-3 py-1 text-sm text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </ComponentCard>

        {/* Verify Result Toast */}
        {verifyResult && (
          <div
            className={`fixed bottom-6 right-6 z-50 p-4 rounded-lg shadow-lg border ${
              verifyResult.valid
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            <div className="flex items-center gap-3">
              {verifyResult.valid ? (
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <div>
                <p className="font-medium">{verifyResult.valid ? 'Integrity Verified' : 'Verification Failed'}</p>
                <p className="text-sm">{verifyResult.message}</p>
              </div>
              <button onClick={() => setVerifyResult(null)} className="ml-3 text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ===== DETAIL MODAL ===== */}
      {showDetailModal && selectedBackup && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Backup Detail</h3>
                  <p className="text-sm text-gray-500">{selectedBackup.backupName}</p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Info Section */}
              <div>
                <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wide">
                  General Information
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <InfoRow label="ID" value={`#${selectedBackup.id}`} />
                  <InfoRow label="Name" value={selectedBackup.backupName} />
                  <InfoRow label="Type" value={backupService.getTypeLabel(detailData?.backupType || selectedBackup.backupType)} />
                  <InfoRow
                    label="Status"
                    value={
                      <Badge size="sm" color={backupService.getStatusColor(detailData?.status || selectedBackup.status)}>
                        {backupService.getStatusLabel(detailData?.status || selectedBackup.status)}
                      </Badge>
                    }
                  />
                  <InfoRow label="Started At" value={formatDate(detailData?.startedAt || selectedBackup.startedAt)} />
                  <InfoRow label="Completed At" value={formatDate(detailData?.completedAt || selectedBackup.completedAt)} />
                  <InfoRow label="Created By" value={detailData?.createdByName || selectedBackup.createdByName || 'System'} />
                </div>
              </div>

              {/* Contents Section */}
              <div>
                <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wide">
                  Contents & Size
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <InfoRow
                    label="Size"
                    value={detailData?.sizeFormatted || selectedBackup.sizeFormatted || backupService.formatBytes(selectedBackup.size || 0)}
                  />
                  <InfoRow
                    label="Duration"
                    value={detailData?.durationFormatted || selectedBackup.durationFormatted || backupService.formatDuration(selectedBackup.duration || 0)}
                  />
                  <InfoRow label="Includes" value={detailData?.includes || selectedBackup.includes || 'All'} />
                  <InfoRow label="Encrypted" value={selectedBackup.encrypted ? 'Yes' : 'No'} />
                </div>
              </div>

              {/* Storage Section */}
              <div>
                <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wide">
                  Storage
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <InfoRow
                    label="Location"
                    value={backupService.getLocationLabel(detailData?.storageLocation || selectedBackup.storageLocation)}
                  />
                  <InfoRow label="Path" value={detailData?.storagePath || 'N/A'} />
                </div>
              </div>

              {/* Metadata Section */}
              {detailData?.checksum && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wide">
                    Metadata
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    <InfoRow label="Checksum" value={
                      <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded break-all">
                        {detailData.checksum}
                      </code>
                    } />
                    {detailData.metadata && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-xs font-medium text-gray-400 mb-1">Metadata</p>
                        <pre className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-all">
                          {detailData.metadata}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Error Section */}
              {(detailData?.errorMessage || selectedBackup.status === 'FAILED') && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
                  <p className="text-xs font-medium text-red-500 mb-1">Error</p>
                  <p className="text-sm text-red-700 dark:text-red-400">
                    {detailData?.errorMessage || 'Backup failed - no error details available'}
                  </p>
                </div>
              )}

              {/* Progress bar for in-progress */}
              {(detailData?.status === 'IN_PROGRESS' || selectedBackup.status === 'IN_PROGRESS') && (
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>{detailData?.currentStep || 'Processing...'}</span>
                    <span>{detailData?.progressPercent || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-500 h-2.5 rounded-full"
                      style={{ width: `${detailData?.progressPercent || 0}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-3 justify-end">
              <button
                onClick={() => handleDownload(selectedBackup)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600"
              >
                Download
              </button>
              <button
                onClick={() => handleVerify(selectedBackup.id)}
                disabled={verifyMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 disabled:opacity-50"
              >
                {verifyMutation.isPending ? 'Verifying...' : 'Verify'}
              </button>
              <button
                onClick={() => {
                  handleDelete(selectedBackup.id);
                  setShowDetailModal(false);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Helper component for detail info rows
const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="p-3 bg-gray-50 dark:bg-white/[0.03] rounded-lg">
    <p className="text-xs font-medium text-gray-400 mb-1">{label}</p>
    <div className="text-sm text-gray-800 dark:text-white/90">{value || 'N/A'}</div>
  </div>
);

export default BackupHistory;
