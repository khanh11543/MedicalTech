import { useState } from "react";
import queueService, {
  type CallNextRequest,
  type QueueCallResultDTO,
} from "../../../services/queueService";

/**
 * Speak an announcement using Web Speech API.
 * Reads the text twice with a 2-second gap.
 */
function speakAnnouncement(text: string): void {
  if (!("speechSynthesis" in window)) {
    alert("Your browser does not support Speech Synthesis (Web Speech API).");
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const speak = () => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
    return utterance;
  };

  // First read
  const first = speak();

  // Second read after 2 seconds
  first.onend = () => {
    setTimeout(() => speak(), 2000);
  };
}

interface CallNextModalProps {
  isOpen: boolean;
  doctorId: number;
  doctorName: string;
  roomNumber?: string;
  onClose: () => void;
  onSuccess: (result: QueueCallResultDTO) => void;
}

export default function CallNextModal({
  isOpen,
  doctorId,
  doctorName,
  roomNumber: roomNumberProp,
  onClose,
  onSuccess,
}: CallNextModalProps) {
  const [notifyMethod, setNotifyMethod] = useState("DISPLAY");
  const [roomNumber, setRoomNumber] = useState(roomNumberProp || "");
  const [queueNumber, setQueueNumber] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError("");
      const req: CallNextRequest = {
        notifyMethod,
        // Auto-fill: if receptionist leaves empty, backend uses doctor's assigned room
        roomNumber: roomNumber || undefined,
        queueNumber: queueNumber ? parseInt(queueNumber) : undefined,
        note: note || undefined,
      };
      const result = await queueService.callNextPatient(doctorId, req);

      // Speaker announcement via Web Speech API
      if (notifyMethod === "SPEAKER") {
        const name = result.patientName;
        const qNum = result.queueNumber;
        const room = result.roomNumber || roomNumber;

        const text = room
          ? `Patient ${name}, queue number ${qNum}, please proceed to room ${room} for your consultation.`
          : `Patient ${name}, queue number ${qNum}, please proceed for your consultation.`;

        speakAnnouncement(text);
      }

      onSuccess(result);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to call next patient");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNotifyMethod("DISPLAY");
    setRoomNumber(roomNumberProp || "");
    setQueueNumber("");
    setNote("");
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50"></div>
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Call Next Patient
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Dr. {doctorName}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Notification Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notification Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "DISPLAY", label: "Display", icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
                { value: "SPEAKER", label: "Speaker", icon: "M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" },
                { value: "SMS", label: "SMS", icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" },
              ].map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setNotifyMethod(m.value)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-colors ${
                    notifyMethod === m.value
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400"
                      : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300"
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={m.icon} />
                  </svg>
                  <span className="text-xs font-medium">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Room Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Room Number <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              placeholder="e.g. 301"
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
            {roomNumberProp && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Auto-filled from assigned room. You can override if needed.
              </p>
            )}
          </div>

          {/* Specific Queue Number (skip queue) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Call Specific # <span className="text-gray-400">(optional, leave empty for next)</span>
            </label>
            <input
              type="number"
              value={queueNumber}
              onChange={(e) => setQueueNumber(e.target.value)}
              placeholder="Auto (next in queue)"
              min="1"
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Note <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Patient requested earlier"
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Calling...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
                Call Next
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
