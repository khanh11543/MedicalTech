import { useState, useEffect } from 'react';
import departmentWorklistService, {
  ServiceResultDTO,
  ServiceResultAttachmentDTO,
} from '../../services/departmentWorklistService';

interface ViewServiceResultModalProps {
  isOpen: boolean;
  serviceOrderId: number | null;
  serviceName: string;
  onClose: () => void;
}

export default function ViewServiceResultModal({
  isOpen,
  serviceOrderId,
  serviceName,
  onClose,
}: ViewServiceResultModalProps) {
  const [result, setResult] = useState<ServiceResultDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && serviceOrderId) {
      setLoading(true);
      setError('');
      departmentWorklistService
        .getResultForPrimaryDoctor(serviceOrderId)
        .then((data) => setResult(data))
        .catch(() => setError('Failed to load result'))
        .finally(() => setLoading(false));
    } else {
      setResult(null);
    }
  }, [isOpen, serviceOrderId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative mx-4 max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl dark:bg-gray-800">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Service Result
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{serviceName}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-3 border-blue-500 border-t-transparent" />
            </div>
          ) : error ? (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
              {error}
            </div>
          ) : result ? (
            <div className="space-y-5">
              {/* Meta */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Performed By
                  </label>
                  <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-white">
                    {result.completedByDoctorName || '—'}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                    Completed At
                  </label>
                  <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-white">
                    {result.completedAt
                      ? new Date(result.completedAt).toLocaleString()
                      : '—'}
                  </p>
                </div>
              </div>

              {/* Findings */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Findings
                </label>
                <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-800 whitespace-pre-wrap dark:bg-gray-700/50 dark:text-gray-200">
                  {result.findings || 'No findings recorded'}
                </div>
              </div>

              {/* Conclusion */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Impression / Conclusion
                </label>
                <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900 whitespace-pre-wrap dark:bg-blue-900/20 dark:text-blue-200">
                  {result.conclusion || 'No conclusion recorded'}
                </div>
              </div>

              {/* Notes */}
              {result.notes && (
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Additional Notes
                  </label>
                  <div className="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800 whitespace-pre-wrap dark:bg-yellow-900/20 dark:text-yellow-200">
                    {result.notes}
                  </div>
                </div>
              )}

              {/* Attachments */}
              {result.attachments && result.attachments.length > 0 && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Attachments ({result.attachments.length})
                  </label>
                  <div className="space-y-2">
                    {result.attachments.map((att) => (
                      <ResultAttachment key={att.id} attachment={att} />
                    ))}
                  </div>
                </div>
              )}

              {/* Draft warning */}
              {result.isDraft && (
                <div className="rounded-lg bg-orange-50 p-3 text-sm text-orange-700 dark:bg-orange-900/20 dark:text-orange-300">
                  This result is still a draft and has not been finalized by the department doctor.
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              No result available yet
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function ResultAttachment({ attachment }: { attachment: ServiceResultAttachmentDTO }) {
  const isImage = attachment.fileType?.startsWith('image/');

  return (
    <a
      href={attachment.fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
    >
      {isImage ? (
        <img
          src={attachment.fileUrl}
          alt={attachment.fileName}
          className="h-10 w-10 rounded object-cover"
        />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded bg-red-50 dark:bg-red-900/30">
          <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
          {attachment.fileName}
        </p>
        {attachment.fileSize && (
          <p className="text-xs text-gray-500">{(attachment.fileSize / 1024).toFixed(1)} KB</p>
        )}
      </div>
      <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  );
}
