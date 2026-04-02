import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import ComponentCard from "../../../components/common/ComponentCard";
import ActivityLogFilters from "./ActivityLogFilters";
import ActivityLogTable from "./ActivityLogTable";
import ActivityDetailModal from "./ActivityDetailModal";
import {
  ActivityLogDTO,
  ActivityLogFilter,
  getActivityLogs,
  ActivityType,
} from "../../../services/securityService";

const APPOINTMENT_ACTIVITY_TYPES: ActivityType[] = [
  "CREATED_APPOINTMENT",
  "CONFIRMED_APPOINTMENT",
  "CHECKED_IN_PATIENT",
  "CANCELLED_APPOINTMENT",
  "RESCHEDULED_APPOINTMENT",
];

export default function AppointmentActivityLogs() {
  const [filter, setFilter] = useState<ActivityLogFilter>({
    pageNumber: 0,
    pageSize: 20,
    sortBy: "createdAt",
    sortDir: "DESC",
    resourceType: "APPOINTMENT",
    activityTypes: APPOINTMENT_ACTIVITY_TYPES,
  });

  const [selectedLog, setSelectedLog] = useState<ActivityLogDTO | null>(null);

  const { data: logsData, isLoading } = useQuery({
    queryKey: ["appointment-activity-logs", filter],
    queryFn: () => getActivityLogs(filter),
  });

  const handleFilterChange = useCallback((newFilter: ActivityLogFilter) => {
    setFilter(newFilter);
  }, []);

  const handleViewDetail = useCallback((log: ActivityLogDTO) => {
    setSelectedLog(log);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedLog(null);
  }, []);

  const handleFilterByUser = useCallback((userId: number) => {
    setFilter((prev) => ({ ...prev, userId, pageNumber: 0 }));
  }, []);

  const handleFilterByIp = useCallback((ip: string) => {
    setFilter((prev) => ({ ...prev, ipAddress: ip, pageNumber: 0 }));
  }, []);

  return (
    <>
      <ComponentCard
        title="Appointment Activity Logs"
        desc="Dedicated view for appointment-related activities — create, confirm, check-in, cancel, reschedule"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {logsData
              ? `${logsData.totalElements.toLocaleString()} activities found`
              : "Loading..."}
          </p>
        </div>

        <ActivityLogFilters filter={filter} onFilterChange={handleFilterChange} />

        <div className="mt-4">
          <ActivityLogTable
            data={logsData}
            isLoading={isLoading}
            filter={filter}
            onFilterChange={handleFilterChange}
            onViewDetail={handleViewDetail}
            onFilterByUser={handleFilterByUser}
            onFilterByIp={handleFilterByIp}
          />
        </div>
      </ComponentCard>

      {selectedLog && (
        <ActivityDetailModal
          log={selectedLog}
          isOpen={!!selectedLog}
          onClose={handleCloseDetail}
          onFilterByUser={handleFilterByUser}
          onFilterByIp={handleFilterByIp}
        />
      )}
    </>
  );
}

