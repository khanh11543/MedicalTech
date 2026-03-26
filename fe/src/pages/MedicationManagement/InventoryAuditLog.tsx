import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Badge from "../../components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import medicationService, {
  InventoryLogDTO,
  InventoryAuditFilterParams,
} from "../../services/medicationService";

// ==================== ICONS ====================
const SearchIcon = () => (
  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const RefreshIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);
const ChevronLeftIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);
const ChevronRightIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);
const XIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const FilterIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);
const ClockIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const TotalIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);
const WeekIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);
const MonthIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

// ==================== ACTION BADGES ====================
const ACTION_CONFIG: Record<string, { label: string; color: "success" | "error" | "warning" | "info" | "primary" | "light" }> = {
  INVENTORY_IMPORT: { label: "Import", color: "success" },
  INVENTORY_EXPORT: { label: "Export", color: "error" },
  INVENTORY_ADJUST: { label: "Adjust", color: "warning" },
  INVENTORY_DEDUCT_BY_PRESCRIPTION: { label: "Deduct (Prescription)", color: "error" },
  INVENTORY_RESTORE_BY_REFUND: { label: "Restore (Refund)", color: "success" },
  INVENTORY_RESTORE_BY_CANCEL: { label: "Restore (Cancel)", color: "info" },
  INITIAL: { label: "Initial", color: "light" },
  // Legacy types
  IMPORT: { label: "Import", color: "success" },
  ADJUST: { label: "Adjust", color: "warning" },
  PRESCRIPTION: { label: "Prescription", color: "error" },
};

const REFERENCE_TYPE_LABELS: Record<string, string> = {
  MANUAL: "Manual",
  PRESCRIPTION: "Prescription",
  PAYMENT: "Payment",
  REFUND: "Refund",
  SYSTEM: "System",
};

// ==================== COMPONENT ====================
export default function InventoryAuditLog() {
  // Filter state
  const [filters, setFilters] = useState<InventoryAuditFilterParams>({
    page: 0,
    size: 20,
    sortBy: "changedAt",
    sortDir: "DESC",
  });
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<InventoryLogDTO | null>(null);

  // Data queries
  const {
    data: logsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["inventoryAuditLogs", filters],
    queryFn: () => medicationService.getInventoryAuditLogs(filters),
  });

  const { data: stats } = useQuery({
    queryKey: ["inventoryAuditStats"],
    queryFn: () => medicationService.getInventoryAuditStats(),
  });

  // Handlers
  const handleSearch = useCallback(() => {
    setFilters((prev) => ({ ...prev, search, page: 0 }));
  }, [search]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleSearch();
    },
    [handleSearch]
  );

  const handleFilterChange = (field: keyof InventoryAuditFilterParams, value: string | number | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value || undefined,
      page: 0,
    }));
  };

  const clearFilters = () => {
    setSearch("");
    setFilters({ page: 0, size: 20, sortBy: "changedAt", sortDir: "DESC" });
  };

  const hasActiveFilters = !!(
    filters.action || filters.referenceType || filters.medicationId ||
    filters.from || filters.to || filters.search
  );

  // ─── Render ───
  return (
    <>
      <PageMeta title="Inventory Audit Log | MediTech Admin" description="View inventory change audit trail" />
      <PageBreadcrumb pageTitle="Inventory Audit Log" />

      <div className="space-y-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={<TotalIcon />}
              label="Total Logs"
              value={stats.totalLogs.toLocaleString()}
              color="blue"
            />
            <StatCard
              icon={<ClockIcon />}
              label="Today"
              value={stats.logsToday.toLocaleString()}
              color="green"
            />
            <StatCard
              icon={<WeekIcon />}
              label="This Week"
              value={stats.logsThisWeek.toLocaleString()}
              color="yellow"
            />
            <StatCard
              icon={<MonthIcon />}
              label="This Month"
              value={stats.logsThisMonth.toLocaleString()}
              color="purple"
            />
          </div>
        )}

        {/* Action Type Breakdown */}
        {stats?.countByAction && Object.keys(stats.countByAction).length > 0 && (
          <ComponentCard title="Recent Activity by Action (Last 30 Days)">
            <div className="flex flex-wrap gap-3">
              {Object.entries(stats.countByAction).map(([action, count]) => {
                const config = ACTION_CONFIG[action] || { label: action, color: "light" as const };
                return (
                  <div
                    key={action}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                  >
                    <Badge color={config.color}>{config.label}</Badge>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </ComponentCard>
        )}

        {/* Search & Filters */}
        <ComponentCard title="Inventory Logs">
          <div className="mb-4 space-y-3">
            {/* Search Bar + Actions */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <SearchIcon />
                </div>
                <input
                  type="text"
                  placeholder="Search by medication name, code, or note..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="block w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 focus:border-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSearch}
                  className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
                >
                  Search
                </button>
                <button
                  onClick={() => setShowFilters((prev) => !prev)}
                  className={`flex items-center gap-1 rounded-lg border px-3 py-2.5 text-sm font-medium ${
                    showFilters || hasActiveFilters
                      ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-900/20"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                  }`}
                >
                  <FilterIcon />
                  Filters
                  {hasActiveFilters && (
                    <span className="ml-1 rounded-full bg-brand-500 px-1.5 py-0.5 text-xs text-white">!</span>
                  )}
                </button>
                <button
                  onClick={() => refetch()}
                  className="rounded-lg border border-gray-300 p-2.5 text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400"
                  title="Refresh"
                >
                  <RefreshIcon />
                </button>
              </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                      Action
                    </label>
                    <select
                      value={filters.action || ""}
                      onChange={(e) => handleFilterChange("action", e.target.value)}
                      className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">All Actions</option>
                      {(stats?.availableActions || []).map((a) => (
                        <option key={a} value={a}>
                          {ACTION_CONFIG[a]?.label || a}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                      Reference Type
                    </label>
                    <select
                      value={filters.referenceType || ""}
                      onChange={(e) => handleFilterChange("referenceType", e.target.value)}
                      className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">All</option>
                      {(stats?.availableReferenceTypes || []).map((rt) => (
                        <option key={rt} value={rt}>
                          {REFERENCE_TYPE_LABELS[rt] || rt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={filters.from || ""}
                      onChange={(e) => handleFilterChange("from", e.target.value)}
                      className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={filters.to || ""}
                      onChange={(e) => handleFilterChange("to", e.target.value)}
                      className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
                {hasActiveFilters && (
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={clearFilters}
                      className="text-sm text-red-500 hover:text-red-700"
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                <TableRow>
                  <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Time
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Medication
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Action
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Before
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Change
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    After
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    By
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Reference
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Note
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <td className="px-4 py-8 text-center text-gray-500" colSpan={9}>
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-brand-500" />
                        Loading...
                      </div>
                    </td>
                  </TableRow>
                ) : !logsData?.content?.length ? (
                  <TableRow>
                    <td className="px-4 py-8 text-center text-gray-500" colSpan={9}>
                      No audit logs found.
                    </td>
                  </TableRow>
                ) : (
                  logsData.content.map((log) => {
                    const config = ACTION_CONFIG[log.type] || { label: log.type, color: "light" as const };
                    return (
                      <TableRow
                        key={log.id}
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        onClick={() => setSelectedLog(log)}
                      >
                        <TableCell className="whitespace-nowrap px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {dayjs(log.changedAt).format("DD/MM/YYYY HH:mm")}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {log.medicationName}
                          </div>
                          <div className="text-xs text-gray-500">{log.medicationCode}</div>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <Badge color={config.color}>{config.label}</Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">
                          {log.quantityBefore}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          <span
                            className={`text-sm font-semibold ${
                              log.delta > 0
                                ? "text-green-600 dark:text-green-400"
                                : log.delta < 0
                                ? "text-red-600 dark:text-red-400"
                                : "text-gray-500"
                            }`}
                          >
                            {log.delta > 0 ? `+${log.delta}` : log.delta}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">
                          {log.quantityAfter}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {log.userName || "System"}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          {log.referenceType && (
                            <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                              {REFERENCE_TYPE_LABELS[log.referenceType] || log.referenceType}
                              {log.referenceId && ` #${log.referenceId}`}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[200px] px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                          <div className="truncate" title={log.note || ""}>
                            {log.note || "-"}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {logsData && logsData.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {(filters.page || 0) * (filters.size || 20) + 1} -{" "}
                {Math.min(
                  ((filters.page || 0) + 1) * (filters.size || 20),
                  logsData.totalElements
                )}{" "}
                of {logsData.totalElements}
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={(filters.page || 0) === 0}
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, page: (prev.page || 0) - 1 }))
                  }
                  className="rounded-md border border-gray-300 p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600"
                >
                  <ChevronLeftIcon />
                </button>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Page {(filters.page || 0) + 1} of {logsData.totalPages}
                </span>
                <button
                  disabled={(filters.page || 0) >= logsData.totalPages - 1}
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, page: (prev.page || 0) + 1 }))
                  }
                  className="rounded-md border border-gray-300 p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600"
                >
                  <ChevronRightIcon />
                </button>
              </div>
            </div>
          )}
        </ComponentCard>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </>
  );
}

// ==================== STAT CARD ====================
function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "blue" | "green" | "yellow" | "purple";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    green: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
    yellow: "bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${colors[color]}`}>{icon}</div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

// ==================== DETAIL MODAL ====================
function LogDetailModal({
  log,
  onClose,
}: {
  log: InventoryLogDTO;
  onClose: () => void;
}) {
  const config = ACTION_CONFIG[log.type] || { label: log.type, color: "light" as const };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Audit Log Detail
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
          >
            <XIcon />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-5">
          {/* Medication */}
          <DetailRow label="Medication" value={`${log.medicationName} (${log.medicationCode})`} />

          {/* Action */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">Action</span>
            <Badge color={config.color}>{config.label}</Badge>
          </div>

          {/* Quantity Change */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
            <div className="flex items-center justify-between text-center">
              <div>
                <p className="text-xs text-gray-500">Before</p>
                <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                  {log.quantityBefore}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Change</p>
                <p
                  className={`text-2xl font-bold ${
                    log.delta > 0
                      ? "text-green-600"
                      : log.delta < 0
                      ? "text-red-600"
                      : "text-gray-500"
                  }`}
                >
                  {log.delta > 0 ? `+${log.delta}` : log.delta}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">After</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {log.quantityAfter}
                </p>
              </div>
            </div>
          </div>

          {/* Note */}
          {log.note && <DetailRow label="Note" value={log.note} />}

          {/* Reference */}
          {log.referenceType && (
            <DetailRow
              label="Reference"
              value={`${REFERENCE_TYPE_LABELS[log.referenceType] || log.referenceType}${
                log.referenceId ? ` #${log.referenceId}` : ""
              }`}
            />
          )}

          {/* User */}
          <DetailRow label="Performed By" value={log.userName || "System"} />

          {/* Time */}
          <DetailRow
            label="Time"
            value={dayjs(log.changedAt).format("DD/MM/YYYY HH:mm:ss")}
          />

          {/* IP & User Agent (only if present) */}
          {log.ipAddress && <DetailRow label="IP Address" value={log.ipAddress} />}
          {log.userAgent && (
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">User Agent</span>
              <p className="mt-0.5 break-all text-xs text-gray-600 dark:text-gray-400">
                {log.userAgent}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-gray-200 px-6 py-4 dark:border-gray-700">
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-right text-sm font-medium text-gray-900 dark:text-white">
        {value}
      </span>
    </div>
  );
}
