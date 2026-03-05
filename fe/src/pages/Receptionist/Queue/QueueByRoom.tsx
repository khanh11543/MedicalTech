import { useState, useEffect, useCallback } from "react";
import queueService, { DoctorQueueStatusDTO } from "../../../services/queueService";
import {
  QueueBadge,
  DoctorStatusBadge,
  QueueLoading,
  QueueEmpty,
  formatTime,
  formatWaitTime,
  getPatientStatusConfig,
  canMarkNoShow,
} from "./SharedComponents";

interface QueueByRoomProps {
  refreshKey: number;
  onCallNext: (doctorId: number, doctorName: string) => void;
  onMarkNoShow: (appointmentId: number, patientName: string) => void;
  onMoveDoctor: (appointmentId: number, patientName: string, fromDoctorId: number) => void;
}

export default function QueueByRoom({
  refreshKey,
  onCallNext,
  onMarkNoShow,
  onMoveDoctor,
}: QueueByRoomProps) {
  const [rooms, setRooms] = useState<DoctorQueueStatusDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await queueService.getQueueByRoom();
      setRooms(data || []);
    } catch (error) {
      console.error("Failed to fetch queue by room:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData, refreshKey]);

  if (loading) return <QueueLoading />;
  if (rooms.length === 0)
    return <QueueEmpty message="No rooms with active queues. Doctors need to be assigned to rooms." />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {rooms.map((room) => (
        <RoomCard
          key={room.doctorId}
          room={room}
          onCallNext={() => onCallNext(room.doctorId, room.doctorName)}
          onMarkNoShow={onMarkNoShow}
          onMoveDoctor={onMoveDoctor}
        />
      ))}
    </div>
  );
}

function RoomCard({
  room,
  onCallNext,
  onMarkNoShow,
  onMoveDoctor,
}: {
  room: DoctorQueueStatusDTO;
  onCallNext: () => void;
  onMarkNoShow: (appointmentId: number, patientName: string) => void;
  onMoveDoctor: (appointmentId: number, patientName: string, fromDoctorId: number) => void;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Room Header */}
      <div className="p-4 bg-gradient-to-r from-brand-50 to-blue-50 dark:from-brand-900/20 dark:to-blue-900/20 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Room {room.roomNumber || "Unassigned"}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
              Dr. {room.doctorName} • {room.specialization}
            </p>
          </div>
          <DoctorStatusBadge status={room.doctorStatus} />
        </div>

        {/* Room Stats */}
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {room.checkedInWaiting} waiting
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {room.inProgress} active
            </span>
          </div>
          {room.estimatedWaitMinutes !== null && (
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              ~{Math.round(room.estimatedWaitMinutes || 0)}m wait
            </span>
          )}
        </div>
      </div>

      {/* Current Patient */}
      {room.currentPatient && (
        <div className="px-4 pt-3">
          <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
            Now Serving
          </p>
          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <QueueBadge number={room.currentPatient.queueNumber} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-200 truncate">
                {room.currentPatient.patientName || room.currentPatient.appointmentCode}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-400">
                {room.currentPatient.reasonForVisit || "Consultation"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Waiting Patients */}
      <div className="px-4 py-3">
        {room.waitingPatients && room.waitingPatients.length > 0 ? (
          <>
            <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Queue ({room.waitingPatients.length})
            </p>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {room.waitingPatients.map((p) => {
                const statusCfg = getPatientStatusConfig(p.status);
                return (
                  <div
                    key={p.appointmentId}
                    className={`flex items-center gap-2 p-2 rounded-lg border-l-3 ${statusCfg.borderColor} bg-gray-50 dark:bg-gray-900/30 ${
                      p.waitTimeAlertLevel === "CRITICAL" ? "ring-1 ring-red-400" : ""
                    }`}
                  >
                    <QueueBadge number={p.queueNumber} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                        {p.patientName || p.appointmentCode}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400">
                        <span>{formatTime(p.appointmentTime)}</span>
                        <span className={
                          p.waitTimeAlertLevel === "CRITICAL"
                            ? "text-red-600 dark:text-red-400 font-bold"
                            : p.waitTimeAlertLevel === "WARNING"
                            ? "text-amber-600 dark:text-amber-400 font-semibold"
                            : "text-amber-600 dark:text-amber-400"
                        }>
                          {p.waitTimeAlertLevel === "CRITICAL" && "⚠ "}
                          {formatWaitTime(p.waitTimeMinutes)}
                        </span>
                        {p.isUrgent && (
                          <span className="text-red-500 font-bold animate-pulse">URGENT</span>
                        )}
                      </div>
                    </div>
                    {/* Inline actions */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => onMoveDoctor(p.appointmentId, p.patientName, room.doctorId)}
                        title="Move"
                        className="p-1 rounded text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      </button>
                      {canMarkNoShow(p.status, p.appointmentTime) && (
                        <button
                          onClick={() => onMarkNoShow(p.appointmentId, p.patientName)}
                          title="No-show"
                          className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">
            No patients waiting
          </p>
        )}
      </div>

      {/* Call Next Button */}
      <div className="px-4 pb-4">
        {(room.doctorStatus === "ON_BREAK" || room.doctorStatus === "OFFLINE") && room.checkedInWaiting > 0 && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-1.5">
            ⚠ Doctor is {room.doctorStatus === "ON_BREAK" ? "on break" : "offline"}
          </p>
        )}
        <button
          onClick={onCallNext}
          disabled={room.checkedInWaiting === 0 || room.doctorStatus === "ON_BREAK" || room.doctorStatus === "OFFLINE"}
          className="w-full py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
          Call Next
        </button>
      </div>
    </div>
  );
}
