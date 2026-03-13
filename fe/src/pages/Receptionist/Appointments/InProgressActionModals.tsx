import { useState, useEffect } from "react";
import type { ReceptionistAppointmentListDTO } from "../../../services/receptionistService";
import receptionistService from "../../../services/receptionistService";

// ─────────────────────────── Types ───────────────────────────
interface ViewInProgressModalProps {
  isOpen: boolean;
  appointment: ReceptionistAppointmentListDTO | null;
  onClose: () => void;
}

// ─────────────────────────── ViewInProgressModal ───────────────────────────
// Read-only operational view for IN_PROGRESS appointments.
// Shows: code, time, doctor, room, queue#, payment status — no actions.
export function ViewInProgressModal({ isOpen, appointment, onClose }: ViewInProgressModalProps) {
  const [room, setRoom] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Fetch room from detail endpoint (list DTO doesn't include it)
  useEffect(() => {
    if (!isOpen || !appointment) {
      setRoom(null);
      return;
    }
    let cancelled = false;
    const fetchRoom = async () => {
      try {
        setLoadingDetail(true);
        const detail = await receptionistService.getAppointmentDetail(appointment.id);
        if (!cancelled) {
          setRoom(detail.doctor?.room || null);
        }
      } catch {
        if (!cancelled) setRoom(null);
      } finally {
        if (!cancelled) setLoadingDetail(false);
      }
    };
    fetchRoom();
    return () => { cancelled = true; };
  }, [isOpen, appointment]);

  if (!isOpen || !appointment) return null;

  // Elapsed time calculation
  const getElapsedTime = (): string | null => {
    if (!appointment.checkedInAt) return null;
    const checkedIn = new Date(appointment.checkedInAt);
    const now = new Date();
    const diffMs = now.getTime() - checkedIn.getTime();
    if (diffMs < 0) return null;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m`;
  };

  // Payment badge helper
  const getPaymentInfo = () => {
    const status = appointment.paymentStatus || "UNKNOWN";
    const configs: Record<string, { label: string; color: string; bg: string }> = {
      PAID: { label: "Paid", color: "text-green-700 dark:text-green-300", bg: "bg-green-100 dark:bg-green-900/30" },
      UNPAID: { label: "Unpaid", color: "text-red-700 dark:text-red-300", bg: "bg-red-100 dark:bg-red-900/30" },
      PENDING: { label: "Pending", color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-100 dark:bg-amber-900/30" },
      PARTIAL: { label: "Partial", color: "text-orange-700 dark:text-orange-300", bg: "bg-orange-100 dark:bg-orange-900/30" },
      WAIVED: { label: "Waived", color: "text-gray-600 dark:text-gray-400", bg: "bg-gray-100 dark:bg-gray-700" },
      INSURANCE: { label: "Insurance", color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-100 dark:bg-blue-900/30" },
    };
    return configs[status] || { label: status, color: "text-gray-600 dark:text-gray-400", bg: "bg-gray-100 dark:bg-gray-700" };
  };

  const elapsed = getElapsedTime();
  const paymentInfo = getPaymentInfo();

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header - Purple theme for IN_PROGRESS */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                {/* Stethoscope / medical icon */}
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">In Progress</h3>
                <p className="text-purple-100 text-xs">Read-only view</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Live indicator */}
        <div className="bg-purple-50 dark:bg-purple-900/20 px-6 py-2.5 border-b border-purple-100 dark:border-purple-800/40">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
            </span>
            <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
              Consultation in progress
              {elapsed && <span className="ml-1 text-purple-500 dark:text-purple-400">• {elapsed} elapsed</span>}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4">
          {/* Info rows */}
          <div className="space-y-3">
            {/* Appointment Code */}
            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700/50">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
                <span className="text-sm text-gray-500 dark:text-gray-400">Code</span>
              </div>
              <span className="text-sm font-bold font-mono text-gray-900 dark:text-white">
                {appointment.appointmentCode}
              </span>
            </div>

            {/* Scheduled Time */}
            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700/50">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-gray-500 dark:text-gray-400">Time</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {appointment.startTime?.substring(0, 5)} – {appointment.endTime?.substring(0, 5)}
              </span>
            </div>

            {/* Doctor */}
            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700/50">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-sm text-gray-500 dark:text-gray-400">Doctor</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{appointment.doctorName}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{appointment.doctorSpecialization}</div>
              </div>
            </div>

            {/* Room */}
            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700/50">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="text-sm text-gray-500 dark:text-gray-400">Room</span>
              </div>
              {loadingDetail ? (
                <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {room || "—"}
                </span>
              )}
            </div>

            {/* Queue Number */}
            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700/50">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                <span className="text-sm text-gray-500 dark:text-gray-400">Queue #</span>
              </div>
              {appointment.queueNumber ? (
                <span className="inline-flex items-center justify-center w-8 h-8 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-bold">
                  {appointment.queueNumber}
                </span>
              ) : (
                <span className="text-sm text-gray-400">—</span>
              )}
            </div>

            {/* Payment Status */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-sm text-gray-500 dark:text-gray-400">Payment</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${paymentInfo.color} ${paymentInfo.bg}`}>
                  {paymentInfo.label}
                </span>
                {appointment.fee != null && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {appointment.fee.toLocaleString()} ₫
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Patient info (minimal — no PHI) */}
          <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Patient</span>
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{appointment.patientName}</p>
          </div>

          {/* Info notice */}
          <div className="flex items-start gap-2 bg-purple-50 dark:bg-purple-900/10 rounded-lg p-3 border border-purple-100 dark:border-purple-800/30">
            <svg className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-purple-600 dark:text-purple-400">
              This appointment is currently with the doctor. No actions are available until the consultation is completed.
            </p>
          </div>
        </div>

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
