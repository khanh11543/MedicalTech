import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import ComponentCard from "../../../components/common/ComponentCard";
import AuditLogFilters from "./AuditLogFilters";
import AuditLogTable from "./AuditLogTable";
import AuditDetailModal from "./AuditDetailModal";
import AuditStats from "./AuditStats";
import AuditExport from "./AuditExport";
import ComplianceReport from "./ComplianceReport";
import {
  AuditLogFilter,
  AuditLogDetailDTO,
  getAuditLogs,
  getAuditLogDetail,
  getAuditLogStats,
} from "../../../services/securityService";

export default function AuditTrail() {
  // Filter state
  const [filter, setFilter] = useState<AuditLogFilter>({
    pageNumber: 0,
    pageSize: 20,
    sortBy: "createdAt",
    sortDir: "DESC",
  });

  // Stats period
  const [statsPeriod, setStatsPeriod] = useState("7d");

  // Detail modal state
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);

  // View toggle: table | stats
  const [activeView, setActiveView] = useState<"table" | "stats">("table");

  // === Queries ===
  const { data: logsData, isLoading: isLogsLoading } = useQuery({
    queryKey: ["audit-logs", filter],
    queryFn: () => getAuditLogs(filter),
  });

  const { data: logDetail, isLoading: isDetailLoading } = useQuery({
    queryKey: ["audit-log-detail", selectedLogId],
    queryFn: () => getAuditLogDetail(selectedLogId!),
    enabled: !!selectedLogId,
  });

  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["audit-log-stats", statsPeriod],
    queryFn: () => getAuditLogStats(statsPeriod),
  });

  // === Handlers ===
  const handleFilterChange = useCallback((newFilter: AuditLogFilter) => {
    setFilter(newFilter);
  }, []);

  const handleViewDetail = useCallback((log: { id: number }) => {
    setSelectedLogId(log.id);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedLogId(null);
  }, []);

  const handleNavigate = useCallback((id: number) => {
    setSelectedLogId(id);
  }, []);

  const handleFilterByIp = useCallback(
    (ip: string) => {
      setFilter((prev) => ({
        ...prev,
        ipAddress: ip,
        pageNumber: 0,
      }));
      setActiveView("table");
    },
    []
  );

  const handleFilterByUser = useCallback(
    (userId: number) => {
      setFilter((prev) => ({
        ...prev,
        userId,
        pageNumber: 0,
      }));
      setActiveView("table");
    },
    []
  );

  const handleFilterByEntity = useCallback(
    (entityType: string, entityId: number) => {
      setFilter((prev) => ({
        ...prev,
        entityId: String(entityId),
        pageNumber: 0,
      }));
      setActiveView("table");
    },
    []
  );

  return (
    <>
      <ComponentCard
        title="Audit Trail"
        desc="Read-only audit log of all system changes for compliance and monitoring"
      >
        {/* View Toggle + Actions Bar */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {/* View Toggle */}
          <div className="flex rounded-lg border border-gray-300 dark:border-gray-600">
            <button
              onClick={() => setActiveView("table")}
              className={`flex items-center gap-1.5 rounded-l-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeView === "table"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Audit Logs
            </button>
            <button
              onClick={() => setActiveView("stats")}
              className={`flex items-center gap-1.5 rounded-r-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeView === "stats"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Statistics
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <AuditExport
              filter={filter}
              totalCount={logsData?.totalElements || 0}
            />
            <ComplianceReport stats={stats} isLoading={isStatsLoading} />
          </div>
        </div>

        {/* Read-Only Badge */}
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800 dark:bg-amber-900/20">
          <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p className="text-xs text-amber-700 dark:text-amber-300">
            <span className="font-semibold">Read-Only Access</span> — Audit
            logs cannot be modified or deleted. All data shown is immutable for
            compliance purposes.
          </p>
        </div>

        {/* Table View */}
        {activeView === "table" && (
          <>
            <AuditLogFilters
              filter={filter}
              onFilterChange={handleFilterChange}
            />

            <div className="mt-4">
              <div className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                {logsData
                  ? `${logsData.totalElements.toLocaleString()} audit entries found`
                  : "Loading audit logs..."}
              </div>
              <AuditLogTable
                data={logsData}
                isLoading={isLogsLoading}
                filter={filter}
                onFilterChange={handleFilterChange}
                onViewDetail={handleViewDetail}
                onFilterByIp={handleFilterByIp}
                onFilterByUser={handleFilterByUser}
                onFilterByEntity={handleFilterByEntity}
              />
            </div>
          </>
        )}

        {/* Stats View */}
        {activeView === "stats" && stats && (
          <AuditStats
            stats={stats}
            isLoading={isStatsLoading}
            period={statsPeriod}
            onPeriodChange={setStatsPeriod}
          />
        )}
        {activeView === "stats" && !stats && isStatsLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          </div>
        )}
      </ComponentCard>

      {/* Detail Modal */}
      {selectedLogId && logDetail && (
        <AuditDetailModal
          log={logDetail}
          isOpen={!!selectedLogId}
          onClose={handleCloseDetail}
          onNavigate={handleNavigate}
          onFilterByIp={handleFilterByIp}
          onFilterByUser={handleFilterByUser}
          onFilterByEntity={handleFilterByEntity}
        />
      )}
    </>
  );
}
