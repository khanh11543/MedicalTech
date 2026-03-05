import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { DoctorQueueStatusDTO, QueueCallResultDTO } from "../../../services/receptionistService";
import receptionistService from "../../../services/receptionistService";

interface Props {
  queueData: DoctorQueueStatusDTO[];
  onRefresh: () => void;
}

export default function QueueStatusSection({ queueData, onRefresh }: Props) {
  const navigate = useNavigate();
  const [showNames, setShowNames] = useState(false);
  const [callingDoctor, setCallingDoctor] = useState<number | null>(null);
  const [callResult, setCallResult] = useState<QueueCallResultDTO | null>(null);

  const handleCallNext = async (doctorId: number) => {
    setCallingDoctor(doctorId);
    try {
      const result = await receptionistService.callNextPatient(doctorId);
      setCallResult(result);
      onRefresh();
      setTimeout(() => setCallResult(null), 5000);
    } catch (err) {
      console.error("Failed to call next patient:", err);
    } finally {
      setCallingDoctor(null);
    }
  };

  if (queueData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Current Queue Status
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-500">
          <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-sm">No active queues at the moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Current Queue Status
        </h2>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showNames}
              onChange={() => setShowNames(!showNames)}
              className="rounded border-gray-300 text-brand-500 focus:ring-brand-500 h-3.5 w-3.5"
            />
            Show names
          </label>
          <span className="inline-flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Live
          </span>
        </div>
      </div>

      {/* Call result toast */}
      {callResult && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          callResult.success
            ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
            : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
        }`}>
          <div className="flex items-center gap-2">
            {callResult.success ? (
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <span>
              {callResult.message}
              {callResult.success && callResult.patientName && (
                <> — Queue #{callResult.queueNumber} ({showNames ? callResult.patientName : callResult.maskedPhone})</>
              )}
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {queueData.map((doctor) => (
          <div
            key={doctor.doctorId}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-brand-300 dark:hover:border-brand-700 transition-colors"
          >
            {/* Doctor header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 text-sm font-bold">
                {doctor.doctorName?.charAt(0) || "D"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {showNames ? doctor.doctorName : `Dr. ${doctor.doctorName?.split(" ").pop()}`}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {doctor.specialization}
                </p>
              </div>
              {doctor.inProgress > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                  In session
                </span>
              )}
            </div>

            {/* Queue info */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              <div className="text-center">
                <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{doctor.checkedInWaiting}</p>
                <p className="text-[10px] text-gray-400">Waiting</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{doctor.inProgress}</p>
                <p className="text-[10px] text-gray-400">Active</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-green-600 dark:text-green-400">{doctor.completed}</p>
                <p className="text-[10px] text-gray-400">Done</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-red-600 dark:text-red-400">{doctor.noShow}</p>
                <p className="text-[10px] text-gray-400">No-show</p>
              </div>
            </div>

            {/* Current / Next queue numbers */}
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3 px-1">
              <span>
                Current: <span className="font-semibold text-gray-700 dark:text-gray-300">
                  #{doctor.currentQueueNumber ?? "—"}
                </span>
              </span>
              <span>
                Next: <span className="font-semibold text-gray-700 dark:text-gray-300">
                  #{doctor.nextQueueNumber ?? "—"}
                </span>
              </span>
              {doctor.estimatedWaitMinutes > 0 && (
                <span>
                  ~{doctor.estimatedWaitMinutes.toFixed(0)} min
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/receptionist/queue")}
                className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                View Full Queue
              </button>
              <button
                onClick={() => handleCallNext(doctor.doctorId)}
                disabled={callingDoctor === doctor.doctorId || doctor.checkedInWaiting === 0}
                className="flex-1 text-xs px-3 py-1.5 rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {callingDoctor === doctor.doctorId ? (
                  <span className="flex items-center justify-center gap-1">
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Calling…
                  </span>
                ) : (
                  "Call Next"
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
