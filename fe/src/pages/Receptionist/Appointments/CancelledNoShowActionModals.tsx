import { useState, useEffect } from "react";
import receptionistService from "../../../services/receptionistService";
import type { ReceptionistAppointmentListDTO } from "../../../services/receptionistService";

// ═══════════════════════════════ TYPES ═══════════════════════════════
interface ViewReasonModalProps {
  isOpen: boolean;
  appointment: ReceptionistAppointmentListDTO | null;
  onClose: () => void;
}

interface RebookModalProps {
  isOpen: boolean;
  appointment: ReceptionistAppointmentListDTO | null;
  onClose: () => void;
  onRebook: (data: { patientId: number; patientName: string; maskedPhone: string; doctorId?: number; doctorName?: string }) => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  CANCELLED: {
    label: "Cancelled",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-900/20",
    icon: (
      <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
  NO_SHOW: {
    label: "No-Show",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-900/20",
    icon: (
      <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

// ═══════════════════════════════════════════════════════════════════════
//  1) ViewReasonModal — show reason category + admin note, read-only
// ═══════════════════════════════════════════════════════════════════════
export function ViewReasonModal({ isOpen, appointment, onClose }: ViewReasonModalProps) {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [reasonCategory, setReasonCategory] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<string | null>(null);
  const [cancelledByName, setCancelledByName] = useState<string | null>(null);
  const [statusDate, setStatusDate] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !appointment) {
      setReason(null);
      setReasonCategory(null);
      setAdminNotes(null);
      setCancelledByName(null);
      setStatusDate(null);
      return;
    }

    const fetchReason = async () => {
      try {
        setLoading(true);
        const detail = await receptionistService.getAppointmentDetail(appointment.id);
        // cancellationReason from appointment card
        setReason(detail.appointment?.cancellationReason || null);
        setReasonCategory(detail.appointment?.reasonCategory || null);
        setAdminNotes(detail.appointment?.adminNotes || null);
        setCancelledByName(detail.appointment?.cancelledByName || null);
        setStatusDate(detail.updatedAt || null);
      } catch {
        // fallback — show what we know
        setReason(null);
      } finally {
        setLoading(false);
      }
    };
    fetchReason();
  }, [isOpen, appointment]);

  if (!isOpen || !appointment) return null;

  const cfg = STATUS_CONFIG[appointment.status] || STATUS_CONFIG.CANCELLED;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-4 ${appointment.status === "NO_SHOW" ? "bg-gradient-to-r from-orange-500 to-orange-600" : "bg-gradient-to-r from-red-500 to-red-600"}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">View Reason</h3>
                <p className="text-white/70 text-xs">{appointment.appointmentCode}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="px-6 py-10 text-center">
            <div className="w-8 h-8 border-3 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading reason...</p>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-4">
            {/* Status badge */}
            <div className={`flex items-center gap-3 p-3 rounded-lg ${cfg.bgColor}`}>
              <div className="flex-shrink-0">{cfg.icon}</div>
              <div>
                <p className={`text-sm font-bold ${cfg.color}`}>{cfg.label}</p>
                {statusDate && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {new Date(statusDate).toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                )}
              </div>
            </div>

            {/* Patient / Doctor summary */}
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Patient</span>
                <span className="font-medium text-gray-900 dark:text-white">{appointment.patientName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Doctor</span>
                <span className="font-medium text-gray-900 dark:text-white">{appointment.doctorName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Date/Time</span>
                <span className="text-gray-700 dark:text-gray-300">
                  {appointment.appointmentDate} • {appointment.startTime?.slice(0, 5)} – {appointment.endTime?.slice(0, 5)}
                </span>
              </div>
            </div>

            {/* Reason section */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {appointment.status === "NO_SHOW" ? "No-Show Reason" : "Cancellation Reason"}
              </h4>

              {/* Reason category */}
              {reasonCategory && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-20">Category</span>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bgColor} ${cfg.color}`}>
                    {reasonCategory}
                  </span>
                </div>
              )}

              {/* Reason text */}
              {reason ? (
                <div className={`p-3 rounded-lg border ${appointment.status === "NO_SHOW" ? "border-orange-200 dark:border-orange-800/30 bg-orange-50/50 dark:bg-orange-900/10" : "border-red-200 dark:border-red-800/30 bg-red-50/50 dark:bg-red-900/10"}`}>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{reason}</p>
                </div>
              ) : (
                <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                  <p className="text-sm text-gray-400 dark:text-gray-500 italic">No reason provided</p>
                </div>
              )}

              {/* Admin notes */}
              {adminNotes && (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase">Admin Notes</p>
                  <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                    <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{adminNotes}</p>
                  </div>
                </div>
              )}

              {/* Cancelled by */}
              {cancelledByName && (
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>
                    {appointment.status === "NO_SHOW" ? "Marked by" : "Cancelled by"}: <strong className="text-gray-700 dark:text-gray-300">{cancelledByName}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
          <button
            onClick={onClose}
            className="w-full py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  2) RebookModal — Confirm rebook, then redirect to CreateAppointment prefilled
// ═══════════════════════════════════════════════════════════════════════
export function RebookModal({ isOpen, appointment, onClose, onRebook }: RebookModalProps) {
  const [loading, setLoading] = useState(false);
  const [keepDoctor, setKeepDoctor] = useState(true);

  useEffect(() => {
    if (!isOpen) setKeepDoctor(true);
  }, [isOpen]);

  if (!isOpen || !appointment) return null;

  const handleRebook = () => {
    setLoading(true);
    // Small delay for UX feel, then trigger rebook callback
    setTimeout(() => {
      onRebook({
        patientId: appointment.patientId,
        patientName: appointment.patientName,
        maskedPhone: appointment.maskedPhone,
        doctorId: keepDoctor ? appointment.doctorId : undefined,
        doctorName: keepDoctor ? appointment.doctorName : undefined,
      });
      setLoading(false);
      onClose();
    }, 300);
  };

  const isCancelled = appointment.status === "CANCELLED";

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Rebook Appointment</h3>
                <p className="text-brand-100 text-xs">{appointment.appointmentCode}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Info callout */}
          <div className={`flex items-start gap-3 p-3 rounded-lg ${isCancelled ? "bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30" : "bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800/30"}`}>
            <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isCancelled ? "text-red-500" : "text-orange-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Previous appointment was {isCancelled ? "cancelled" : "marked as no-show"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                A new appointment will be created for the same patient. The old appointment ({appointment.appointmentCode}) will be linked in audit history.
              </p>
            </div>
          </div>

          {/* Patient info (locked) */}
          <div className="bg-brand-50 dark:bg-brand-900/10 rounded-lg p-3 border border-brand-100 dark:border-brand-800/30">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-xs font-medium text-brand-600 dark:text-brand-400 uppercase">Patient (locked)</span>
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{appointment.patientName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{appointment.maskedPhone}</p>
          </div>

          {/* Doctor preference */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Doctor Preference</p>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30"
                style={{ borderColor: keepDoctor ? "var(--color-brand-400)" : undefined }}
                onClick={() => setKeepDoctor(true)}
              >
                <input type="radio" name="doctor" checked={keepDoctor} onChange={() => setKeepDoctor(true)} className="text-brand-500 focus:ring-brand-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Same doctor — {appointment.doctorName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{appointment.doctorSpecialization}</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30"
                style={{ borderColor: !keepDoctor ? "var(--color-brand-400)" : undefined }}
                onClick={() => setKeepDoctor(false)}
              >
                <input type="radio" name="doctor" checked={!keepDoctor} onChange={() => setKeepDoctor(false)} className="text-brand-500 focus:ring-brand-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Choose different doctor</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Select doctor on next step</p>
                </div>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRebook}
              disabled={loading}
              className="flex-1 py-2.5 text-sm font-bold text-white bg-brand-500 rounded-xl hover:bg-brand-600 disabled:opacity-50 transition-colors shadow-lg shadow-brand-500/25"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Preparing...
                </span>
              ) : (
                "Continue to Rebook"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
