import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import PageMeta from '../../components/common/PageMeta';
import Badge from '../../components/ui/badge/Badge';
import * as backupService from '../../services/backupService';
import type {
  ManualBackupRequest,
  BackupProgress,
  BackupRecord,
  BackupType,
  StorageLocation,
} from '../../services/backupService';

type Step = 'configure' | 'progress' | 'completed';

const ManualBackup: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>('configure');
  const [activeBackupId, setActiveBackupId] = useState<number | null>(null);
  const [completedRecord, setCompletedRecord] = useState<BackupRecord | null>(null);
  const [downloading, setDownloading] = useState(false);

  const [form, setForm] = useState<ManualBackupRequest>({
    backupName: '',
    backupType: 'FULL',
    includes: ['DATABASE', 'FILES', 'CONFIG'],
    storageLocation: 'LOCAL',
    encrypted: false,
  });

  // Auto-generate backup name
  useEffect(() => {
    if (!form.backupName || form.backupName.startsWith('manual_backup_')) {
      const now = new Date();
      const ts = now.toISOString().replace(/[-:T]/g, '').slice(0, 14);
      setForm((prev) => ({ ...prev, backupName: `manual_backup_${ts}` }));
    }
  }, []);

  // Progress polling
  const { data: progress } = useQuery<BackupProgress>({
    queryKey: ['backup-progress', activeBackupId],
    queryFn: () => backupService.getProgress(activeBackupId!),
    enabled: step === 'progress' && !!activeBackupId,
    refetchInterval: 2000,
  });

  // Auto-transition when done
  useEffect(() => {
    if (progress && (progress.status === 'COMPLETED' || progress.status === 'FAILED' || progress.status === 'CANCELLED')) {
      // Fetch final record
      backupService.getDetail(activeBackupId!).then((record) => {
        setCompletedRecord(record);
        setStep('completed');
        queryClient.invalidateQueries({ queryKey: ['backup-dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['backup-history'] });
      });
    }
  }, [progress?.status]);

  // Run backup mutation
  const runBackupMutation = useMutation({
    mutationFn: (request: ManualBackupRequest) =>
      backupService.runManualBackup(request),
    onSuccess: (data) => {
      setActiveBackupId(data.id);
      setStep('progress');
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Failed to start backup');
    },
  });

  // Cancel backup mutation
  const cancelMutation = useMutation({
    mutationFn: (id: number) => backupService.cancelBackup(id),
    onSuccess: (data) => {
      setCompletedRecord(data);
      setStep('completed');
      queryClient.invalidateQueries({ queryKey: ['backup-dashboard'] });
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Failed to cancel backup');
    },
  });

  const handleIncludeToggle = (item: string) => {
    setForm((prev) => {
      const includes = prev.includes || [];
      if (includes.includes(item)) {
        return { ...prev, includes: includes.filter((i) => i !== item) };
      }
      return { ...prev, includes: [...includes, item] };
    });
  };

  const handleSubmit = () => {
    if (!form.backupName.trim()) {
      alert('Please enter a backup name');
      return;
    }
    if (!form.includes || form.includes.length === 0) {
      alert('Please select at least one item to backup');
      return;
    }
    runBackupMutation.mutate(form);
  };

  const handleDownload = async () => {
    if (!completedRecord) return;
    setDownloading(true);
    try {
      const blob = await backupService.downloadBackup(completedRecord.id);
      backupService.downloadFile(blob, `${completedRecord.backupName}.zip`);
    } catch {
      alert('Download failed');
    } finally {
      setDownloading(false);
    }
  };

  const handleStartNew = () => {
    setStep('configure');
    setActiveBackupId(null);
    setCompletedRecord(null);
    const now = new Date();
    const ts = now.toISOString().replace(/[-:T]/g, '').slice(0, 14);
    setForm({
      backupName: `manual_backup_${ts}`,
      backupType: 'FULL',
      includes: ['DATABASE', 'FILES', 'CONFIG'],
      storageLocation: 'LOCAL',
      encrypted: false,
    });
  };

  // ==================== CONFIGURE STEP ====================
  const renderConfigure = () => (
    <ComponentCard title="Backup Configuration">
      <div className="space-y-6">
        {/* Backup Name */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Backup Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.backupName}
            onChange={(e) => setForm({ ...form, backupName: e.target.value })}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            placeholder="Enter backup name..."
          />
        </div>

        {/* Backup Type */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Backup Type
          </label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(['FULL', 'INCREMENTAL', 'DIFFERENTIAL', 'MANUAL'] as BackupType[]).map(
              (type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm({ ...form, backupType: type })}
                  className={`rounded-lg border-2 px-4 py-3 text-center text-sm font-medium transition-all ${
                    form.backupType === type
                      ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}
                >
                  {backupService.getTypeLabel(type)}
                </button>
              )
            )}
          </div>
        </div>

        {/* What to Backup */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            What to Backup <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            {[
              { key: 'DATABASE', label: 'Database', desc: 'All database tables and data' },
              { key: 'FILES', label: 'Files & Media', desc: 'Uploaded files, images, documents' },
              { key: 'CONFIG', label: 'Configuration', desc: 'System settings and configurations' },
            ].map((item) => (
              <label
                key={item.key}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 transition-all ${
                  form.includes?.includes(item.key)
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={form.includes?.includes(item.key) ?? false}
                  onChange={() => handleIncludeToggle(item.key)}
                  className="h-4 w-4 rounded text-brand-500 focus:ring-brand-500"
                />
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white">
                    {item.label}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {item.desc}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Storage Location */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Storage Location
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['LOCAL', 'CLOUD', 'EXTERNAL'] as StorageLocation[]).map(
              (loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setForm({ ...form, storageLocation: loc })}
                  className={`rounded-lg border-2 px-4 py-3 text-center text-sm font-medium transition-all ${
                    form.storageLocation === loc
                      ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}
                >
                  <div className="mb-1 text-lg">
                    {loc === 'LOCAL' ? '' : loc === 'CLOUD' ? '' : ''}
                  </div>
                  {backupService.getLocationLabel(loc)}
                </button>
              )
            )}
          </div>
        </div>

        {/* Encryption */}
        <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-600">
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-white">
              Encrypt Backup
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Protect backup with AES-256 encryption
            </p>
          </div>
          <button
            type="button"
            onClick={() => setForm({ ...form, encrypted: !form.encrypted })}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              form.encrypted ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform shadow-sm ${
                form.encrypted ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Summary */}
        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
          <h4 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Backup Summary
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <span className="text-gray-500 dark:text-gray-400">Name:</span>
            <span className="font-medium text-gray-800 dark:text-white">{form.backupName || '-'}</span>
            <span className="text-gray-500 dark:text-gray-400">Type:</span>
            <span className="font-medium text-gray-800 dark:text-white">{backupService.getTypeLabel(form.backupType)}</span>
            <span className="text-gray-500 dark:text-gray-400">Items:</span>
            <span className="font-medium text-gray-800 dark:text-white">
              {form.includes?.join(', ') || 'None'}
            </span>
            <span className="text-gray-500 dark:text-gray-400">Location:</span>
            <span className="font-medium text-gray-800 dark:text-white">{backupService.getLocationLabel(form.storageLocation)}</span>
            <span className="text-gray-500 dark:text-gray-400">Encrypted:</span>
            <span className="font-medium text-gray-800 dark:text-white">{form.encrypted ? 'Yes' : 'No'}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/backup-dashboard')}
            className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={runBackupMutation.isPending}
            className="rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {runBackupMutation.isPending ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Starting...
              </span>
            ) : (
              'Start Backup'
            )}
          </button>
        </div>
      </div>
    </ComponentCard>
  );

  // ==================== PROGRESS STEP ====================
  const renderProgress = () => (
    <ComponentCard title="Backup in Progress">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              {progress?.backupName || form.backupName}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Backup ID: #{activeBackupId}
            </p>
          </div>
          <Badge color="warning">In Progress</Badge>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Progress
            </span>
            <span className="text-sm font-bold text-brand-600 dark:text-brand-400">
              {progress?.progressPercent ?? 0}%
            </span>
          </div>
          <div className="h-4 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-500 ease-out"
              style={{ width: `${progress?.progressPercent ?? 0}%` }}
            />
          </div>
        </div>

        {/* Current Step */}
        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-600">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Current Step</p>
              <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white">
                {progress?.currentStep || 'Initializing...'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Time Remaining</p>
              <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white">
                {progress?.timeRemaining
                  ? backupService.formatDuration(progress.timeRemaining)
                  : 'Calculating...'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Elapsed Time</p>
              <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white">
                {progress?.elapsedTime
                  ? backupService.formatDuration(progress.elapsedTime)
                  : '0s'}
              </p>
            </div>
          </div>
        </div>

        {/* Current Size */}
        {progress?.currentSize !== undefined && progress.currentSize > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>Current Size:</span>
            <span className="font-medium">
              {backupService.formatBytes(progress.currentSize)}
            </span>
          </div>
        )}

        {/* Steps Timeline */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Steps
          </h4>
          {[
            { name: 'Initializing backup', threshold: 0 },
            { name: 'Backing up database', threshold: 10 },
            { name: 'Backing up files', threshold: 40 },
            { name: 'Backing up configuration', threshold: 60 },
            { name: 'Compressing data', threshold: 75 },
            { name: 'Verifying integrity', threshold: 90 },
            { name: 'Completing', threshold: 95 },
          ].map((s, i) => {
            const pct = progress?.progressPercent ?? 0;
            const isDone = pct > s.threshold;
            const isCurrent =
              pct >= s.threshold &&
              (i === 6 || pct < [10, 40, 60, 75, 90, 95, 101][i + 1]);
            return (
              <div key={i} className="flex items-center gap-3">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    isDone && !isCurrent
                      ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400'
                      : isCurrent
                      ? 'bg-brand-100 text-brand-600 animate-pulse dark:bg-brand-500/20 dark:text-brand-400'
                      : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                  }`}
                >
                  {isDone && !isCurrent ? '✓' : i + 1}
                </div>
                <span
                  className={`text-sm ${
                    isDone || isCurrent
                      ? 'font-medium text-gray-800 dark:text-white'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {s.name}
                </span>
              </div>
            );
          })}
        </div>

        {/* Cancel Button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => cancelMutation.mutate(activeBackupId!)}
            disabled={cancelMutation.isPending}
            className="rounded-lg border border-red-300 px-6 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-500/10"
          >
            {cancelMutation.isPending ? 'Cancelling...' : '✕ Cancel Backup'}
          </button>
        </div>
      </div>
    </ComponentCard>
  );

  // ==================== COMPLETED STEP ====================
  const renderCompleted = () => {
    const isSuccess = completedRecord?.status === 'COMPLETED';
    const isCancelled = completedRecord?.status === 'CANCELLED';

    return (
      <ComponentCard title="Backup Result">
        <div className="space-y-6">
          {/* Status Banner */}
          <div
            className={`rounded-lg p-6 text-center ${
              isSuccess
                ? 'bg-green-50 dark:bg-green-500/10'
                : isCancelled
                ? 'bg-yellow-50 dark:bg-yellow-500/10'
                : 'bg-red-50 dark:bg-red-500/10'
            }`}
          >
            <div className="mb-2 text-4xl">
              {isSuccess ? '' : isCancelled ? '' : ''}
            </div>
            <h3
              className={`text-xl font-bold ${
                isSuccess
                  ? 'text-green-700 dark:text-green-400'
                  : isCancelled
                  ? 'text-yellow-700 dark:text-yellow-400'
                  : 'text-red-700 dark:text-red-400'
              }`}
            >
              {isSuccess
                ? 'Backup Completed Successfully!'
                : isCancelled
                ? 'Backup Cancelled'
                : 'Backup Failed'}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {completedRecord?.backupName}
            </p>
          </div>

          {/* Details */}
          {completedRecord && (
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-600">
              <h4 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Backup Details
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <InfoRow label="Backup ID" value={`#${completedRecord.id}`} />
                <InfoRow label="Type" value={backupService.getTypeLabel(completedRecord.backupType)} />
                <InfoRow
                  label="Size"
                  value={completedRecord.sizeFormatted || backupService.formatBytes(completedRecord.size)}
                />
                <InfoRow
                  label="Duration"
                  value={completedRecord.durationFormatted || backupService.formatDuration(completedRecord.duration)}
                />
                <InfoRow label="Location" value={backupService.getLocationLabel(completedRecord.storageLocation)} />
                <InfoRow label="Encrypted" value={completedRecord.encrypted ? 'Yes' : 'No'} />
                <InfoRow label="Status">
                  <Badge color={backupService.getStatusColor(completedRecord.status)}>
                    {backupService.getStatusLabel(completedRecord.status)}
                  </Badge>
                </InfoRow>
                {completedRecord.completedAt && (
                  <InfoRow
                    label="Completed At"
                    value={new Date(completedRecord.completedAt).toLocaleString()}
                  />
                )}
              </div>
            </div>
          )}

          {/* Error message */}
          {completedRecord?.errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-600 dark:bg-red-500/10">
              <h4 className="mb-1 text-sm font-semibold text-red-700 dark:text-red-400">
                Error Details
              </h4>
              <p className="text-sm text-red-600 dark:text-red-300">
                {completedRecord.errorMessage}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap justify-end gap-3">
            {isSuccess && (
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="rounded-lg border border-brand-300 px-5 py-2.5 text-sm font-medium text-brand-600 hover:bg-brand-50 disabled:opacity-50 dark:border-brand-600 dark:text-brand-400 dark:hover:bg-brand-500/10"
              >
                {downloading ? 'Downloading...' : 'Download Backup'}
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate('/backup-history')}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              View History
            </button>
            <button
              type="button"
              onClick={handleStartNew}
              className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
            >
              New Backup
            </button>
          </div>
        </div>
      </ComponentCard>
    );
  };

  return (
    <>
      <PageMeta title="Manual Backup | MediTech Admin" />
      <PageBreadcrumb pageTitle="Manual Backup" />

      <div className="space-y-6">
        {/* Stepper */}
        <div className="flex items-center justify-center gap-2">
          {(['configure', 'progress', 'completed'] as Step[]).map((s, i) => {
            const labels = ['1. Configure', '2. Progress', '3. Result'];
            const isActive = step === s;
            const isDone =
              (s === 'configure' && (step === 'progress' || step === 'completed')) ||
              (s === 'progress' && step === 'completed');
            return (
              <React.Fragment key={s}>
                {i > 0 && (
                  <div
                    className={`h-px w-8 sm:w-16 ${
                      isDone || isActive
                        ? 'bg-brand-500'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                )}
                <div
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
                    isActive
                      ? 'bg-brand-500 text-white'
                      : isDone
                      ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                  }`}
                >
                  {isDone ? '✓' : ''} {labels[i]}
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {step === 'configure' && renderConfigure()}
        {step === 'progress' && renderProgress()}
        {step === 'completed' && renderCompleted()}
      </div>
    </>
  );
};

// Reusable info row
const InfoRow: React.FC<{
  label: string;
  value?: string;
  children?: React.ReactNode;
}> = ({ label, value, children }) => (
  <>
    <span className="text-gray-500 dark:text-gray-400">{label}:</span>
    <span className="font-medium text-gray-800 dark:text-white">
      {children || value || '-'}
    </span>
  </>
);

export default ManualBackup;
