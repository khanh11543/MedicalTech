import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import departmentWorklistService, {
  WorklistItemDTO,
  ServiceResultDTO,
  ServiceResultAttachmentDTO,
  DEPARTMENT_LABELS,
} from '../../services/departmentWorklistService';
import { SERVICE_CATEGORY_LABELS } from '../../services/serviceOrderService';

type SaveMode = 'draft' | 'complete';

export default function ServiceResultForm() {
  const { serviceOrderId } = useParams<{ serviceOrderId: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [orderDetail, setOrderDetail] = useState<WorklistItemDTO | null>(null);
  const [result, setResult] = useState<ServiceResultDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<SaveMode | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form fields
  const [findings, setFindings] = useState('');
  const [conclusion, setConclusion] = useState('');
  const [notes, setNotes] = useState('');

  const orderId = Number(serviceOrderId);

  const fetchData = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const detail = await departmentWorklistService.getServiceOrderDetail(orderId);
      setOrderDetail(detail);

      // Try to load existing result
      try {
        const existingResult = await departmentWorklistService.getResult(orderId);
        setResult(existingResult);
        setFindings(existingResult.findings || '');
        setConclusion(existingResult.conclusion || '');
        setNotes(existingResult.notes || '');
      } catch {
        // No result yet — that's fine
      }
    } catch {
      setError('Failed to load service order details');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (mode: SaveMode) => {
    setSaving(mode);
    setError('');
    setSuccess('');
    try {
      const savedResult = await departmentWorklistService.saveResult(orderId, {
        findings,
        conclusion,
        notes,
        markCompleted: mode === 'complete',
      });
      setResult(savedResult);

      if (mode === 'complete') {
        setSuccess('Result submitted successfully! Service marked as COMPLETED.');
        setTimeout(() => navigate('/doctor/service-worklist'), 1500);
      } else {
        setSuccess('Draft saved successfully.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save result';
      setError(message);
    } finally {
      setSaving(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const updatedResult = await departmentWorklistService.uploadAttachment(orderId, file);
      setResult(updatedResult);
      setSuccess('File uploaded successfully.');
    } catch {
      setError('Failed to upload file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    try {
      await departmentWorklistService.deleteAttachment(orderId, attachmentId);
      setResult((prev) =>
        prev
          ? {
              ...prev,
              attachments: prev.attachments.filter((a) => a.id !== attachmentId),
            }
          : prev
      );
    } catch {
      setError('Failed to delete attachment');
    }
  };

  const isCompleted = orderDetail?.status === 'COMPLETED';
  const isReadOnly = isCompleted && result?.isDraft === false;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Service Result | Doctor Panel"
        description="Enter service result"
      />
      <PageBreadcrumb pageTitle="Service Result Form" />

      <div className="mx-auto max-w-4xl space-y-4">
        {/* Back button */}
        <button
          onClick={() => navigate('/doctor/service-worklist')}
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Worklist
        </button>

        {/* Service Order Info */}
        {orderDetail && (
          <div className="rounded-lg bg-white p-5 shadow-md dark:bg-gray-800">
            <h3 className="mb-3 text-lg font-bold text-gray-900 dark:text-white">
              Service Information
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <InfoField label="Service Order" value={`SO-${String(orderDetail.id).padStart(3, '0')}`} />
              <InfoField label="Service Name" value={orderDetail.serviceName} />
              <InfoField
                label="Category"
                value={SERVICE_CATEGORY_LABELS[orderDetail.category] || orderDetail.category}
              />
              <InfoField label="Patient" value={orderDetail.patientName || '—'} />
              <InfoField label="Appointment" value={orderDetail.appointmentCode || '—'} />
              <InfoField label="Ordered By" value={orderDetail.orderedByDoctorName} />
              <InfoField
                label="Department"
                value={DEPARTMENT_LABELS[orderDetail.targetDepartment] || orderDetail.targetDepartment}
              />
              <InfoField label="Priority" value={orderDetail.priority} />
              <InfoField label="Status" value={orderDetail.status.replace(/_/g, ' ')} />
            </div>
            {orderDetail.notes && (
              <div className="mt-3 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">
                <span className="font-medium">Clinical Notes:</span> {orderDetail.notes}
              </div>
            )}
          </div>
        )}

        {/* Alerts */}
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-300">
            {success}
          </div>
        )}

        {/* Result Form */}
        <div className="rounded-lg bg-white p-5 shadow-md dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
            {isReadOnly ? 'Service Result (Read Only)' : 'Enter Service Result'}
          </h3>

          <div className="space-y-4">
            {/* Findings */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Findings <span className="text-red-500">*</span>
              </label>
              <textarea
                value={findings}
                onChange={(e) => setFindings(e.target.value)}
                disabled={isReadOnly}
                rows={5}
                placeholder="Describe detailed findings from the examination..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 disabled:dark:bg-gray-800"
              />
            </div>

            {/* Impression / Conclusion */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Impression / Conclusion <span className="text-red-500">*</span>
              </label>
              <textarea
                value={conclusion}
                onChange={(e) => setConclusion(e.target.value)}
                disabled={isReadOnly}
                rows={3}
                placeholder="Summarize the conclusion or impression..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 disabled:dark:bg-gray-800"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Additional Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isReadOnly}
                rows={2}
                placeholder="Any additional notes or recommendations..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 disabled:dark:bg-gray-800"
              />
            </div>
          </div>
        </div>

        {/* Attachments */}
        <div className="rounded-lg bg-white p-5 shadow-md dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
            Attachments
          </h3>

          {/* Upload */}
          {!isReadOnly && (
            <div className="mb-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Upload Image / PDF
                  </>
                )}
              </button>
            </div>
          )}

          {/* Attachment List */}
          {result?.attachments && result.attachments.length > 0 ? (
            <div className="space-y-2">
              {result.attachments.map((att) => (
                <AttachmentItem
                  key={att.id}
                  attachment={att}
                  readOnly={isReadOnly}
                  onDelete={handleDeleteAttachment}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500">No attachments yet</p>
          )}
        </div>

        {/* Action Buttons */}
        {!isReadOnly && (
          <div className="flex justify-end gap-3 pb-6">
            <button
              onClick={() => navigate('/doctor/service-worklist')}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSave('draft')}
              disabled={saving !== null}
              className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300 disabled:opacity-50"
            >
              {saving === 'draft' ? 'Saving...' : 'Save Draft'}
            </button>
            <button
              onClick={() => handleSave('complete')}
              disabled={saving !== null || !findings.trim() || !conclusion.trim()}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {saving === 'complete' ? 'Submitting...' : 'Mark Completed'}
            </button>
          </div>
        )}

        {/* Read-only completion info */}
        {isReadOnly && result && (
          <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                Completed by <strong>{result.completedByDoctorName}</strong>
                {result.completedAt && (
                  <> on {new Date(result.completedAt).toLocaleString()}</>
                )}
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ── Helper Components ──

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium text-gray-900 dark:text-white">
        {value}
      </dd>
    </div>
  );
}

function AttachmentItem({
  attachment,
  readOnly,
  onDelete,
}: {
  attachment: ServiceResultAttachmentDTO;
  readOnly: boolean;
  onDelete: (id: number) => void;
}) {
  const isImage = attachment.fileType?.startsWith('image/');

  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
      {/* Icon */}
      {isImage ? (
        <img
          src={attachment.fileUrl}
          alt={attachment.fileName}
          className="h-12 w-12 rounded object-cover"
        />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-100 dark:bg-gray-700">
          <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
      )}

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
          {attachment.fileName}
        </p>
        {attachment.fileSize && (
          <p className="text-xs text-gray-500">
            {(attachment.fileSize / 1024).toFixed(1)} KB
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <a
          href={attachment.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded p-1 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30"
          title="Open"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
        {!readOnly && (
          <button
            onClick={() => onDelete(attachment.id)}
            className="rounded p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
            title="Delete"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
