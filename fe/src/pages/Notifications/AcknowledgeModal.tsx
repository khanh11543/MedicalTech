import { Modal } from "../../components/ui/modal";
import type { NotificationDTO } from "../../services/notificationService";

interface AcknowledgeModalProps {
  isOpen: boolean;
  notification: NotificationDTO | null;
  onConfirm: () => void;
  onClose: () => void;
  isLoading?: boolean;
}

export default function AcknowledgeModal({
  isOpen,
  notification,
  onConfirm,
  onClose,
  isLoading = false,
}: AcknowledgeModalProps) {
  if (!notification) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md p-0">
      <div className="p-6">
        {/* Urgent icon */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <svg
            className="h-7 w-7 text-red-600 dark:text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Title */}
        <h3 className="mt-4 text-center text-lg font-semibold text-gray-900 dark:text-white">
          Urgent Notification
        </h3>
        <p className="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
          This notification requires your acknowledgment
        </p>

        {/* Notification content */}
        <div className="mt-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 p-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
            {notification.title}
          </h4>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {notification.message}
          </p>
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
            {new Date(notification.createdAt).toLocaleString()}
          </p>
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Later
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            Acknowledge
          </button>
        </div>
      </div>
    </Modal>
  );
}
