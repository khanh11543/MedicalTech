import { useState, useEffect, useCallback } from "react";
import queueService, {
  DoctorQueueStatusDTO,
  QueuePatientDTO,
} from "../../../services/queueService";
import {
  QueueBadge,
  DoctorStatusBadge,
  PatientStatusBadge,
  QueueLoading,
  QueueEmpty,
  formatTime,
  formatWaitTime,
  getPatientStatusConfig,
  canMarkNoShow,
  noShowGraceRemaining,
} from "./SharedComponents";

interface QueueByDoctorProps {
  refreshKey: number;
  onCallNext: (doctorId: number, doctorName: string, roomNumber?: string | null, nextQueueNumber?: number | null) => void;
  onReorder: (doctorId: number, doctorName: string, patients: QueuePatientDTO[]) => void;
  onAddWalkIn: (doctorId: number, doctorName: string) => void;
  onMarkNoShow: (appointmentId: number, patientName: string) => void;
  onMoveDoctor: (appointmentId: number, patientName: string, fromDoctorId: number) => void;
  onUpdateDoctorStatus: (doctorId: number, doctorName: string, currentStatus: string) => void;
  onViewHistory: (doctorId: number, doctorName: string) => void;
}

export default function QueueByDoctor({
  refreshKey,
  onCallNext,
  onReorder,
  onAddWalkIn,
  onMarkNoShow,
  onMoveDoctor,
  onUpdateDoctorStatus,
  onViewHistory,
}: QueueByDoctorProps) {
  const [doctors, setDoctors] = useState<DoctorQueueStatusDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDoctors, setExpandedDoctors] = useState<Set<number>>(new Set());

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await queueService.getQueueByDoctor();
      setDoctors(data || []);
      // Auto-expand doctors with waiting patients
      const expanded = new Set<number>();
      data?.forEach((d) => {
        if (d.checkedInWaiting > 0 || d.inProgress > 0) expanded.add(d.doctorId);
      });
      setExpandedDoctors(expanded);
    } catch (error) {
      console.error("Failed to fetch queue by doctor:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData, refreshKey]);

  const toggleDoctor = (doctorId: number) => {
    setExpandedDoctors((prev) => {
      const copy = new Set(prev);
      if (copy.has(doctorId)) copy.delete(doctorId);
      else copy.add(doctorId);
      return copy;
    });
  };

  if (loading) return <QueueLoading />;
  if (doctors.length === 0) return <QueueEmpty message="No doctors with appointments today" />;

  return (
    <div className="space-y-4">
      {doctors.map((doctor) => (
        <DoctorCard
          key={doctor.doctorId}
          doctor={doctor}
          isExpanded={expandedDoctors.has(doctor.doctorId)}
          onToggle={() => toggleDoctor(doctor.doctorId)}
          onCallNext={() => onCallNext(doctor.doctorId, doctor.doctorName, doctor.roomNumber, doctor.nextQueueNumber)}
          onReorder={() =>
            onReorder(doctor.doctorId, doctor.doctorName, doctor.waitingPatients || [])
          }
          onAddWalkIn={() => onAddWalkIn(doctor.doctorId, doctor.doctorName)}
          onMarkNoShow={onMarkNoShow}
          onMoveDoctor={onMoveDoctor}
          onUpdateStatus={() =>
            onUpdateDoctorStatus(doctor.doctorId, doctor.doctorName, doctor.doctorStatus)
          }
          onViewHistory={() => onViewHistory(doctor.doctorId, doctor.doctorName)}
        />
      ))}
    </div>
  );
}

// ==================== DOCTOR CARD ====================

function DoctorCard({
  doctor,
  isExpanded,
  onToggle,
  onCallNext,
  onReorder,
  onAddWalkIn,
  onMarkNoShow,
  onMoveDoctor,
  onUpdateStatus,
  onViewHistory,
}: {
  doctor: DoctorQueueStatusDTO;
  isExpanded: boolean;
  onToggle: () => void;
  onCallNext: () => void;
  onReorder: () => void;
  onAddWalkIn: () => void;
  onMarkNoShow: (appointmentId: number, patientName: string) => void;
  onMoveDoctor: (appointmentId: number, patientName: string, fromDoctorId: number) => void;
  onUpdateStatus: () => void;
  onViewHistory: () => void;
}) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Doctor Header */}
      <div
        className="p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        onClick={onToggle}
      >
        {/* Avatar */}
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
          <span className="text-lg font-bold text-brand-600 dark:text-brand-400">
            {doctor.doctorName?.charAt(0) || "D"}
          </span>
        </div>

        {/* Doctor Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              Dr. {doctor.doctorName}
            </h3>
            <DoctorStatusBadge status={doctor.doctorStatus} />
            {doctor.roomNumber && (
              <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                Room {doctor.roomNumber}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {doctor.specialization}
          </p>
        </div>

        {/* Queue Stats */}
        <div className="flex items-center gap-3 text-center">
          <div>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              {doctor.checkedInWaiting}
            </p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Waiting</p>
          </div>
          <div>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {doctor.inProgress}
            </p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Active</p>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-500 dark:text-gray-400">
              {doctor.completed}
            </p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Done</p>
          </div>
        </div>

        {/* Current Queue Badge */}
        <div className="flex-shrink-0 text-center">
          {doctor.currentQueueNumber ? (
            <div>
              <QueueBadge number={doctor.currentQueueNumber} size="md" />
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">Current</p>
            </div>
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-gray-400 text-sm">—</span>
            </div>
          )}
        </div>

        {/* Expand Arrow */}
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Current Patient Banner */}
      {doctor.currentPatient && (
        <div className="mx-4 mb-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3">
            <QueueBadge number={doctor.currentPatient.queueNumber} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                Now Serving: {doctor.currentPatient.patientName || doctor.currentPatient.appointmentCode}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-400">
                {doctor.currentPatient.reasonForVisit || "General consultation"}
              </p>
            </div>
            <PatientStatusBadge status="IN_PROGRESS" />
          </div>
        </div>
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          {/* Action Buttons */}
          <div className="px-4 py-3 flex flex-wrap gap-2 bg-gray-50 dark:bg-gray-900/30">
            {/* §2 Call-next policy: disable if doctor ON_BREAK or OFFLINE */}
            {(doctor.doctorStatus === "ON_BREAK" || doctor.doctorStatus === "OFFLINE") && doctor.checkedInWaiting > 0 && (
              <div className="w-full mb-1 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs">
                ⚠ Doctor is {doctor.doctorStatus === "ON_BREAK" ? "on break" : "offline"}. Change status to Available before calling next patient.
              </div>
            )}
            <ActionButton
              icon="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
              label="Call Next"
              color="brand"
              onClick={onCallNext}
              disabled={doctor.checkedInWaiting === 0 || doctor.doctorStatus === "ON_BREAK" || doctor.doctorStatus === "OFFLINE"}
            />
            <ActionButton
              icon="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
              label="Reorder"
              color="amber"
              onClick={onReorder}
              disabled={(doctor.waitingPatients?.length || 0) < 2}
            />
            <ActionButton
              icon="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              label="Walk-In"
              color="green"
              onClick={onAddWalkIn}
            />

            {/* More Actions */}
            <div className="relative ml-auto">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActions(!showActions);
                }}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                  />
                </svg>
              </button>
              {showActions && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)}></div>
                  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-20 min-w-48">
                    <DropdownItem
                      label="Change Status"
                      icon="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      onClick={() => {
                        setShowActions(false);
                        onUpdateStatus();
                      }}
                    />
                    <DropdownItem
                      label="View History"
                      icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      onClick={() => {
                        setShowActions(false);
                        onViewHistory();
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Waiting Patients List */}
          <div className="px-4 pb-4">
            {doctor.waitingPatients && doctor.waitingPatients.length > 0 ? (
              <div className="space-y-2 mt-2">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Waiting List ({doctor.waitingPatients.length})
                </p>
                {doctor.waitingPatients.map((patient) => (
                  <PatientRow
                    key={patient.appointmentId}
                    patient={patient}
                    onMarkNoShow={() =>
                      onMarkNoShow(patient.appointmentId, patient.patientName)
                    }
                    onMoveDoctor={() =>
                      onMoveDoctor(
                        patient.appointmentId,
                        patient.patientName,
                        doctor.doctorId
                      )
                    }
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">
                No patients waiting
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== SUB-COMPONENTS ====================

function PatientRow({
  patient,
  onMarkNoShow,
  onMoveDoctor,
}: {
  patient: QueuePatientDTO;
  onMarkNoShow: () => void;
  onMoveDoctor: () => void;
}) {
  const statusConfig = getPatientStatusConfig(patient.status);
  const isCriticalWait = patient.waitTimeAlertLevel === "CRITICAL";
  const isWarningWait = patient.waitTimeAlertLevel === "WARNING";

  return (
    <div
      className={`border-l-4 ${statusConfig.borderColor} rounded-lg p-3 flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 ${
        isCriticalWait ? "ring-2 ring-red-400 dark:ring-red-500 animate-pulse" : ""
      } ${isWarningWait ? "ring-1 ring-amber-400 dark:ring-amber-500" : ""}`}
    >
      <QueueBadge number={patient.queueNumber} size="sm" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {patient.patientName || patient.appointmentCode}
          </span>
          {patient.isUrgent && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold uppercase tracking-wider animate-pulse">
              URGENT
            </span>
          )}
          <PatientStatusBadge status={patient.status} />
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          <span>Appt: {formatTime(patient.appointmentTime)}</span>
          {patient.checkedInAt && <span>Check-in: {formatTime(patient.checkedInAt)}</span>}
          <span className={`font-medium ${
            isCriticalWait
              ? "text-red-600 dark:text-red-400 font-bold"
              : isWarningWait
              ? "text-amber-600 dark:text-amber-400 font-semibold"
              : "text-amber-600 dark:text-amber-400"
          }`}>
            {isCriticalWait && "⚠ "}
            Wait: {formatWaitTime(patient.waitTimeMinutes)}
            {isCriticalWait && " (CRITICAL)"}
            {isWarningWait && " (Warning)"}
          </span>
        </div>
      </div>

      {/* Patient actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMoveDoctor();
          }}
          title="Move to another doctor"
          className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
            />
          </svg>
        </button>
        {canMarkNoShow(patient.status, patient.appointmentTime) ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMarkNoShow();
            }}
            title="Mark as no-show"
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </button>
        ) : (patient.status === "CONFIRMED" || patient.status === "CHECKED_IN") && noShowGraceRemaining(patient.appointmentTime) > 0 ? (
          <span
            title={`No-show available in ${noShowGraceRemaining(patient.appointmentTime)} min`}
            className="p-1.5 rounded-lg text-gray-300 dark:text-gray-600 cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </span>
        ) : null}
      </div>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  color,
  onClick,
  disabled,
}: {
  icon: string;
  label: string;
  color: "brand" | "amber" | "green" | "red";
  onClick: () => void;
  disabled?: boolean;
}) {
  const colorMap = {
    brand: "bg-brand-500 hover:bg-brand-600 text-white",
    amber: "bg-amber-500 hover:bg-amber-600 text-white",
    green: "bg-green-500 hover:bg-green-600 text-white",
    red: "bg-red-500 hover:bg-red-600 text-white",
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${colorMap[color]}`}
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
      </svg>
      {label}
    </button>
  );
}

function DropdownItem({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
      </svg>
      {label}
    </button>
  );
}
