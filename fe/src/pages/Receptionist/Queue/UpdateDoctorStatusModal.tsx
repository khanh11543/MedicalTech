import { useState } from "react";
import queueService, { type DoctorQueueStatus } from "../../../services/queueService";
import { getDoctorStatusConfig } from "./SharedComponents";

interface UpdateDoctorStatusModalProps {
  isOpen: boolean;
  doctorId: number;
  doctorName: string;
  currentStatus: string;
  onClose: () => void;
  onSuccess: () => void;
}

const ALL_STATUSES: DoctorQueueStatus[] = ["AVAILABLE", "BUSY", "ON_BREAK", "OFFLINE"];

export default function UpdateDoctorStatusModal({
  isOpen,
  doctorId,
  doctorName,
  currentStatus,
  onClose,
  onSuccess,
}: UpdateDoctorStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<DoctorQueueStatus>(
    (currentStatus as DoctorQueueStatus) || "AVAILABLE"
  );
  const [roomNumber, setRoomNumber] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError("");
      await queueService.updateDoctorStatus(doctorId, {
        status: selectedStatus,
        // Auto-fill: if empty, keep existing room on backend
        roomNumber: roomNumber || undefined,
        reason: reason || undefined,
      });
      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update doctor status");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setRoomNumber("");
    setReason("");
    setError("");
    onClose();
  };

  const statusIcons: Record<string, string> = {
    AVAILABLE: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    BUSY: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    ON_BREAK: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
    OFFLINE: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636",
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50"></div>
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Update Doctor Status
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Dr. {doctorName}
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Status Selection */}
          <div className="grid grid-cols-2 gap-2">
            {ALL_STATUSES.map((status) => {
              const config = getDoctorStatusConfig(status);
              const isCurrent = status === currentStatus;
              const isSelected = status === selectedStatus;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setSelectedStatus(status)}
                  className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                  }`}
                >
                  {isCurrent && (
                    <span className="absolute top-1.5 right-1.5 text-[9px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                      Current
                    </span>
                  )}
                  <svg
                    className={`w-6 h-6 ${config.color}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d={statusIcons[status]}
                    />
                  </svg>
                  <span className={`text-sm font-medium ${config.color}`}>
                    {config.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Room Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Room Number
            </label>
            <input
              type="text"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              placeholder="e.g. 301"
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Reason
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Lunch break, Emergency call..."
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
                Updating...
              </>
            ) : (
              "Update Status"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
