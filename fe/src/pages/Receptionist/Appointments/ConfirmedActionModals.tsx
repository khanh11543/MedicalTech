import { useState, useEffect } from "react";
import receptionistService from "../../../services/receptionistService";
import type { ReceptionistAppointmentListDTO } from "../../../services/receptionistService";

// ====================================================================
// 1) CHECK-IN PATIENT MODAL
// ====================================================================
interface CheckInModalProps {
  isOpen: boolean;
  appointment: ReceptionistAppointmentListDTO | null;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export function CheckInModal({
  isOpen,
  appointment,
  onClose,
  onSuccess,
  onError,
}: CheckInModalProps) {
  const [loading, setLoading] = useState(false);
  const [arrivalNote, setArrivalNote] = useState("");

  useEffect(() => {
    if (isOpen) {
      setArrivalNote("");
    }
  }, [isOpen]);

  if (!isOpen || !appointment) return null;

  // Policy: block check-in outside 30-min-before to 15-min-after window
  const now = new Date();
  const [h, m] = (appointment.startTime || "00:00").split(":").map(Number);
  const aptDateTime = new Date(appointment.appointmentDate);
  aptDateTime.setHours(h, m, 0, 0);
  const diffMs = aptDateTime.getTime() - now.getTime();
  const diffMin = Math.round(diffMs / 60000);
  const tooEarly = diffMin > 30;  // > 30 minutes before
  const isPast = diffMin < -15;   // > 15 minutes after
  const outsideWindow = tooEarly || isPast;

  const handleCheckIn = async () => {
    try {
      setLoading(true);
      const result = await receptionistService.checkInPatient(appointment.id);
      const queueNum = result?.queueNumber ?? "—";
      onSuccess(
        `Patient checked in: ${appointment.appointmentCode} — Queue #${queueNum}`
      );
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { message?: string } } };
      if (error?.response?.status === 409) {
        onError(
          error.response.data?.message ||
            "This appointment was modified by another user. Please refresh."
        );
      } else if (error?.response?.status === 400) {
        onError(
          error.response.data?.message ||
            "Only confirmed appointments can be checked in"
        );
      } else {
        onError(error?.response?.data?.message || "Check-in failed");
      }
    } finally {
      setLoading(false);
    }
  };

  // Format time nicely
  const formatTime = (t: string | undefined) => t?.substring(0, 5) || "—";
  const currentTime = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Check-in Patient
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Confirm arrival and assign to queue
            </p>
          </div>
        </div>

        {/* Patient / appointment summary */}
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
            <span className="text-gray-500 dark:text-gray-400">Phone</span>
            <span className="text-gray-900 dark:text-white">
              {appointment.maskedPhone}
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
            <span className="text-gray-500 dark:text-gray-400">
              Scheduled
            </span>
            <span className="text-gray-900 dark:text-white">
              {formatTime(appointment.startTime)} –{" "}
              {formatTime(appointment.endTime)}
            </span>
          </div>
        </div>

        {/* Arrival context */}
        <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-blue-700 dark:text-blue-300">
            Current time: <span className="font-medium">{currentTime}</span>
          </span>
          {diffMin > 0 && (
            <span className="text-xs text-blue-500 dark:text-blue-400">
              ({diffMin} min before appointment)
            </span>
          )}
          {diffMin <= 0 && diffMin > -60 && (
            <span className="text-xs text-amber-600 dark:text-amber-400">
              ({Math.abs(diffMin)} min late)
            </span>
          )}
        </div>

        {/* Too early warning */}
        {tooEarly && (
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <div className="text-sm text-amber-700 dark:text-amber-300">
                <span className="font-medium">Too early for check-in</span> — The
                appointment is more than 30 minutes away. Check-in opens 30 minutes before the scheduled time.
              </div>
            </div>
          </div>
        )}

        {/* Past appointment warning */}
        {isPast && (
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="text-sm text-red-700 dark:text-red-300">
                <span className="font-medium">Check-in window closed</span> — This
                appointment time has passed by more than 15 minutes. Please reschedule the appointment.
              </div>
            </div>
          </div>
        )}

        {/* Optional note */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Arrival Note{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={arrivalNote}
            onChange={(e) => setArrivalNote(e.target.value)}
            placeholder="e.g. Patient arrived with wheelchair"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Info: queue auto-assign */}
        <div className="flex items-center gap-2 mb-5 text-xs text-gray-500 dark:text-gray-400">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Queue number will be automatically assigned for{" "}
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Dr. {appointment.doctorName}
          </span>
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
            onClick={handleCheckIn}
            disabled={loading || outsideWindow}
            className="px-5 py-2 text-sm rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Check-in Patient
          </button>
        </div>
      </div>
    </div>
  );
}

// ====================================================================
// 2) SEND REMINDER MODAL
// ====================================================================
interface SendReminderModalProps {
  isOpen: boolean;
  appointment: ReceptionistAppointmentListDTO | null;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

const REMINDER_TEMPLATES = [
  {
    id: "reminder_24h",
    name: "Reminder 24h",
    description: "Standard 24-hour reminder for upcoming appointment",
    preview: (apt: ReceptionistAppointmentListDTO) =>
      `Dear ${apt.patientName}, this is a reminder for your appointment tomorrow, ${apt.appointmentDate} at ${apt.startTime?.substring(0, 5)} with Dr. ${apt.doctorName} (${apt.doctorSpecialization}). Please arrive 15 minutes early. If you need to cancel or reschedule, please call us.`,
  },
  {
    id: "reminder_2h",
    name: "Reminder 2h",
    description: "Quick 2-hour before reminder",
    preview: (apt: ReceptionistAppointmentListDTO) =>
      `Hi ${apt.patientName}, your appointment with Dr. ${apt.doctorName} is in 2 hours (${apt.startTime?.substring(0, 5)}). See you soon!`,
  },
  {
    id: "confirmation_request",
    name: "Confirmation Request",
    description: "Ask patient to confirm attendance",
    preview: (apt: ReceptionistAppointmentListDTO) =>
      `Dear ${apt.patientName}, please confirm your appointment on ${apt.appointmentDate} at ${apt.startTime?.substring(0, 5)} with Dr. ${apt.doctorName}. Reply YES to confirm or call us to reschedule.`,
  },
  {
    id: "default",
    name: "Default Template",
    description: "System default reminder message",
    preview: (apt: ReceptionistAppointmentListDTO) =>
      `Reminder: You have an appointment on ${apt.appointmentDate} at ${apt.startTime?.substring(0, 5)} with Dr. ${apt.doctorName}, ${apt.doctorSpecialization}. Code: ${apt.appointmentCode}.`,
  },
];

type Channel = "EMAIL" | "SMS";

export function SendReminderModal({
  isOpen,
  appointment,
  onClose,
  onSuccess,
  onError,
}: SendReminderModalProps) {
  const [channel, setChannel] = useState<Channel>("EMAIL");
  const [templateId, setTemplateId] = useState(REMINDER_TEMPLATES[0].id);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setChannel("EMAIL");
      setTemplateId(REMINDER_TEMPLATES[0].id);
    }
  }, [isOpen]);

  if (!isOpen || !appointment) return null;

  // Find selected template
  const selectedTemplate =
    REMINDER_TEMPLATES.find((t) => t.id === templateId) ||
    REMINDER_TEMPLATES[0];
  const previewText = selectedTemplate.preview(appointment);

  // Policy: block if < 30 min before appointment
  const now = new Date();
  const [h, m] = (appointment.startTime || "00:00").split(":").map(Number);
  const aptDateTime = new Date(appointment.appointmentDate);
  aptDateTime.setHours(h, m, 0, 0);
  const diffMs = aptDateTime.getTime() - now.getTime();
  const diffMin = Math.round(diffMs / 60000);
  const tooClose = diffMin >= 0 && diffMin < 30;
  const isPast = diffMin < 0;

  const handleSend = async () => {
    try {
      setLoading(true);
      await receptionistService.sendReminder(
        appointment.id,
        channel,
        templateId !== "default" ? templateId : undefined
      );
      onSuccess(
        `Reminder sent via ${channel} to ${appointment.patientName} (${appointment.appointmentCode})`
      );
      onClose();
    } catch (err: unknown) {
      const error = err as {
        response?: { status?: number; data?: { message?: string } };
      };
      if (error?.response?.status === 429) {
        onError("Rate limit exceeded — too many reminders sent today");
      } else {
        onError(
          error?.response?.data?.message || "Failed to send reminder"
        );
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
          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-indigo-600 dark:text-indigo-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Send Reminder
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {appointment.appointmentCode} — {appointment.patientName}
            </p>
          </div>
        </div>

        {/* Appointment summary (compact) */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 mb-4 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Doctor: </span>
            <span className="text-gray-900 dark:text-white">
              {appointment.doctorName}
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Date: </span>
            <span className="text-gray-900 dark:text-white">
              {appointment.appointmentDate}
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Time: </span>
            <span className="text-gray-900 dark:text-white">
              {appointment.startTime?.substring(0, 5)}–
              {appointment.endTime?.substring(0, 5)}
            </span>
          </div>
        </div>

        {/* Warning: too close or past */}
        {tooClose && (
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <div className="text-sm text-amber-700 dark:text-amber-300">
                Appointment is in <span className="font-medium">{diffMin} minutes</span>.
                Reminder may not be useful this close to the time.
              </div>
            </div>
          </div>
        )}
        {isPast && (
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="text-sm text-red-700 dark:text-red-300">
                This appointment time has already passed.
              </div>
            </div>
          </div>
        )}

        {/* Channel selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Channel
          </label>
          <div className="flex gap-3">
            {(["EMAIL", "SMS"] as Channel[]).map((ch) => (
              <button
                key={ch}
                onClick={() => setChannel(ch)}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border flex items-center justify-center gap-2 ${
                  channel === ch
                    ? "bg-indigo-500 text-white border-indigo-500 shadow-sm"
                    : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                }`}
              >
                {ch === "EMAIL" ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                )}
                {ch}
              </button>
            ))}
          </div>
        </div>

        {/* Template selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Template
          </label>
          <div className="space-y-2">
            {REMINDER_TEMPLATES.map((tpl) => (
              <label
                key={tpl.id}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  templateId === tpl.id
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10"
                    : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                }`}
              >
                <input
                  type="radio"
                  name="template"
                  value={tpl.id}
                  checked={templateId === tpl.id}
                  onChange={() => setTemplateId(tpl.id)}
                  className="mt-0.5 w-4 h-4 text-indigo-500 focus:ring-indigo-500"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {tpl.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {tpl.description}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Preview
          </label>
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2 text-xs text-gray-500 dark:text-gray-400">
              {channel === "EMAIL" ? (
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              )}
              via {channel}
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {previewText}
            </p>
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
            onClick={handleSend}
            disabled={loading || isPast}
            className="px-5 py-2 text-sm rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
            Send {channel}
          </button>
        </div>
      </div>
    </div>
  );
}
