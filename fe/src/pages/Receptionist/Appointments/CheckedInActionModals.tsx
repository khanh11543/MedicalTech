import { useState, useEffect, useMemo } from "react";
import receptionistService from "../../../services/receptionistService";
import type { ReceptionistAppointmentListDTO } from "../../../services/receptionistService";

// ====================================================================
// 1) NOTIFY DOCTOR MODAL
// ====================================================================
interface NotifyDoctorModalProps {
  isOpen: boolean;
  appointment: ReceptionistAppointmentListDTO | null;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

type Priority = "NORMAL" | "URGENT" | "VIP";

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; icon: string; desc: string }> = {
  NORMAL: {
    label: "Normal",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    icon: "🔔",
    desc: "Standard notification — patient is in the queue",
  },
  URGENT: {
    label: "Urgent",
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    icon: "⚡",
    desc: "Urgent — patient has been waiting too long or has a medical need",
  },
  VIP: {
    label: "VIP",
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    icon: "⭐",
    desc: "VIP / Priority patient — needs immediate attention",
  },
};

export function NotifyDoctorModal({
  isOpen,
  appointment,
  onClose,
  onSuccess,
  onError,
}: NotifyDoctorModalProps) {
  const [priority, setPriority] = useState<Priority>("NORMAL");
  const [customMessage, setCustomMessage] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPriority("NORMAL");
      setCustomMessage("");
      setUseCustom(false);
    }
  }, [isOpen]);

  if (!isOpen || !appointment) return null;

  const formatTime = (t: string | undefined) => t?.substring(0, 5) || "—";

  // Generate default message (no PHI)
  const defaultMessage = `Patient for ${formatTime(appointment.startTime)} has checked in. Queue #${appointment.queueNumber ?? "—"}.${priority !== "NORMAL" ? ` [${priority}]` : ""}`;

  const handleSend = async () => {
    try {
      setLoading(true);
      await receptionistService.notifyDoctor(appointment.id, {
        priority,
        message: useCustom && customMessage.trim() ? customMessage.trim() : undefined,
      });
      onSuccess(
        `Doctor notified for ${appointment.appointmentCode} — ${appointment.doctorName}`
      );
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { message?: string } } };
      if (error?.response?.status === 400) {
        onError(error.response.data?.message || "Only checked-in appointments can trigger doctor notification");
      } else {
        onError(error?.response?.data?.message || "Failed to notify doctor");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notify Doctor</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Alert Dr. {appointment.doctorName} that patient is ready
            </p>
          </div>
        </div>

        {/* Appointment context (compact) */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 mb-4 grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Code: </span>
            <span className="font-mono font-medium text-gray-900 dark:text-white">{appointment.appointmentCode}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Queue: </span>
            <span className="font-bold text-green-600 dark:text-green-400">#{appointment.queueNumber ?? "—"}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Time: </span>
            <span className="text-gray-900 dark:text-white">{formatTime(appointment.startTime)} – {formatTime(appointment.endTime)}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Spec: </span>
            <span className="text-gray-900 dark:text-white">{appointment.doctorSpecialization}</span>
          </div>
        </div>

        {/* Priority selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority</label>
          <div className="space-y-2">
            {(Object.keys(PRIORITY_CONFIG) as Priority[]).map((p) => {
              const cfg = PRIORITY_CONFIG[p];
              return (
                <label
                  key={p}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    priority === p
                      ? cfg.color + " border-current"
                      : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="priority"
                    value={p}
                    checked={priority === p}
                    onChange={() => setPriority(p)}
                    className="w-4 h-4 text-teal-500 focus:ring-teal-500"
                  />
                  <span className="text-lg">{cfg.icon}</span>
                  <div>
                    <div className="text-sm font-medium">{cfg.label}</div>
                    <div className="text-xs opacity-75">{cfg.desc}</div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Custom message toggle */}
        <div className="mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={useCustom}
              onChange={(e) => setUseCustom(e.target.checked)}
              className="w-4 h-4 text-teal-500 rounded focus:ring-teal-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Custom message</span>
          </label>
          {useCustom && (
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Operational message (no patient health info)"
              maxLength={200}
              className="mt-2 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              rows={3}
            />
          )}
        </div>

        {/* Preview */}
        <div className="mb-5 p-3 bg-teal-50 dark:bg-teal-900/10 rounded-lg border border-teal-200 dark:border-teal-800">
          <div className="text-xs text-teal-600 dark:text-teal-400 mb-1 font-medium">Message Preview</div>
          <p className="text-sm text-teal-800 dark:text-teal-200">
            {useCustom && customMessage.trim() ? customMessage.trim() : defaultMessage}
          </p>
        </div>

        {/* PHI warning */}
        <div className="flex items-start gap-2 mb-5 text-xs text-gray-500 dark:text-gray-400">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>Messages must not contain patient health information (PHI). Only operational details (queue number, time, room) are allowed.</span>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={loading}
            className="px-5 py-2 text-sm rounded-lg bg-teal-500 hover:bg-teal-600 text-white font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Notify Doctor
          </button>
        </div>
      </div>
    </div>
  );
}

// ====================================================================
// 2) MARK NO-SHOW MODAL
// ====================================================================
interface MarkNoShowModalProps {
  isOpen: boolean;
  appointment: ReceptionistAppointmentListDTO | null;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

const NO_SHOW_REASONS = [
  { value: "no_response", label: "No response after calling" },
  { value: "left_before_turn", label: "Patient left before their turn" },
  { value: "unreachable", label: "Cannot reach patient (phone off)" },
  { value: "wrong_day", label: "Patient came on the wrong day" },
  { value: "did_not_arrive", label: "Patient did not arrive" },
  { value: "other", label: "Other" },
];

export function MarkNoShowModal({
  isOpen,
  appointment,
  onClose,
  onSuccess,
  onError,
}: MarkNoShowModalProps) {
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [sendNotification, setSendNotification] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setReason("");
      setCustomReason("");
      setSendNotification(true);
    }
  }, [isOpen]);

  if (!isOpen || !appointment) return null;

  const formatTime = (t: string | undefined) => t?.substring(0, 5) || "—";

  // Calculate lateness
  const lateInfo = useMemo(() => {
    const now = new Date();
    const [h, m] = (appointment.startTime || "00:00").split(":").map(Number);
    const aptDateTime = new Date(appointment.appointmentDate);
    aptDateTime.setHours(h, m, 0, 0);
    const diffMs = now.getTime() - aptDateTime.getTime();
    const lateMin = Math.round(diffMs / 60000);
    return {
      lateMin,
      isLate: lateMin > 0,
      tooEarly: lateMin < 15, // < 15 min after appointment start = too early to no-show
    };
  }, [appointment]);

  // Checked-in time (if available)
  const checkedInAt = appointment.checkedInAt
    ? new Date(appointment.checkedInAt).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : null;

  // Waiting time since check-in
  const waitingMin = useMemo(() => {
    if (!appointment.checkedInAt) return null;
    const now = new Date();
    const checkedIn = new Date(appointment.checkedInAt);
    return Math.round((now.getTime() - checkedIn.getTime()) / 60000);
  }, [appointment]);

  const finalReason = reason === "other" ? customReason.trim() : NO_SHOW_REASONS.find((r) => r.value === reason)?.label || reason;
  const canSubmit = reason !== "" && (reason !== "other" || customReason.trim().length > 0);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await receptionistService.markNoShow(appointment.id, {
        reason: finalReason,
        sendNotification,
      });
      onSuccess(`Marked as no-show: ${appointment.appointmentCode}`);
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { message?: string } } };
      if (error?.response?.status === 400) {
        onError(error.response.data?.message || "Cannot mark this appointment as no-show");
      } else if (error?.response?.status === 409) {
        onError("Appointment status changed. Please refresh and try again.");
      } else {
        onError(error?.response?.data?.message || "Failed to mark no-show");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Mark No-Show</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Remove from queue and release slot
            </p>
          </div>
        </div>

        {/* Patient summary */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Code</span>
            <span className="font-mono font-medium text-gray-900 dark:text-white">{appointment.appointmentCode}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Patient</span>
            <span className="font-medium text-gray-900 dark:text-white">{appointment.patientName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Doctor</span>
            <span className="text-gray-900 dark:text-white">{appointment.doctorName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Scheduled</span>
            <span className="text-gray-900 dark:text-white">{formatTime(appointment.startTime)} – {formatTime(appointment.endTime)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Queue</span>
            <span className="font-bold text-gray-900 dark:text-white">#{appointment.queueNumber ?? "—"}</span>
          </div>
        </div>

        {/* Lateness / waiting info */}
        <div className="flex flex-wrap gap-3 mb-4">
          {/* Check-in time */}
          {checkedInAt && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 text-sm">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-blue-700 dark:text-blue-300">
                Checked in at <span className="font-medium">{checkedInAt}</span>
              </span>
            </div>
          )}

          {/* Waiting time */}
          {waitingMin !== null && waitingMin > 0 && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border ${
              waitingMin > 30
                ? "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800"
                : "bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700"
            }`}>
              <span className={waitingMin > 30 ? "text-amber-700 dark:text-amber-300" : "text-gray-700 dark:text-gray-300"}>
                Waiting: <span className="font-medium">{waitingMin} min</span>
              </span>
            </div>
          )}

          {/* Late indicator */}
          {lateInfo.isLate && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-sm">
              <span className="text-red-700 dark:text-red-300">
                <span className="font-medium">{lateInfo.lateMin} min</span> past appointment
              </span>
            </div>
          )}
        </div>

        {/* Too-early warning */}
        {lateInfo.tooEarly && (
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div className="text-sm text-amber-700 dark:text-amber-300">
                <span className="font-medium">Less than 15 minutes since appointment time</span> — It may be too early to mark as no-show. Consider waiting longer or calling the patient first.
              </div>
            </div>
          </div>
        )}

        {/* Reason dropdown */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Reason <span className="text-red-500">*</span>
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="">-- Select reason --</option>
            {NO_SHOW_REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          {reason === "other" && (
            <textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Describe the reason..."
              className="mt-2 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows={2}
            />
          )}
        </div>

        {/* Notification toggle */}
        <div className="mb-5">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={sendNotification}
              onChange={(e) => setSendNotification(e.target.checked)}
              className="w-4 h-4 text-red-500 rounded focus:ring-red-500"
            />
            <div>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Send notification to patient
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                SMS to {appointment.maskedPhone} informing about the no-show
              </p>
            </div>
          </label>
        </div>

        {/* Impact summary */}
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-5">
          <div className="text-sm text-red-700 dark:text-red-300 space-y-1">
            <div className="font-medium">This action will:</div>
            <ul className="list-disc list-inside text-xs space-y-0.5 opacity-90">
              <li>Change status from CHECKED_IN to NO_SHOW</li>
              <li>Remove patient from the doctor's queue</li>
              <li>Record the no-show in patient history</li>
              {sendNotification && <li>Send notification to the patient</li>}
            </ul>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !canSubmit}
            className="px-5 py-2 text-sm rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            Mark No-Show
          </button>
        </div>
      </div>
    </div>
  );
}
