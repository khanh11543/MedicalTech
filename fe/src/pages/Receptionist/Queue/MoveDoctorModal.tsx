import { useState, useEffect } from "react";
import queueService, {
  type DoctorQueueStatusDTO,
  type QueueCallResultDTO,
} from "../../../services/queueService";

interface MoveDoctorModalProps {
  isOpen: boolean;
  appointmentId: number;
  patientName: string;
  fromDoctorId: number;
  onClose: () => void;
  onSuccess: (result: QueueCallResultDTO) => void;
}

export default function MoveDoctorModal({
  isOpen,
  appointmentId,
  patientName,
  fromDoctorId,
  onClose,
  onSuccess,
}: MoveDoctorModalProps) {
  const [doctors, setDoctors] = useState<DoctorQueueStatusDTO[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingDoctors, setFetchingDoctors] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSelectedDoctorId(null);
      setReason("");
      setError("");
      fetchDoctors();
    }
  }, [isOpen]);

  const fetchDoctors = async () => {
    try {
      setFetchingDoctors(true);
      const data = await queueService.getDoctorsList();
      // Exclude the current doctor
      setDoctors((data || []).filter((d) => d.doctorId !== fromDoctorId));
    } catch (err) {
      console.error("Failed to fetch doctors:", err);
    } finally {
      setFetchingDoctors(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedDoctorId) {
      setError("Please select a target doctor");
      return;
    }
    if (!reason.trim() || reason.trim().length < 2) {
      setError("Reason is required (minimum 2 characters)");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const result = await queueService.moveDoctor({
        appointmentId,
        toDoctorId: selectedDoctorId,
        reason: reason.trim(),
      });
      onSuccess(result);
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to move patient");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedDoctorId(null);
    setReason("");
    setError("");
    onClose();
  };

  const REASON_PRESETS = [
    "Doctor unavailable",
    "Specialization mismatch",
    "Patient request",
    "Load balancing",
    "Emergency reassignment",
  ];

  const statusColor: Record<string, string> = {
    AVAILABLE: "text-green-600 dark:text-green-400",
    BUSY: "text-blue-600 dark:text-blue-400",
    ON_BREAK: "text-amber-600 dark:text-amber-400",
    OFFLINE: "text-gray-500 dark:text-gray-400",
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50"></div>
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Move Patient to Another Doctor
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Moving <span className="font-medium text-gray-700 dark:text-gray-300">{patientName}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Doctor Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Target Doctor <span className="text-red-500">*</span>
            </label>
            {fetchingDoctors ? (
              <div className="flex items-center justify-center py-6">
                <div className="w-6 h-6 border-3 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : doctors.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No other doctors available today
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {doctors.map((doc) => (
                  <button
                    key={doc.doctorId}
                    type="button"
                    onClick={() => setSelectedDoctorId(doc.doctorId)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      selectedDoctorId === doc.doctorId
                        ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Dr. {doc.doctorName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {doc.specialization}
                          {doc.roomNumber ? ` • Room ${doc.roomNumber}` : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-medium ${statusColor[doc.doctorStatus] || "text-gray-500"}`}>
                          {doc.doctorStatus?.replace("_", " ")}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {doc.checkedInWaiting} waiting
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reason (required) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Reason <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {REASON_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setReason(preset)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    reason === preset
                      ? "bg-brand-500 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide reason (mandatory for audit)..."
              rows={2}
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedDoctorId || !reason.trim()}
            className="px-6 py-2 text-sm font-medium text-white bg-purple-500 rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Moving...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Move Patient
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
