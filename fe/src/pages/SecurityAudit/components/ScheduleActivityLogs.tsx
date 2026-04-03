import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ComponentCard from "../../../components/common/ComponentCard";
import ActivityLogFilters from "./ActivityLogFilters";
import ActivityLogTable from "./ActivityLogTable";
import ActivityDetailModal from "./ActivityDetailModal";
import {
  ActivityLogDTO,
  ActivityLogFilter,
  ActivityType,
  getActivityLogs,
} from "../../../services/securityService";

type Preset = "DOCTOR_SCHEDULE" | "DOCTOR_TIME_SLOTS" | "ADMIN_TIME_SLOTS";

const PRESETS: Record<Preset, { title: string; desc: string; filter: ActivityLogFilter }> = {
  DOCTOR_SCHEDULE: {
    title: "Doctor Schedule Logs",
    desc: "Schedule changes made by doctors (weekly schedules & exceptions)",
    filter: {
      pageNumber: 0,
      pageSize: 20,
      sortBy: "createdAt",
      sortDir: "DESC",
      roleName: "DOCTOR",
      resourceType: "SCHEDULE",
      activityTypes: [
        "CREATED_SCHEDULE",
        "UPDATED_SCHEDULE",
        "DELETED_SCHEDULE",
        "ADDED_SCHEDULE_EXCEPTION",
        "DELETED_SCHEDULE_EXCEPTION",
      ],
    },
  },
  DOCTOR_TIME_SLOTS: {
    title: "Doctor Time Slot Logs",
    desc: "Time-slot actions initiated by doctors (generation, etc.)",
    filter: {
      pageNumber: 0,
      pageSize: 20,
      sortBy: "createdAt",
      sortDir: "DESC",
      roleName: "DOCTOR",
      resourceType: "TIME_SLOT",
      activityTypes: ["GENERATED_TIME_SLOTS"] as ActivityType[],
    },
  },
  ADMIN_TIME_SLOTS: {
    title: "Admin Time Slot Logs",
    desc: "Time-slot management actions performed by admins (create/update/block/bulk/rollback)",
    filter: {
      pageNumber: 0,
      pageSize: 20,
      sortBy: "createdAt",
      sortDir: "DESC",
      roleName: "ADMIN",
      resourceType: "TIME_SLOT",
      activityTypes: [
        "CREATED_TIME_SLOT",
        "UPDATED_TIME_SLOT",
        "DELETED_TIME_SLOT",
        "BLOCKED_TIME_SLOT",
        "UNBLOCKED_TIME_SLOT",
        "BULK_CREATED_TIME_SLOTS",
        "BULK_BLOCKED_TIME_SLOTS",
        "BULK_UNBLOCKED_TIME_SLOTS",
        "ROLLED_BACK_TIME_SLOTS",
      ],
    },
  },
};

export default function ScheduleActivityLogs() {
  const [preset, setPreset] = useState<Preset>("DOCTOR_SCHEDULE");
  const [filter, setFilter] = useState<ActivityLogFilter>(PRESETS[preset].filter);
  const [selectedLog, setSelectedLog] = useState<ActivityLogDTO | null>(null);

  const { data: logsData, isLoading } = useQuery({
    queryKey: ["schedule-activity-logs", preset, filter],
    queryFn: () => getActivityLogs(filter),
  });

  const applyPreset = useCallback((p: Preset) => {
    setPreset(p);
    setFilter(PRESETS[p].filter);
    setSelectedLog(null);
  }, []);

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
      <ComponentCard title="Schedule Logs" desc="Schedule and time-slot activities grouped by role">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {(
            [
              ["DOCTOR_SCHEDULE", "Doctor Schedules"],
              ["DOCTOR_TIME_SLOTS", "Doctor Time Slots"],
              ["ADMIN_TIME_SLOTS", "Admin Time Slots"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => applyPreset(key)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                preset === key
                  ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                  : "border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mb-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            <span className="font-medium text-gray-700 dark:text-gray-300">{PRESETS[preset].title}.</span>{" "}
            {PRESETS[preset].desc}{" "}
            {logsData ? `(${logsData.totalElements.toLocaleString()} found)` : ""}
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

