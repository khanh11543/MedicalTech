import type { ReceptionistAppointmentListDTO } from "../../../services/receptionistService";
import { ACTIONS_PER_STATUS } from "./constants";

interface ActionMenuProps {
  appointment: ReceptionistAppointmentListDTO;
  onAction: (action: string, appointment: ReceptionistAppointmentListDTO) => void;
}

// ── Button style config per action ──
// Each action has a short label and a color scheme (bg, hover, text)
const ACTION_BUTTON_CONFIG: Record<
  string,
  { label: string; bg: string; hover: string; text: string }
> = {
  // ── PENDING ──
  VIEW: {
    label: "View",
    bg: "bg-gray-500",
    hover: "hover:bg-gray-600",
    text: "text-white",
  },
  CONFIRM: {
    label: "Confirm",
    bg: "bg-blue-500",
    hover: "hover:bg-blue-600",
    text: "text-white",
  },
  RESCHEDULE: {
    label: "Reschedule",
    bg: "bg-amber-500",
    hover: "hover:bg-amber-600",
    text: "text-white",
  },
  CANCEL: {
    label: "Cancel",
    bg: "bg-red-500",
    hover: "hover:bg-red-600",
    text: "text-white",
  },

  // ── CONFIRMED ──
  CHECK_IN: {
    label: "Check-in",
    bg: "bg-green-500",
    hover: "hover:bg-green-600",
    text: "text-white",
  },
  SEND_REMINDER: {
    label: "Reminder",
    bg: "bg-indigo-500",
    hover: "hover:bg-indigo-600",
    text: "text-white",
  },
  PRINT_SLIP: {
    label: "Print Slip",
    bg: "bg-cyan-500",
    hover: "hover:bg-cyan-600",
    text: "text-white",
  },

  // ── CHECKED_IN ──
  VIEW_QUEUE: {
    label: "Queue",
    bg: "bg-violet-500",
    hover: "hover:bg-violet-600",
    text: "text-white",
  },
  MARK_NO_SHOW: {
    label: "No-show",
    bg: "bg-orange-500",
    hover: "hover:bg-orange-600",
    text: "text-white",
  },
  NOTIFY_DOCTOR: {
    label: "Notify Dr.",
    bg: "bg-teal-500",
    hover: "hover:bg-teal-600",
    text: "text-white",
  },

  // ── COMPLETED ──
  COLLECT_PAYMENT: {
    label: "Collect Pay",
    bg: "bg-emerald-500",
    hover: "hover:bg-emerald-600",
    text: "text-white",
  },
  RECEIPT: {
    label: "Receipt",
    bg: "bg-sky-500",
    hover: "hover:bg-sky-600",
    text: "text-white",
  },
  CREATE_FOLLOW_UP: {
    label: "Follow-up",
    bg: "bg-brand-500",
    hover: "hover:bg-brand-600",
    text: "text-white",
  },

  // ── CANCELLED / NO_SHOW ──
  VIEW_REASON: {
    label: "Reason",
    bg: "bg-gray-500",
    hover: "hover:bg-gray-600",
    text: "text-white",
  },
  REBOOK: {
    label: "Rebook",
    bg: "bg-brand-500",
    hover: "hover:bg-brand-600",
    text: "text-white",
  },
  COLLECT_RX_PAYMENT: {
    label: "Pay Rx",
    bg: "bg-teal-600",
    hover: "hover:bg-teal-700",
    text: "text-white",
  },
  COLLECT_SO_PAYMENT: {
    label: "Pay Services",
    bg: "bg-orange-500",
    hover: "hover:bg-orange-600",
    text: "text-white",
  },
};

export default function ActionMenu({ appointment, onAction }: ActionMenuProps) {
  const baseActions = ACTIONS_PER_STATUS[appointment.status] || ["VIEW"];

  // Filter actions based on payment status for all statuses
  const actions = baseActions.filter((action) => {
    const paid = appointment.paymentStatus === "PAID";
    if (action === "COLLECT_PAYMENT" && paid) return false;   // already paid → hide Collect
    if (action === "RECEIPT" && !paid) return false;           // not paid yet → no receipt
    // Hide COLLECT_RX_PAYMENT if no prescription or already paid
    if (action === "COLLECT_RX_PAYMENT") {
      if (!appointment.prescriptionId) return false;
      if (appointment.prescriptionPaymentStatus === "PAID") return false;
    }
    return true;
  });

  return (
    <div className="flex flex-wrap items-center gap-1 justify-end">
      {actions.map((action) => {
        const cfg = ACTION_BUTTON_CONFIG[action] || {
          label: action,
          bg: "bg-gray-500",
          hover: "hover:bg-gray-600",
          text: "text-white",
        };
        return (
          <button
            key={action}
            onClick={() => onAction(action, appointment)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md ${cfg.bg} ${cfg.hover} ${cfg.text} transition-colors whitespace-nowrap shadow-sm`}
          >
            {cfg.label}
          </button>
        );
      })}
    </div>
  );
}
