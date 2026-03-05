import { useState, useEffect } from "react";
import queueService, { type QueuePatientDTO } from "../../../services/queueService";
import { QueueBadge, formatTime, formatWaitTime } from "./SharedComponents";

interface ReorderModalProps {
  isOpen: boolean;
  doctorId: number;
  doctorName: string;
  patients: QueuePatientDTO[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReorderModal({
  isOpen,
  doctorId,
  doctorName,
  patients,
  onClose,
  onSuccess,
}: ReorderModalProps) {
  const [orderedPatients, setOrderedPatients] = useState<QueuePatientDTO[]>([]);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && patients.length > 0) {
      setOrderedPatients([...patients]);
      setReason("");
      setError("");
    }
  }, [isOpen, patients]);

  if (!isOpen) return null;

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setOverIndex(index);
  };

  const handleDrop = (index: number) => {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    const updated = [...orderedPatients];
    const [removed] = updated.splice(dragIndex, 1);
    updated.splice(index, 0, removed);
    setOrderedPatients(updated);
    setDragIndex(null);
    setOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  const moveItem = (from: number, to: number) => {
    if (to < 0 || to >= orderedPatients.length) return;
    const updated = [...orderedPatients];
    const [removed] = updated.splice(from, 1);
    updated.splice(to, 0, removed);
    setOrderedPatients(updated);
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError("Reason is required for queue reorder");
      return;
    }
    if (reason.trim().length < 2) {
      setError("Reason must be at least 2 characters");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await queueService.reorderQueue(doctorId, {
        orderedAppointmentIds: orderedPatients.map((p) => p.appointmentId),
        reason: reason.trim(),
      });
      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reorder queue");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReason("");
    setError("");
    setDragIndex(null);
    setOverIndex(null);
    onClose();
  };

  const REASON_PRESETS = [
    "Priority/Emergency",
    "Doctor request",
    "Patient request",
    "Schedule conflict",
    "Elderly patient priority",
  ];

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose}></div>
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Reorder Queue
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Dr. {doctorName} — Drag to rearrange
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

          {/* Draggable Patient List */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Drag to reorder ({orderedPatients.length} patients)
            </p>
            {orderedPatients.map((p, idx) => (
              <div
                key={p.appointmentId}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={() => handleDrop(idx)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-grab active:cursor-grabbing ${
                  dragIndex === idx
                    ? "opacity-50 border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                    : overIndex === idx
                    ? "border-brand-400 bg-brand-50/50 dark:bg-brand-900/10"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                }`}
              >
                {/* Position number */}
                <span className="text-xs font-bold text-gray-400 w-5 text-center">
                  {idx + 1}
                </span>

                {/* Drag handle */}
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                </svg>

                <QueueBadge number={p.queueNumber} size="sm" />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {p.patientName || p.appointmentCode}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{formatTime(p.appointmentTime)}</span>
                    <span className="text-amber-600 dark:text-amber-400">
                      {formatWaitTime(p.waitTimeMinutes)}
                    </span>
                    {p.isUrgent && (
                      <span className="text-red-500 font-medium">URGENT</span>
                    )}
                  </div>
                </div>

                {/* Move buttons */}
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveItem(idx, idx - 1)}
                    disabled={idx === 0}
                    className="p-0.5 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => moveItem(idx, idx + 1)}
                    disabled={idx === orderedPatients.length - 1}
                    className="p-0.5 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
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
              placeholder="Provide reason for reorder (mandatory for audit)..."
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
            disabled={loading || !reason.trim()}
            className="px-6 py-2 text-sm font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              "Apply New Order"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
