import { useState } from "react";
import dayjs from "dayjs";
import {
  ServiceOrderAuditLogDTO,
  SO_AUDIT_EVENT_LABELS,
  SO_AUDIT_EVENT_COLORS,
} from "../../../services/securityService";

interface Props {
  appointmentId: number | null;
  data: ServiceOrderAuditLogDTO[];
  isLoading: boolean;
  onBack: () => void;
  onViewDetail: (log: ServiceOrderAuditLogDTO) => void;
  onSetAppointmentId: (id: number | null) => void;
}

export default function SOAuditTimeline({
  appointmentId,
  data,
  isLoading,
  onBack,
  onViewDetail,
  onSetAppointmentId,
}: Props) {
  const [inputId, setInputId] = useState(appointmentId?.toString() || "");

  const handleLookup = () => {
    const id = parseInt(inputId, 10);
    if (!isNaN(id) && id > 0) {
      onSetAppointmentId(id);
    }
  };

  return (
    <div>
      {/* Appointment ID input */}
      <div className="mb-4 flex items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
            Appointment ID
          </label>
          <input
            type="number"
            value={inputId}
            onChange={(e) => setInputId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLookup()}
            placeholder="Enter appointment ID"
            className="w-40 rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          />
        </div>
        <button
          onClick={handleLookup}
          className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600"
        >
          Load Timeline
        </button>
        <button
          onClick={onBack}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Back to Table
        </button>
      </div>

      {!appointmentId && (
        <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
          Enter an appointment ID to view its timeline
        </p>
      )}

      {isLoading && (
        <div className="animate-pulse space-y-4 py-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-3 w-1/2 rounded bg-gray-100 dark:bg-gray-800" />
              </div>
            </div>
          ))}
        </div>
      )}

      {appointmentId && !isLoading && data.length === 0 && (
        <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
          No events found for appointment #{appointmentId}
        </p>
      )}

      {data.length > 0 && (
        <div className="relative ml-4 border-l-2 border-gray-200 pl-6 dark:border-gray-700">
          {data.map((log) => {
            const eventLabel = SO_AUDIT_EVENT_LABELS[log.eventType] || log.eventType.replace(/_/g, " ");
            const colorClass = SO_AUDIT_EVENT_COLORS[log.eventType] || "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";

            return (
              <div key={log.id} className="relative mb-6 last:mb-0">
                {/* Dot on the line */}
                <div className="absolute -left-[31px] top-1 h-4 w-4 rounded-full border-2 border-white bg-brand-500 dark:border-gray-900" />

                <div className="rounded-lg border border-gray-100 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-800/60">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}>
                      {eventLabel}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {dayjs(log.createdAt).format("YYYY-MM-DD HH:mm:ss")}
                    </span>
                    {log.serviceOrderId && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        SO #{log.serviceOrderId}
                      </span>
                    )}
                  </div>
                  <p className="mb-1 text-sm text-gray-700 dark:text-gray-300">
                    {log.summary || "—"}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span>
                      <strong>Actor:</strong> {log.actorName || "—"}
                    </span>
                    <span>
                      <strong>Role:</strong> {log.actorRole || "—"}
                    </span>
                    {log.patientName && (
                      <span>
                        <strong>Patient:</strong> {log.patientName}
                      </span>
                    )}
                    <button
                      onClick={() => onViewDetail(log)}
                      className="ml-auto text-blue-600 hover:underline dark:text-blue-400"
                    >
                      Detail
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
