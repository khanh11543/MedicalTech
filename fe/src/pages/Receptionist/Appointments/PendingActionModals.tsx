import { useState, useEffect, useCallback } from "react";
import receptionistService from "../../../services/receptionistService";
import type { ReceptionistAppointmentListDTO } from "../../../services/receptionistService";

// ====================================================================
// 1) CONFIRM APPOINTMENT MODAL
// ====================================================================
interface ConfirmModalProps {
  isOpen: boolean;
  appointment: ReceptionistAppointmentListDTO | null;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export function ConfirmAppointmentModal({
  isOpen,
  appointment,
  onClose,
  onSuccess,
  onError,
}: ConfirmModalProps) {
  const [sendNotification, setSendNotification] = useState(true);
  const [adminNote, setAdminNote] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSendNotification(true);
      setAdminNote("");
    }
  }, [isOpen]);

  if (!isOpen || !appointment) return null;

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await receptionistService.confirmAppointment(
        appointment.id,
        adminNote || undefined
      );
      onSuccess(
        `Appointment ${appointment.appointmentCode} confirmed successfully${sendNotification ? " — notification sent" : ""}`
      );
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { message?: string } } };
      if (error?.response?.status === 409) {
        onError(
          error.response.data?.message ||
            "Slot conflict — this time slot is no longer available. Please reschedule."
        );
      } else {
        onError(
          error?.response?.data?.message || "Failed to confirm appointment"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Confirm Appointment
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Review details before confirming
            </p>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Code</span>
            <span className="font-mono font-medium text-gray-900 dark:text-white">
              {appointment.appointmentCode}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Patient</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {appointment.patientName}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Doctor</span>
            <span className="text-gray-900 dark:text-white">
              {appointment.doctorName}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              Specialization
            </span>
            <span className="text-gray-900 dark:text-white">
              {appointment.doctorSpecialization}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Date</span>
            <span className="text-gray-900 dark:text-white">
              {appointment.appointmentDate}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Time</span>
            <span className="text-gray-900 dark:text-white">
              {appointment.startTime} – {appointment.endTime}
            </span>
          </div>
        </div>

        {/* Notification toggle */}
        <label className="flex items-center gap-3 mb-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={sendNotification}
            onChange={(e) => setSendNotification(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Send SMS/Email confirmation to patient
          </span>
        </label>

        {/* Admin note (optional) */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Admin Note{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            placeholder="e.g. Confirmed via phone call"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
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
            onClick={handleConfirm}
            disabled={loading}
            className="px-5 py-2 text-sm rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            Confirm Appointment
          </button>
        </div>
      </div>
    </div>
  );
}

// ====================================================================
// 2) RESCHEDULE APPOINTMENT MODAL
// ====================================================================
interface RescheduleModalProps {
  isOpen: boolean;
  appointment: ReceptionistAppointmentListDTO | null;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

const RESCHEDULE_REASONS = [
  "Patient requested",
  "Doctor unavailable",
  "Clinic schedule change",
  "Emergency conflict",
  "Other",
];

interface SlotOption {
  id: number;
  slotDate: string;
  startTime: string;
  endTime: string;
  status: string;
  isAvailable: boolean;
}

export function RescheduleModal({
  isOpen,
  appointment,
  onClose,
  onSuccess,
  onError,
}: RescheduleModalProps) {
  const [newDate, setNewDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<SlotOption | null>(null);
  const [reason, setReason] = useState(RESCHEDULE_REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<SlotOption[]>([]);

  useEffect(() => {
    if (isOpen) {
      setNewDate("");
      setSelectedSlot(null);
      setReason(RESCHEDULE_REASONS[0]);
      setCustomReason("");
      setAvailableSlots([]);
    }
  }, [isOpen]);

  // Fetch available slots when date changes
  const fetchSlots = useCallback(async () => {
    if (!newDate || !appointment) return;
    try {
      setSlotsLoading(true);
      const slots = await receptionistService.getAvailableSlots(
        appointment.doctorId,
        newDate,
        newDate
      );
      setAvailableSlots(slots.filter((s) => s.isAvailable));
    } catch {
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [newDate, appointment]);

  useEffect(() => {
    fetchSlots();
    setSelectedSlot(null);
  }, [fetchSlots]);

  if (!isOpen || !appointment) return null;

  // Min date: tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  const finalReason = reason === "Other" ? customReason : reason;

  const handleReschedule = async () => {
    if (!selectedSlot) {
      onError("Please select a new time slot");
      return;
    }
    if (!finalReason.trim()) {
      onError("Reason is required");
      return;
    }
    try {
      setLoading(true);
      await receptionistService.rescheduleAppointment(appointment.id, {
        newDate: selectedSlot.slotDate,
        newStartTime: selectedSlot.startTime,
        newEndTime: selectedSlot.endTime,
        reason: finalReason,
      });
      onSuccess(
        `Appointment ${appointment.appointmentCode} rescheduled to ${selectedSlot.slotDate} ${selectedSlot.startTime}–${selectedSlot.endTime}`
      );
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { message?: string } } };
      if (error?.response?.status === 409) {
        onError("Slot conflict — please pick another slot.");
        fetchSlots(); // Refresh available slots
      } else {
        onError(error?.response?.data?.message || "Reschedule failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Reschedule Appointment
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Pick a new date and time slot
            </p>
          </div>
        </div>

        {/* Current schedule preview */}
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
          <div className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase mb-1">
            Current Schedule
          </div>
          <div className="text-sm text-gray-900 dark:text-white">
            <span className="font-mono">{appointment.appointmentCode}</span>{" "}
            — {appointment.patientName} with {appointment.doctorName}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {appointment.appointmentDate}{" "}
            {appointment.startTime}–{appointment.endTime}
          </div>
        </div>

        {/* New date picker */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            New Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={newDate}
            min={minDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>

        {/* Available slots */}
        {newDate && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Available Slots
            </label>
            {slotsLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                Loading slots…
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400 py-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg px-3">
                No available slots for this date. Try another day.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                {availableSlots.map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => setSelectedSlot(slot)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                      selectedSlot?.id === slot.id
                        ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                        : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                    }`}
                  >
                    {slot.startTime?.substring(0, 5)}–{slot.endTime?.substring(0, 5)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Preview old → new */}
        {selectedSlot && (
          <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-4">
            <div className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase mb-1">
              New Schedule
            </div>
            <div className="text-sm text-gray-900 dark:text-white">
              {selectedSlot.slotDate}{" "}
              {selectedSlot.startTime?.substring(0, 5)}–{selectedSlot.endTime?.substring(0, 5)}
            </div>
          </div>
        )}

        {/* Reason */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Reason <span className="text-red-500">*</span>
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            {RESCHEDULE_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          {reason === "Other" && (
            <textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Enter reason..."
              rows={2}
              className="w-full mt-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          )}
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
            onClick={handleReschedule}
            disabled={loading || !selectedSlot}
            className="px-5 py-2 text-sm rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            Reschedule
          </button>
        </div>
      </div>
    </div>
  );
}

// ====================================================================
// 3) CANCEL APPOINTMENT MODAL
// ====================================================================
interface CancelModalProps {
  isOpen: boolean;
  appointment: ReceptionistAppointmentListDTO | null;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

const CANCEL_REASONS = [
  "Patient requested cancellation",
  "Doctor unavailable",
  "Duplicate booking",
  "Clinic schedule change",
  "Patient did not confirm",
  "Other",
];

export function CancelAppointmentModal({
  isOpen,
  appointment,
  onClose,
  onSuccess,
  onError,
}: CancelModalProps) {
  const [reason, setReason] = useState(CANCEL_REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [sendNotification, setSendNotification] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setReason(CANCEL_REASONS[0]);
      setCustomReason("");
      setSendNotification(true);
    }
  }, [isOpen]);

  if (!isOpen || !appointment) return null;

  const finalReason = reason === "Other" ? customReason : reason;

  const handleCancel = async () => {
    if (!finalReason.trim()) {
      onError("Cancellation reason is required");
      return;
    }
    try {
      setLoading(true);
      await receptionistService.cancelAppointment(appointment.id, {
        reason: finalReason,
        sendNotification,
      });
      onSuccess(
        `Appointment ${appointment.appointmentCode} has been cancelled`
      );
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      onError(error?.response?.data?.message || "Failed to cancel appointment");
    } finally {
      setLoading(false);
    }
  };

  // Check if there's a potential payment issue
  const hasPayment =
    appointment.paymentStatus &&
    appointment.paymentStatus !== "PENDING" &&
    appointment.paymentStatus !== "CANCELLED";

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Cancel Appointment
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This will release the time slot
            </p>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Code</span>
            <span className="font-mono font-medium text-gray-900 dark:text-white">
              {appointment.appointmentCode}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Patient</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {appointment.patientName}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Doctor</span>
            <span className="text-gray-900 dark:text-white">
              {appointment.doctorName}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Schedule</span>
            <span className="text-gray-900 dark:text-white">
              {appointment.appointmentDate}{" "}
              {appointment.startTime}–{appointment.endTime}
            </span>
          </div>
        </div>

        {/* Payment warning */}
        {hasPayment && (
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div className="text-sm text-amber-700 dark:text-amber-300">
                <span className="font-medium">Payment detected</span> — Refund
                will be handled by the admin team after cancellation.
              </div>
            </div>
          </div>
        )}

        {/* Reason */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Cancellation Reason <span className="text-red-500">*</span>
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            {CANCEL_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          {reason === "Other" && (
            <textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Enter cancellation reason (required)..."
              rows={3}
              className="w-full mt-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          )}
        </div>

        {/* Notification toggle */}
        <label className="flex items-center gap-3 mb-4 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={sendNotification}
            onChange={(e) => setSendNotification(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-red-500 focus:ring-red-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Send cancellation notification (SMS/Email) to patient
          </span>
        </label>

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Keep Appointment
          </button>
          <button
            onClick={handleCancel}
            disabled={loading || (reason === "Other" && !customReason.trim())}
            className="px-5 py-2 text-sm rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            Cancel Appointment
          </button>
        </div>
      </div>
    </div>
  );
}
