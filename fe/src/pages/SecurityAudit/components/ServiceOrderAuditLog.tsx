import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import ComponentCard from "../../../components/common/ComponentCard";
import {
  ServiceOrderAuditFilter,
  ServiceOrderAuditLogDTO,
  getServiceOrderAuditLogs,
  getServiceOrderAuditDetail,
  getServiceOrderAuditTimeline,
  getServiceOrderAuditEventTypes,
} from "../../../services/securityService";
import SOAuditFilters from "./SOAuditFilters";
import SOAuditTable from "./SOAuditTable";
import SOAuditDetailModal from "./SOAuditDetailModal";
import SOAuditTimeline from "./SOAuditTimeline";

export default function ServiceOrderAuditLog() {
  const [filter, setFilter] = useState<ServiceOrderAuditFilter>({
    pageNumber: 0,
    pageSize: 20,
    sortBy: "createdAt",
    sortDir: "DESC",
  });
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
  const [timelineAppointmentId, setTimelineAppointmentId] = useState<number | null>(null);
  const [view, setView] = useState<"table" | "timeline">("table");

  // Queries
  const { data: logsData, isLoading } = useQuery({
    queryKey: ["so-audit-logs", filter],
    queryFn: () => getServiceOrderAuditLogs(filter),
  });

  const { data: detail, isLoading: isDetailLoading } = useQuery({
    queryKey: ["so-audit-detail", selectedLogId],
    queryFn: () => getServiceOrderAuditDetail(selectedLogId!),
    enabled: !!selectedLogId,
  });

  const { data: timelineData, isLoading: isTimelineLoading } = useQuery({
    queryKey: ["so-audit-timeline", timelineAppointmentId],
    queryFn: () => getServiceOrderAuditTimeline(timelineAppointmentId!),
    enabled: !!timelineAppointmentId,
  });

  const { data: eventTypes } = useQuery({
    queryKey: ["so-audit-event-types"],
    queryFn: getServiceOrderAuditEventTypes,
  });

  const handleFilterChange = useCallback((f: ServiceOrderAuditFilter) => {
    setFilter(f);
  }, []);

  const handleViewDetail = useCallback((log: ServiceOrderAuditLogDTO) => {
    setSelectedLogId(log.id);
  }, []);

  const handleViewTimeline = useCallback((appointmentId: number) => {
    setTimelineAppointmentId(appointmentId);
    setView("timeline");
  }, []);

  const handleBackToTable = useCallback(() => {
    setView("table");
    setTimelineAppointmentId(null);
  }, []);

  return (
    <ComponentCard
      title="Service Order Audit Log"
      desc="Track all events across the Service Order workflow: order → payment → in-progress → result → finalize"
    >
      {/* View toggle */}
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={() => setView("table")}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
            view === "table"
              ? "bg-brand-500 text-white"
              : "border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          }`}
        >
          Table View
        </button>
        <button
          onClick={() => setView("timeline")}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
            view === "timeline"
              ? "bg-brand-500 text-white"
              : "border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          }`}
        >
          Timeline View
        </button>
        {logsData && (
          <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
            {logsData.totalElements} events found
          </span>
        )}
      </div>

      {view === "table" ? (
        <>
          <SOAuditFilters
            filter={filter}
            onFilterChange={handleFilterChange}
            eventTypes={eventTypes || []}
          />
          <div className="mt-4">
            <SOAuditTable
              data={logsData}
              isLoading={isLoading}
              filter={filter}
              onFilterChange={handleFilterChange}
              onViewDetail={handleViewDetail}
              onViewTimeline={handleViewTimeline}
            />
          </div>
        </>
      ) : (
        <SOAuditTimeline
          appointmentId={timelineAppointmentId}
          data={timelineData || []}
          isLoading={isTimelineLoading}
          onBack={handleBackToTable}
          onViewDetail={handleViewDetail}
          onSetAppointmentId={setTimelineAppointmentId}
        />
      )}

      {/* Detail modal */}
      {selectedLogId && (
        <SOAuditDetailModal
          detail={detail ?? null}
          isLoading={isDetailLoading}
          isOpen={!!selectedLogId}
          onClose={() => setSelectedLogId(null)}
        />
      )}
    </ComponentCard>
  );
}
