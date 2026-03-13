import type { AppointmentStatus, DoctorQueueStatus } from "../../../services/queueService";

// ==================== NO-SHOW ELIGIBILITY ====================

const NO_SHOW_GRACE_PERIOD_MINUTES = 15;

/**
 * Check whether a patient is eligible to be marked as No-Show.
 * Conditions:
 *  1. Status must be CONFIRMED or CHECKED_IN
 *  2. Current time must be past appointmentTime + grace period (15 min)
 */
export function canMarkNoShow(
  status: AppointmentStatus | string,
  appointmentTime: string | null | undefined
): boolean {
  // 1. Status check
  if (status !== "CONFIRMED" && status !== "CHECKED_IN") return false;

  // 2. Time check: must be past appointment time + grace period
  if (!appointmentTime) return false;
  const now = new Date();
  const [hours, minutes] = appointmentTime.split(":").map(Number);
  const apptDate = new Date();
  apptDate.setHours(hours, minutes, 0, 0);
  const graceEnd = new Date(apptDate.getTime() + NO_SHOW_GRACE_PERIOD_MINUTES * 60 * 1000);
  return now > graceEnd;
}

/**
 * Returns the number of minutes remaining before no-show can be marked, or 0 if eligible.
 */
export function noShowGraceRemaining(
  appointmentTime: string | null | undefined
): number {
  if (!appointmentTime) return 0;
  const now = new Date();
  const [hours, minutes] = appointmentTime.split(":").map(Number);
  const apptDate = new Date();
  apptDate.setHours(hours, minutes, 0, 0);
  const graceEnd = new Date(apptDate.getTime() + NO_SHOW_GRACE_PERIOD_MINUTES * 60 * 1000);
  const remaining = Math.ceil((graceEnd.getTime() - now.getTime()) / 60000);
  return remaining > 0 ? remaining : 0;
}

// ==================== STATUS HELPERS ====================

export const DOCTOR_STATUS_CONFIG: Record<
  DoctorQueueStatus,
  { label: string; color: string; bgColor: string; dotColor: string }
> = {
  AVAILABLE: {
    label: "Available",
    color: "text-green-700 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    dotColor: "bg-green-500",
  },
  BUSY: {
    label: "Busy",
    color: "text-blue-700 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    dotColor: "bg-blue-500",
  },
  ON_BREAK: {
    label: "On Break",
    color: "text-amber-700 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    dotColor: "bg-amber-500",
  },
  OFFLINE: {
    label: "Offline",
    color: "text-gray-500 dark:text-gray-400",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    dotColor: "bg-gray-400",
  },
};

export const PATIENT_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string; borderColor: string }
> = {
  CHECKED_IN: {
    label: "Waiting",
    color: "text-green-700 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-900/20",
    borderColor: "border-l-green-500",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "text-blue-700 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    borderColor: "border-l-blue-500",
  },
  COMPLETED: {
    label: "Completed",
    color: "text-gray-500 dark:text-gray-400",
    bgColor: "bg-gray-50 dark:bg-gray-900/20",
    borderColor: "border-l-gray-400",
  },
  NO_SHOW: {
    label: "No Show",
    color: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-900/20",
    borderColor: "border-l-red-500",
  },
};

export function getDoctorStatusConfig(status: DoctorQueueStatus) {
  return DOCTOR_STATUS_CONFIG[status] || DOCTOR_STATUS_CONFIG.OFFLINE;
}

export function getPatientStatusConfig(status: string) {
  return PATIENT_STATUS_CONFIG[status] || PATIENT_STATUS_CONFIG.CHECKED_IN;
}

// ==================== FORMAT HELPERS ====================

export function formatTime(time: string | null | undefined): string {
  if (!time) return "—";
  // Handle "HH:mm:ss" or "HH:mm" format
  const parts = time.split(":");
  if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
  return time;
}

export function formatWaitTime(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return "—";
  if (minutes < 1) return "Just arrived";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
}

export function formatTimestamp(timestamp: string | null | undefined): string {
  if (!timestamp) return "—";
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// ==================== EVENT TYPE HELPERS ====================

export const AUDIT_EVENT_CONFIG: Record<
  string,
  { label: string; icon: string; color: string }
> = {
  QUEUE_CALL: {
    label: "Patient Called",
    icon: "M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z",
    color: "text-blue-600 dark:text-blue-400",
  },
  QUEUE_REORDER: {
    label: "Queue Reordered",
    icon: "M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4",
    color: "text-amber-600 dark:text-amber-400",
  },
  QUEUE_MOVE: {
    label: "Patient Moved",
    icon: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4",
    color: "text-purple-600 dark:text-purple-400",
  },
  QUEUE_NO_SHOW: {
    label: "No Show",
    icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636",
    color: "text-red-600 dark:text-red-400",
  },
  QUEUE_WALK_IN: {
    label: "Walk-In Added",
    icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z",
    color: "text-green-600 dark:text-green-400",
  },
  DOCTOR_STATUS_CHANGE: {
    label: "Status Changed",
    icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
    color: "text-gray-600 dark:text-gray-400",
  },
};

export function getAuditEventConfig(eventType: string) {
  return (
    AUDIT_EVENT_CONFIG[eventType] || {
      label: eventType,
      icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      color: "text-gray-500",
    }
  );
}

// ==================== SHARED COMPONENTS ====================

/** Stat card used in queue summary header */
export function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "green" | "blue" | "gray" | "red" | "amber" | "brand";
}) {
  const colorMap: Record<string, string> = {
    green: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300",
    blue: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300",
    gray: "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300",
    red: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300",
    amber: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300",
    brand: "bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300",
  };
  const labelColorMap: Record<string, string> = {
    green: "text-green-600 dark:text-green-400",
    blue: "text-blue-600 dark:text-blue-400",
    gray: "text-gray-600 dark:text-gray-400",
    red: "text-red-600 dark:text-red-400",
    amber: "text-amber-600 dark:text-amber-400",
    brand: "text-brand-600 dark:text-brand-400",
  };

  return (
    <div className={`rounded-xl p-4 border ${colorMap[color]}`}>
      <p className={`text-sm font-medium ${labelColorMap[color]}`}>{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}

/** Queue number badge */
export function QueueBadge({
  number,
  size = "md",
}: {
  number: number | null;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-12 h-12 text-lg",
    lg: "w-16 h-16 text-2xl",
  };
  return (
    <div
      className={`flex-shrink-0 ${sizeClasses[size]} rounded-xl bg-brand-500 flex items-center justify-center`}
    >
      <span className="font-bold text-white">{number ?? "—"}</span>
    </div>
  );
}

/** Doctor status badge (pill) */
export function DoctorStatusBadge({
  status,
}: {
  status: DoctorQueueStatus;
}) {
  const config = getDoctorStatusConfig(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`}></span>
      {config.label}
    </span>
  );
}

/** Patient status badge */
export function PatientStatusBadge({ status }: { status: string }) {
  const config = getPatientStatusConfig(status);
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.bgColor} ${config.color}`}
    >
      {config.label}
    </span>
  );
}

/** Loading spinner */
export function QueueLoading() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}

/** Empty state */
export function QueueEmpty({ message }: { message: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-center py-16">
      <svg
        className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <p className="text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  );
}

/** Confirmation dialog */
export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel,
  confirmColor = "brand",
  onConfirm,
  onCancel,
  loading,
}: {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmColor?: "brand" | "red" | "green";
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  if (!isOpen) return null;

  const btnColor = {
    brand: "bg-brand-500 hover:bg-brand-600",
    red: "bg-red-500 hover:bg-red-600",
    green: "bg-green-500 hover:bg-green-600",
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50"></div>
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          {message}
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${btnColor[confirmColor]}`}
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Toast notification */
export function useToast() {
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const ToastComponent = () => {
    if (!toast) return null;
    const colors = {
      success: "bg-green-500",
      error: "bg-red-500",
      info: "bg-blue-500",
    };
    return (
      <div className="fixed top-4 right-4 z-[10000] animate-slide-in">
        <div
          className={`${colors[toast.type]} text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2`}
        >
          {toast.type === "success" && (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {toast.type === "error" && (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {toast.message}
        </div>
      </div>
    );
  };

  return { showToast, ToastComponent };
}

// Need this import at top:
import { useState } from "react";
