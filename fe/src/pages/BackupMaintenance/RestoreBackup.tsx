import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import PageMeta from '../../components/common/PageMeta';
import Badge from '../../components/ui/badge/Badge';
import * as backupService from '../../services/backupService';
import type {
  BackupRecord,
  BackupFilterParams,
  RestoreRequest,
  RestoreProgress,
  RestoreRecord,
  RestoreType,
} from '../../services/backupService';

type WizardStep = 'select' | 'options' | 'confirm' | 'progress' | 'result';

const RestoreBackup: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<WizardStep>('select');
  const [sourceMode, setSourceMode] = useState<'history' | 'upload'>('history');
  const [selectedBackup, setSelectedBackup] = useState<BackupRecord | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [activeRestoreId, setActiveRestoreId] = useState<number | null>(null);
  const [completedRestore, setCompletedRestore] = useState<RestoreRecord | null>(null);

  // Search & pagination for backup list
  const [searchPage, setSearchPage] = useState(0);

  // Restore options
  const [restoreType, setRestoreType] = useState<RestoreType>('FULL');
  const [restoreItems, setRestoreItems] = useState<string[]>(['DATABASE', 'FILES', 'CONFIG']);
  const [password, setPassword] = useState('');
  const [createPreRestoreBackup, setCreatePreRestoreBackup] = useState(true);

  // Confirmation
  const [confirmText, setConfirmText] = useState('');
  const [confirmChecked, setConfirmChecked] = useState(false);

  // Query backup list for selection
  const { data: backupList, isLoading: backupsLoading } = useQuery({
    queryKey: ['backup-history-select', searchPage],
    queryFn: () =>
      backupService.getHistory({
        status: 'COMPLETED',
        pageNumber: searchPage,
        pageSize: 8,
        sortBy: 'completedAt',
        sortDir: 'DESC',
      } as BackupFilterParams),
    enabled: step === 'select' && sourceMode === 'history',
  });

  // Restore progress polling
  const { data: progress } = useQuery<RestoreProgress>({
    queryKey: ['restore-progress', activeRestoreId],
    queryFn: () => backupService.getRestoreProgress(activeRestoreId!),
    enabled: step === 'progress' && !!activeRestoreId,
    refetchInterval: 2000,
  });

  // Auto-transition when progress indicates completion
  useEffect(() => {
    if (
      progress &&
      (progress.status === 'COMPLETED' || progress.status === 'FAILED')
    ) {
      backupService.getRestoreDetail(activeRestoreId!).then((record) => {
        setCompletedRestore(record);
        setStep('result');
        queryClient.invalidateQueries({ queryKey: ['backup-dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['restore-history'] });
      });
    }
  }, [progress?.status]);

  // Restore from backup mutation
  const restoreMutation = useMutation({
    mutationFn: (request: RestoreRequest) =>
      backupService.restoreFromBackup(request),
    onSuccess: (data) => {
      setActiveRestoreId(data.id);
      setStep('progress');
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Failed to start restore');
    },
  });

  // Restore from upload mutation
  const uploadRestoreMutation = useMutation({
    mutationFn: () =>
      backupService.restoreFromUpload(
        uploadFile!,
        restoreType,
        restoreType === 'PARTIAL' ? restoreItems : undefined,
        password || undefined
      ),
    onSuccess: (data) => {
      setActiveRestoreId(data.id);
      setStep('progress');
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Failed to start restore from file');
    },
  });

  // Test restore mutation
  const testRestoreMutation = useMutation({
    mutationFn: (backupId: number) => backupService.testRestore(backupId),
    onSuccess: (data) => {
      setActiveRestoreId(data.id);
      setStep('progress');
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Failed to start test restore');
    },
  });

  const handleItemToggle = (item: string) => {
    setRestoreItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleNextFromSelect = () => {
    if (sourceMode === 'history' && !selectedBackup) {
      alert('Please select a backup to restore from');
      return;
    }
    if (sourceMode === 'upload' && !uploadFile) {
      alert('Please upload a backup file');
      return;
    }
    setStep('options');
  };

  const handleNextFromOptions = () => {
    if (restoreType === 'PARTIAL' && restoreItems.length === 0) {
      alert('Please select at least one item to restore');
      return;
    }
    setStep('confirm');
  };

  const handleStartRestore = () => {
    if (confirmText !== 'RESTORE') {
      alert('Please type "RESTORE" to confirm');
      return;
    }
    if (!confirmChecked) {
      alert('Please acknowledge the warning');
      return;
    }

    if (restoreType === 'TEST' && sourceMode === 'history' && selectedBackup) {
      testRestoreMutation.mutate(selectedBackup.id);
      return;
    }

    if (sourceMode === 'upload') {
      uploadRestoreMutation.mutate();
    } else {
      restoreMutation.mutate({
        backupId: selectedBackup!.id,
        restoreType,
        items: restoreType === 'PARTIAL' ? restoreItems : undefined,
        password: password || undefined,
        createPreRestoreBackup,
      });
    }
  };

  const handleReset = () => {
    setStep('select');
    setSelectedBackup(null);
    setUploadFile(null);
    setActiveRestoreId(null);
    setCompletedRestore(null);
    setRestoreType('FULL');
    setRestoreItems(['DATABASE', 'FILES', 'CONFIG']);
    setPassword('');
    setCreatePreRestoreBackup(true);
    setConfirmText('');
    setConfirmChecked(false);
  };

  // ==================== STEP 1: SELECT BACKUP ====================
  const renderSelectStep = () => (
    <ComponentCard title="Step 1: Select Backup Source">
      <div className="space-y-5">
        {/* Source Mode Toggle */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setSourceMode('history'); setUploadFile(null); }}
            className={`flex-1 rounded-lg border-2 py-3 text-center text-sm font-medium transition-all ${
              sourceMode === 'history'
                ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
                : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-600 dark:text-gray-400'
            }`}
          >
            From Backup History
          </button>
          <button
            type="button"
            onClick={() => { setSourceMode('upload'); setSelectedBackup(null); }}
            className={`flex-1 rounded-lg border-2 py-3 text-center text-sm font-medium transition-all ${
              sourceMode === 'upload'
                ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
                : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-600 dark:text-gray-400'
            }`}
          >
            Upload Backup File
          </button>
        </div>

        {sourceMode === 'history' ? (
          <>
            {backupsLoading ? (
              <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                Loading backups...
              </div>
            ) : !backupList?.content?.length ? (
              <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                No completed backups found
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {backupList.content.map((backup) => (
                    <label
                      key={backup.id}
                      className={`flex cursor-pointer items-center gap-4 rounded-lg border-2 p-4 transition-all ${
                        selectedBackup?.id === backup.id
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                          : 'border-gray-200 hover:border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="backup-select"
                        checked={selectedBackup?.id === backup.id}
                        onChange={() => setSelectedBackup(backup)}
                        className="h-4 w-4 text-brand-500 focus:ring-brand-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-800 dark:text-white">
                            {backup.backupName}
                          </span>
                          <Badge color={backupService.getStatusColor(backup.status)}>
                            {backupService.getTypeLabel(backup.backupType)}
                          </Badge>
                          {backup.encrypted && (
                            <span className="text-xs text-yellow-600 dark:text-yellow-400"></span>
                          )}
                        </div>
                        <div className="mt-1 flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>
                            {backup.completedAt
                              ? new Date(backup.completedAt).toLocaleString()
                              : '-'}
                          </span>
                          <span>{backup.sizeFormatted || backupService.formatBytes(backup.size)}</span>
                          <span>{backupService.getLocationLabel(backup.storageLocation)}</span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Pagination */}
                {backupList.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSearchPage((p) => Math.max(0, p - 1))}
                      disabled={searchPage === 0}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs disabled:opacity-40 dark:border-gray-600"
                    >
                      Previous
                    </button>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Page {searchPage + 1} of {backupList.totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setSearchPage((p) =>
                          Math.min(backupList.totalPages - 1, p + 1)
                        )
                      }
                      disabled={searchPage >= backupList.totalPages - 1}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs disabled:opacity-40 dark:border-gray-600"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          /* Upload Mode */
          <div className="space-y-4">
            <div
              className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-all ${
                uploadFile
                  ? 'border-green-400 bg-green-50 dark:bg-green-500/10'
                  : 'border-gray-300 hover:border-brand-400 dark:border-gray-600'
              }`}
            >
              {uploadFile ? (
                <div className="text-center">
                  <p className="text-3xl mb-2"></p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">
                    {uploadFile.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {backupService.formatBytes(uploadFile.size)}
                  </p>
                  <button
                    type="button"
                    onClick={() => setUploadFile(null)}
                    className="mt-2 text-xs text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer text-center">
                  <p className="text-4xl mb-2"></p>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Click to upload or drag backup file
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Supports .zip, .sql, .bak files
                  </p>
                  <input
                    type="file"
                    accept=".zip,.sql,.bak,.gz,.tar"
                    onChange={(e) => {
                      if (e.target.files?.[0]) setUploadFile(e.target.files[0]);
                    }}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/backup-dashboard')}
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleNextFromSelect}
            className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            Next →
          </button>
        </div>
      </div>
    </ComponentCard>
  );

  // ==================== STEP 2: OPTIONS ====================
  const renderOptionsStep = () => (
    <ComponentCard title="Step 2: Restore Options">
      <div className="space-y-5">
        {/* Source summary */}
        <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">Restoring from:</p>
          <p className="text-sm font-semibold text-gray-800 dark:text-white">
            {sourceMode === 'history'
              ? `${selectedBackup?.backupName} (${selectedBackup?.sizeFormatted || ''})`
              : uploadFile?.name}
          </p>
        </div>

        {/* Restore Type */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Restore Mode
          </label>
          <div className="grid grid-cols-3 gap-3">
            {([
              {
                type: 'FULL' as RestoreType,
                icon: '',
                label: 'Full Restore',
                desc: 'Restore everything',
              },
              {
                type: 'PARTIAL' as RestoreType,
                icon: '',
                label: 'Partial Restore',
                desc: 'Choose what to restore',
              },
              {
                type: 'TEST' as RestoreType,
                icon: '',
                label: 'Test Restore',
                desc: 'Sandbox mode, no live changes',
              },
            ]).map((opt) => (
              <button
                key={opt.type}
                type="button"
                onClick={() => setRestoreType(opt.type)}
                className={`rounded-lg border-2 p-4 text-left transition-all ${
                  restoreType === opt.type
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-600'
                }`}
              >
                <div className="text-2xl mb-1">{opt.icon}</div>
                <p className="text-sm font-semibold text-gray-800 dark:text-white">
                  {opt.label}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {opt.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Partial items */}
        {restoreType === 'PARTIAL' && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Items to Restore
            </label>
            <div className="space-y-2">
              {[
                { key: 'DATABASE', label: 'Database', desc: 'All database tables and records' },
                { key: 'FILES', label: 'Files & Media', desc: 'Uploaded files, images, documents' },
                { key: 'CONFIG', label: 'Configuration', desc: 'System settings and preferences' },
              ].map((item) => (
                <label
                  key={item.key}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 transition-all ${
                    restoreItems.includes(item.key)
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={restoreItems.includes(item.key)}
                    onChange={() => handleItemToggle(item.key)}
                    className="h-4 w-4 rounded text-brand-500 focus:ring-brand-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                      {item.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Password (if encrypted) */}
        {selectedBackup?.encrypted && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Backup Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter decryption password..."
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
        )}

        {/* Pre-restore backup option */}
        {restoreType !== 'TEST' && (
          <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-600">
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-white">
                Create Pre-Restore Backup
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Automatically backup current data before restoring (recommended)
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCreatePreRestoreBackup(!createPreRestoreBackup)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                createPreRestoreBackup
                  ? 'bg-brand-500'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                  createPreRestoreBackup ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => setStep('select')}
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={handleNextFromOptions}
            className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            Next →
          </button>
        </div>
      </div>
    </ComponentCard>
  );

  // ==================== STEP 3: CONFIRM ====================
  const renderConfirmStep = () => (
    <ComponentCard title="Step 3: Confirm Restore">
      <div className="space-y-5">
        {/* Warnings */}
        {restoreType !== 'TEST' && (
          <div className="space-y-3">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-600 dark:bg-red-500/10">
              <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-red-700 dark:text-red-400">
                Critical Warning
              </h4>
              <ul className="space-y-1.5 text-sm text-red-600 dark:text-red-300">
                <li>
                  • This will <strong>overwrite existing data</strong> with data from the backup
                </li>
                <li>
                  • All active user sessions will be <strong>terminated</strong>
                </li>
                <li>
                  • The system may experience <strong>downtime</strong> during the restore process
                </li>
                <li>
                  • This action <strong>cannot be undone</strong> unless a pre-restore backup is created
                </li>
              </ul>
            </div>

            {createPreRestoreBackup && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-600 dark:bg-green-500/10">
                <p className="text-sm text-green-700 dark:text-green-400">
                  A pre-restore backup will be created automatically before the restore begins
                </p>
              </div>
            )}
          </div>
        )}

        {restoreType === 'TEST' && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-600 dark:bg-blue-500/10">
            <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-blue-700 dark:text-blue-400">
              Test Restore (Sandbox Mode)
            </h4>
            <ul className="space-y-1.5 text-sm text-blue-600 dark:text-blue-300">
              <li>• Restore will run in an <strong>isolated sandbox</strong></li>
              <li>• No live data will be modified</li>
              <li>• Used to verify backup integrity and contents</li>
              <li>• Sandbox data will be automatically cleaned up</li>
            </ul>
          </div>
        )}

        {/* Summary */}
        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-600">
          <h4 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Restore Summary
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <InfoRow
              label="Source"
              value={
                sourceMode === 'history'
                  ? selectedBackup?.backupName || '-'
                  : uploadFile?.name || '-'
              }
            />
            <InfoRow label="Mode" value={backupService.getRestoreTypeLabel(restoreType)} />
            {restoreType === 'PARTIAL' && (
              <InfoRow label="Items" value={restoreItems.join(', ')} />
            )}
            {sourceMode === 'history' && selectedBackup && (
              <>
                <InfoRow label="Backup Size" value={selectedBackup.sizeFormatted || backupService.formatBytes(selectedBackup.size)} />
                <InfoRow label="Backup Date" value={selectedBackup.completedAt ? new Date(selectedBackup.completedAt).toLocaleString() : '-'} />
              </>
            )}
            <InfoRow label="Pre-Restore Backup" value={restoreType === 'TEST' ? 'N/A' : createPreRestoreBackup ? 'Yes' : 'No'} />
          </div>
        </div>

        {/* Confirmation Input */}
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Type <strong className="text-red-600">RESTORE</strong> to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type RESTORE here..."
              className={`w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-1 ${
                confirmText === 'RESTORE'
                  ? 'border-green-400 bg-green-50 focus:border-green-500 focus:ring-green-500 dark:bg-green-500/10'
                  : 'border-gray-300 bg-white focus:border-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800'
              } dark:text-white`}
            />
          </div>

          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={confirmChecked}
              onChange={(e) => setConfirmChecked(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded text-brand-500 focus:ring-brand-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              I understand that this restore operation will{' '}
              {restoreType === 'TEST'
                ? 'use system resources to verify backup integrity'
                : 'modify live system data and may cause temporary downtime'}
              , and I want to proceed.
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => { setStep('options'); setConfirmText(''); setConfirmChecked(false); }}
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={handleStartRestore}
            disabled={
              confirmText !== 'RESTORE' ||
              !confirmChecked ||
              restoreMutation.isPending ||
              uploadRestoreMutation.isPending ||
              testRestoreMutation.isPending
            }
            className={`rounded-lg px-6 py-2.5 text-sm font-medium text-white disabled:opacity-50 ${
              restoreType === 'TEST'
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {restoreMutation.isPending ||
            uploadRestoreMutation.isPending ||
            testRestoreMutation.isPending ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Starting...
              </span>
            ) : restoreType === 'TEST' ? (
              'Start Test Restore'
            ) : (
              'Start Restore'
            )}
          </button>
        </div>
      </div>
    </ComponentCard>
  );

  // ==================== STEP 4: PROGRESS ====================
  const renderProgressStep = () => (
    <ComponentCard title="Restore in Progress">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              {progress?.backupName || selectedBackup?.backupName || uploadFile?.name || 'Restoring...'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Restore ID: #{activeRestoreId} •{' '}
              {backupService.getRestoreTypeLabel(progress?.restoreType || restoreType)}
              {progress?.isTestRestore && (
                <span className="ml-2 text-blue-500">(Sandbox)</span>
              )}
            </p>
          </div>
          <Badge color="warning">
            {progress?.isTestRestore ? 'Test In Progress' : 'Restoring'}
          </Badge>
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
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                progress?.isTestRestore
                  ? 'bg-gradient-to-r from-blue-400 to-blue-600'
                  : 'bg-gradient-to-r from-orange-400 to-red-500'
              }`}
              style={{ width: `${progress?.progressPercent ?? 0}%` }}
            />
          </div>
        </div>

        {/* Details */}
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
              <p className="text-xs text-gray-500 dark:text-gray-400">Elapsed</p>
              <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white">
                {progress?.elapsedTime
                  ? backupService.formatDuration(progress.elapsedTime)
                  : '0s'}
              </p>
            </div>
          </div>
        </div>

        {/* Steps Timeline */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Restore Steps
          </h4>
          {[
            { name: 'Preparing restore environment', threshold: 0 },
            { name: restoreType !== 'TEST' && createPreRestoreBackup ? 'Creating pre-restore backup' : 'Validating backup', threshold: 5 },
            { name: 'Extracting backup data', threshold: 15 },
            { name: 'Restoring database', threshold: 30 },
            { name: 'Restoring files', threshold: 50 },
            { name: 'Restoring configuration', threshold: 70 },
            { name: 'Verifying data integrity', threshold: 85 },
            { name: 'Finalizing', threshold: 95 },
          ].map((s, i) => {
            const pct = progress?.progressPercent ?? 0;
            const nextThreshold = [5, 15, 30, 50, 70, 85, 95, 101][i + 1] ?? 101;
            const isDone = pct >= nextThreshold;
            const isCurrent = pct >= s.threshold && pct < nextThreshold;
            return (
              <div key={i} className="flex items-center gap-3">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    isDone
                      ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400'
                      : isCurrent
                      ? 'animate-pulse bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400'
                      : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                  }`}
                >
                  {isDone ? '✓' : i + 1}
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

        {/* Pre-restore backup info */}
        {progress?.preRestoreBackupId && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-600 dark:bg-green-500/10">
            <p className="text-sm text-green-700 dark:text-green-400">
              Pre-restore backup created (ID: #{progress.preRestoreBackupId})
            </p>
          </div>
        )}
      </div>
    </ComponentCard>
  );

  // ==================== STEP 5: RESULT ====================
  const renderResultStep = () => {
    const isSuccess = completedRestore?.status === 'COMPLETED';
    const isTest = completedRestore?.isTestRestore;

    return (
      <ComponentCard title="Restore Result">
        <div className="space-y-6">
          {/* Status Banner */}
          <div
            className={`rounded-lg p-6 text-center ${
              isSuccess
                ? 'bg-green-50 dark:bg-green-500/10'
                : 'bg-red-50 dark:bg-red-500/10'
            }`}
          >
            <div className="mb-2 text-4xl">
              {isSuccess ? (isTest ? '' : '') : ''}
            </div>
            <h3
              className={`text-xl font-bold ${
                isSuccess
                  ? 'text-green-700 dark:text-green-400'
                  : 'text-red-700 dark:text-red-400'
              }`}
            >
              {isSuccess
                ? isTest
                  ? 'Test Restore Passed!'
                  : 'Restore Completed Successfully!'
                : 'Restore Failed'}
            </h3>
            {isTest && isSuccess && (
              <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                Backup integrity verified. No live data was modified.
              </p>
            )}
          </div>

          {/* Details */}
          {completedRestore && (
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-600">
              <h4 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Restore Details
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <InfoRow label="Restore ID" value={`#${completedRestore.id}`} />
                <InfoRow label="Backup" value={completedRestore.backupName || `#${completedRestore.backupRecordId}`} />
                <InfoRow label="Type" value={backupService.getRestoreTypeLabel(completedRestore.restoreType)} />
                <InfoRow label="Status">
                  <Badge color={backupService.getRestoreStatusColor(completedRestore.status)}>
                    {completedRestore.status}
                  </Badge>
                </InfoRow>
                {completedRestore.duration && (
                  <InfoRow
                    label="Duration"
                    value={backupService.formatDuration(completedRestore.duration)}
                  />
                )}
                {completedRestore.startedAt && (
                  <InfoRow
                    label="Started"
                    value={new Date(completedRestore.startedAt).toLocaleString()}
                  />
                )}
                {completedRestore.completedAt && (
                  <InfoRow
                    label="Completed"
                    value={new Date(completedRestore.completedAt).toLocaleString()}
                  />
                )}
                {completedRestore.restoredItems && (
                  <InfoRow label="Restored Items" value={completedRestore.restoredItems} />
                )}
              </div>
            </div>
          )}

          {/* Pre-restore backup link */}
          {completedRestore?.preRestoreBackupId && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-600 dark:bg-blue-500/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                    Pre-Restore Backup Available
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-300">
                    Backup ID: #{completedRestore.preRestoreBackupId} — Use this to rollback if needed
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleReset();
                    // pre-select this backup for a potential rollback
                    backupService.getDetail(completedRestore!.preRestoreBackupId!).then((backup) => {
                      setSelectedBackup(backup);
                      setSourceMode('history');
                    });
                  }}
                  className="rounded-lg border border-blue-400 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-500/20"
                >
                  Rollback
                </button>
              </div>
            </div>
          )}

          {/* Error message */}
          {completedRestore?.errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-600 dark:bg-red-500/10">
              <h4 className="mb-1 text-sm font-semibold text-red-700 dark:text-red-400">
                Error Details
              </h4>
              <p className="text-sm text-red-600 dark:text-red-300">
                {completedRestore.errorMessage}
              </p>
            </div>
          )}

          {/* Logs */}
          {completedRestore?.logs && (
            <div>
              <h4 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Restore Logs
              </h4>
              <pre className="max-h-48 overflow-auto rounded-lg bg-gray-900 p-4 text-xs text-green-400">
                {completedRestore.logs}
              </pre>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/backup-dashboard')}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => navigate('/backup-history')}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              History
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
            >
              New Restore
            </button>
          </div>
        </div>
      </ComponentCard>
    );
  };

  // Step labels for stepper
  const stepLabels: { key: WizardStep; label: string }[] = [
    { key: 'select', label: '1. Select' },
    { key: 'options', label: '2. Options' },
    { key: 'confirm', label: '3. Confirm' },
    { key: 'progress', label: '4. Progress' },
    { key: 'result', label: '5. Result' },
  ];

  const stepIndex = stepLabels.findIndex((s) => s.key === step);

  return (
    <>
      <PageMeta title="Restore Backup | MediTech Admin" />
      <PageBreadcrumb pageTitle="Restore from Backup" />

      <div className="space-y-6">
        {/* Stepper */}
        <div className="flex items-center justify-center gap-1">
          {stepLabels.map((s, i) => {
            const isActive = step === s.key;
            const isDone = i < stepIndex;
            return (
              <React.Fragment key={s.key}>
                {i > 0 && (
                  <div
                    className={`h-px w-6 sm:w-10 ${
                      isDone || isActive
                        ? 'bg-brand-500'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                )}
                <div
                  className={`rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${
                    isActive
                      ? 'bg-brand-500 text-white'
                      : isDone
                      ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                  }`}
                >
                  {isDone ? '✓ ' : ''}
                  {s.label}
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {step === 'select' && renderSelectStep()}
        {step === 'options' && renderOptionsStep()}
        {step === 'confirm' && renderConfirmStep()}
        {step === 'progress' && renderProgressStep()}
        {step === 'result' && renderResultStep()}
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

export default RestoreBackup;
