import type { AppointmentStatus } from "../../../services/receptionistService";

export const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: {
    label: "Pending",
    color: "text-yellow-800 dark:text-yellow-400",
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  CONFIRMED: {
    label: "Confirmed",
    color: "text-blue-800 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/30",
  },
  CHECKED_IN: {
    label: "Checked In",
    color: "text-green-800 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "text-indigo-800 dark:text-indigo-400",
    bg: "bg-indigo-100 dark:bg-indigo-900/30",
  },
  AWAITING_SERVICE_RESULTS: {
    label: "Awaiting Results",
    color: "text-cyan-800 dark:text-cyan-400",
    bg: "bg-cyan-100 dark:bg-cyan-900/30",
  },
  COMPLETED: {
    label: "Completed",
    color: "text-emerald-800 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "text-red-800 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/30",
  },
  NO_SHOW: {
    label: "No Show",
    color: "text-gray-800 dark:text-gray-400",
    bg: "bg-gray-100 dark:bg-gray-900/30",
  },
  RESCHEDULED: {
    label: "Rescheduled",
    color: "text-orange-800 dark:text-orange-400",
    bg: "bg-orange-100 dark:bg-orange-900/30",
  },
};

export const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: {
    label: "Unpaid",
    color: "text-orange-800 dark:text-orange-400",
    bg: "bg-orange-100 dark:bg-orange-900/30",
  },
  PAID: {
    label: "Paid",
    color: "text-green-800 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "text-red-800 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/30",
  },
};

export const ALL_STATUSES: AppointmentStatus[] = [
  "PENDING",
  "CONFIRMED",
  "CHECKED_IN",
  "IN_PROGRESS",
  "AWAITING_SERVICE_RESULTS",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
];

export const HISTORY_STATUSES: AppointmentStatus[] = ["COMPLETED", "CANCELLED", "NO_SHOW"];

// Actions allowed per status for the receptionist
export const ACTIONS_PER_STATUS: Record<string, string[]> = {
  PENDING: ["VIEW", "CONFIRM", "RESCHEDULE", "CANCEL", "COLLECT_PAYMENT", "RECEIPT"],
  CONFIRMED: ["CHECK_IN", "RESCHEDULE", "CANCEL", "SEND_REMINDER", "PRINT_SLIP", "COLLECT_PAYMENT", "RECEIPT"],
  CHECKED_IN: ["VIEW_QUEUE", "MARK_NO_SHOW", "NOTIFY_DOCTOR", "COLLECT_PAYMENT", "RECEIPT", "COLLECT_RX_PAYMENT"],
  IN_PROGRESS: ["VIEW", "COLLECT_PAYMENT", "RECEIPT", "COLLECT_RX_PAYMENT"],
  AWAITING_SERVICE_RESULTS: ["VIEW", "COLLECT_PAYMENT", "RECEIPT", "COLLECT_RX_PAYMENT"],
  COMPLETED: ["COLLECT_PAYMENT", "RECEIPT", "CREATE_FOLLOW_UP", "COLLECT_RX_PAYMENT"],
  CANCELLED: ["VIEW_REASON", "REBOOK"],
  NO_SHOW: ["VIEW_REASON", "REBOOK"],
};

export const PAGE_SIZE_OPTIONS = [10, 20, 50];
