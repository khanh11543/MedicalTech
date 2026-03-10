import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import ComponentCard from "../../../components/common/ComponentCard";
import ActivityLogFilters from "./ActivityLogFilters";
import ActivityLogTable from "./ActivityLogTable";
import ActivityDetailModal from "./ActivityDetailModal";
import UserActivityTimeline from "./UserActivityTimeline";
import ActivityExport from "./ActivityExport";
import {
  ActivityLogFilter,
  ActivityLogDTO,
  getActivityLogs,
  getActivityLogById,
  getActivityLogStats,
  ActivityLogStatsDTO,
  ACTIVITY_TYPE_LABELS,
  ACTIVITY_TYPE_COLORS,
} from "../../../services/securityService";

export default function ActivityLogs() {
  // Filter state
  const [filter, setFilter] = useState<ActivityLogFilter>({
    pageNumber: 0,
    pageSize: 20,
    sortBy: "createdAt",
    sortDir: "DESC",
  });

  // Selected log for detail
  const [selectedLog, setSelectedLog] = useState<ActivityLogDTO | null>(null);

  // Timeline view
  const [showTimeline, setShowTimeline] = useState(false);

  // Stats period
  const [statsPeriod, setStatsPeriod] = useState("7d");

  // === Queries ===
  const { data: logsData, isLoading: isLogsLoading } = useQuery({
    queryKey: ["activity-logs", filter],
    queryFn: () => getActivityLogs(filter),
  });

  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["activity-log-stats", statsPeriod],
    queryFn: () => getActivityLogStats(statsPeriod),
  });

  // === Handlers ===
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
    setShowTimeline(false);
  }, []);

  const handleFilterByIp = useCallback((ip: string) => {
    setFilter((prev) => ({ ...prev, ipAddress: ip, pageNumber: 0 }));
    setShowTimeline(false);
  }, []);

  return (
    <>
      <ComponentCard
        title="Activity Logs"
        desc="Track user activities across the system — appointments, payments, prescriptions, and more"
      >
        {/* Stats Summary Bar */}
        {stats && !isStatsLoading && (
          <div className="mb-4 grid grid-cols-4 gap-3">
            {/* Total Activities */}
            <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
              <p className="text-[10px] font-medium text-gray-400 uppercase">Total Activities</p>
              <p className="text-xl font-bold text-gray-800 dark:text-white">
                {stats.totalActivities.toLocaleString()}
              </p>
            </div>

            {/* Top 3 Activity Types */}
            {stats.byActivityType.slice(0, 3).map((at, i) => {
              const type = at.activityType as keyof typeof ACTIVITY_TYPE_COLORS;
              const colors = ACTIVITY_TYPE_COLORS[type] || {
                bg: "bg-gray-100 dark:bg-gray-700",
                text: "text-gray-600 dark:text-gray-300",
                dot: "bg-gray-400",
              };
              const label = ACTIVITY_TYPE_LABELS[type] || at.activityType;
              return (
                <div
                  key={i}
                  className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${colors.dot}`} />
                    <p className="text-[10px] font-medium text-gray-400 uppercase truncate">
                      {label}
                    </p>
                  </div>
                  <p className="text-xl font-bold text-gray-800 dark:text-white">
                    {at.count.toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Action Bar */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {logsData
                ? `${logsData.totalElements.toLocaleString()} activities found`
                : "Loading..."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Timeline Toggle */}
            <button
              onClick={() => setShowTimeline(!showTimeline)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                showTimeline
                  ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                  : "border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
              }`}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              User Timeline
            </button>

            {/* Stats Period */}
            <div className="flex items-center gap-1 rounded-lg border border-gray-300 px-1 dark:border-gray-600">
              {["24h", "7d", "30d", "90d"].map((p) => (
                <button
                  key={p}
                  onClick={() => setStatsPeriod(p)}
                  className={`rounded px-2 py-1 text-[10px] font-medium transition-colors ${
                    statsPeriod === p
                      ? "bg-blue-600 text-white"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Export */}
            <ActivityExport
              filter={filter}
              totalCount={logsData?.totalElements || 0}
            />
          </div>
        </div>

        {/* Timeline View */}
        {showTimeline && (
          <div className="mb-4">
            <UserActivityTimeline
              onViewDetail={handleViewDetail}
              onClose={() => setShowTimeline(false)}
            />
          </div>
        )}

        {/* Filters */}
        <ActivityLogFilters filter={filter} onFilterChange={handleFilterChange} />

        {/* Table */}
        <div className="mt-4">
          <ActivityLogTable
            data={logsData}
            isLoading={isLogsLoading}
            filter={filter}
            onFilterChange={handleFilterChange}
            onViewDetail={handleViewDetail}
            onFilterByUser={handleFilterByUser}
            onFilterByIp={handleFilterByIp}
          />
        </div>
      </ComponentCard>

      {/* Detail Modal */}
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
