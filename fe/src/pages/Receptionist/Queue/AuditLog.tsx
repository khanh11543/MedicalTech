import { useEffect, useState } from "react";
import queueService, { type QueueAuditDTO, type PageResponse } from "../../../services/queueService";
import { QueueLoading, getAuditEventConfig, formatTimestamp } from "./SharedComponents";

interface AuditLogProps {
  refreshKey?: number;
}

const EVENT_BG_MAP: Record<string, string> = {
  QUEUE_CALL: "bg-blue-100 dark:bg-blue-900/30",
  QUEUE_REORDER: "bg-amber-100 dark:bg-amber-900/30",
  QUEUE_MOVE: "bg-purple-100 dark:bg-purple-900/30",
  QUEUE_NO_SHOW: "bg-red-100 dark:bg-red-900/30",
  QUEUE_WALK_IN: "bg-green-100 dark:bg-green-900/30",
  DOCTOR_STATUS_CHANGE: "bg-gray-100 dark:bg-gray-700/50",
};

function getEventBg(eventType: string): string {
  return EVENT_BG_MAP[eventType] || "bg-gray-100 dark:bg-gray-700/50";
}

export default function AuditLog({ refreshKey }: AuditLogProps) {
  const [audits, setAudits] = useState<QueueAuditDTO[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterEvent, setFilterEvent] = useState<string>("ALL");

  const PAGE_SIZE = 20;

  const fetchAudit = async () => {
    try {
      setLoading(true);
      const res: PageResponse<QueueAuditDTO> = await queueService.getAuditLog(page, PAGE_SIZE);
      setAudits(res.content);
      setTotalPages(res.totalPages);
      setTotalElements(res.totalElements);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit();
  }, [page, refreshKey]);

  const filteredAudits =
    filterEvent === "ALL" ? audits : audits.filter((a) => a.eventType === filterEvent);

  const eventTypes = ["ALL", "QUEUE_CALL", "QUEUE_REORDER", "QUEUE_MOVE", "QUEUE_NO_SHOW", "QUEUE_WALK_IN", "DOCTOR_STATUS_CHANGE"];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {eventTypes.map((et) => {
            const isActive = filterEvent === et;
            const config = et === "ALL" ? null : getAuditEventConfig(et);
            return (
              <button
                key={et}
                onClick={() => setFilterEvent(et)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  isActive
                    ? "bg-brand-500 text-white border-brand-500"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300"
                }`}
              >
                {config ? config.label : "All Events"}
              </button>
            );
          })}
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {totalElements} records
        </span>
      </div>

      {loading ? (
        <QueueLoading />
      ) : filteredAudits.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          <svg className="mx-auto w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="font-medium">No audit records found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredAudits.map((audit, idx) => {
            const config = getAuditEventConfig(audit.eventType);
            const bg = getEventBg(audit.eventType);
            return (
              <div
                key={`${audit.eventType}-${audit.timestamp}-${idx}`}
                className="flex items-start gap-4 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 transition-colors"
              >
                {/* Icon */}
                <div
                  className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-sm ${bg} ${config.color}`}
                >
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={config.icon} />
                  </svg>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${bg} ${config.color}`}>
                      {config.label}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {formatTimestamp(audit.timestamp)}
                    </span>
                  </div>

                  <p className="text-sm text-gray-900 dark:text-white">
                    {buildDescription(audit)}
                  </p>

                  <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                    {audit.performedByName && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {audit.performedByName}
                      </span>
                    )}
                    {audit.doctorName && (
                      <span>Dr. {audit.doctorName}</span>
                    )}
                    {audit.patientName && (
                      <span>Patient: {audit.patientName}</span>
                    )}
                    {audit.queueNumber != null && (
                      <span>Queue #{audit.queueNumber}</span>
                    )}
                  </div>

                  {audit.reason && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 italic">
                      Reason: {audit.reason}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function buildDescription(audit: QueueAuditDTO): string {
  switch (audit.eventType) {
    case "QUEUE_CALL":
      return `Called patient ${audit.patientName} (#${audit.queueNumber || "?"}) to see Dr. ${audit.doctorName}`;
    case "QUEUE_REORDER":
      return `Queue reordered for Dr. ${audit.doctorName || "Unknown"}`;
    case "QUEUE_MOVE":
      return `Patient ${audit.patientName} moved${audit.fromDoctorName ? ` from Dr. ${audit.fromDoctorName}` : ""}${audit.toDoctorName ? ` to Dr. ${audit.toDoctorName}` : ""}`;
    case "QUEUE_NO_SHOW":
      return `Patient ${audit.patientName} (#${audit.queueNumber || "?"}) marked as no-show`;
    case "QUEUE_WALK_IN":
      return `Walk-in patient ${audit.patientName} added to Dr. ${audit.doctorName}'s queue`;
    case "DOCTOR_STATUS_CHANGE":
      return `Dr. ${audit.doctorName} status updated`;
    default:
      return `Queue event: ${audit.eventType}`;
  }
}
