import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import SecurityStatsCards from "./components/SecurityStatsCards";
import SecurityEventFilters from "./components/SecurityEventFilters";
import SecurityEventTable from "./components/SecurityEventTable";
import SecurityEventDetailModal from "./components/SecurityEventDetailModal";
import SecurityBulkActions from "./components/SecurityBulkActions";
import IpManagement from "./components/IpManagement";
import AuditTrail from "./components/AuditTrail";
import ActivityLogs from "./components/ActivityLogs";
import SessionManagement from "./components/SessionManagement";
import InvestigationTools from "./components/InvestigationTools";
import InventoryAuditLog from "../MedicationManagement/InventoryAuditLog";
import ServiceOrderAuditLog from "./components/ServiceOrderAuditLog";
import {
  SecurityEventDTO,
  SecurityEventFilter,
  BlockIpRequest,
  getSecurityDashboard,
  getSecurityEvents,
  reviewSecurityEvent,
  resolveSecurityEvent,
  blockIp,
  exportSecurityEvents,
  downloadBlob,
} from "../../services/securityService";

export default function SecurityAudit() {
  const queryClient = useQueryClient();

  // State
  const [period, setPeriod] = useState("24h");
  const [filter, setFilter] = useState<SecurityEventFilter>({
    pageNumber: 0,
    pageSize: 20,
    sortBy: "createdAt",
    sortDir: "DESC",
  });
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<SecurityEventDTO | null>(null);

  // Queries
  const { data: dashboard, isLoading: isDashboardLoading } = useQuery({
    queryKey: ["security-dashboard", period],
    queryFn: () => getSecurityDashboard(period),
  });

  const { data: eventsData, isLoading: isEventsLoading } = useQuery({
    queryKey: ["security-events", filter],
    queryFn: () => getSecurityEvents(filter),
  });

  // Mutations
  const reviewMutation = useMutation({
    mutationFn: (id: number) => reviewSecurityEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["security-events"] });
      queryClient.invalidateQueries({ queryKey: ["security-dashboard"] });
      if (selectedEvent) {
        setSelectedEvent((prev) =>
          prev ? { ...prev, status: "REVIEWED" } : null
        );
      }
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || "Failed to review event");
    },
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, note }: { id: number; note: string }) =>
      resolveSecurityEvent(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["security-events"] });
      queryClient.invalidateQueries({ queryKey: ["security-dashboard"] });
      if (selectedEvent) {
        setSelectedEvent((prev) =>
          prev ? { ...prev, status: "RESOLVED" } : null
        );
      }
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || "Failed to resolve event");
    },
  });

  const blockIpMutation = useMutation({
    mutationFn: (data: BlockIpRequest) => blockIp(data),
    onSuccess: () => {
      alert("IP address blocked successfully");
      queryClient.invalidateQueries({ queryKey: ["security-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["ip-management-stats"] });
      queryClient.invalidateQueries({ queryKey: ["blocked-ips"] });
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || "Failed to block IP");
    },
  });

  const exportMutation = useMutation({
    mutationFn: (format: "csv" | "excel" | "pdf") =>
      exportSecurityEvents(format, filter),
    onSuccess: (blob, format) => {
      const ext = format === "excel" ? "xlsx" : format;
      downloadBlob(blob, `security_events_${dayjs().format("YYYY-MM-DD")}.${ext}`);
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || "Export failed");
    },
  });

  // Handlers
  const handleFilterChange = useCallback((newFilter: SecurityEventFilter) => {
    setFilter(newFilter);
    setSelectedIds([]);
  }, []);

  const handleToggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  const handleToggleSelectAll = useCallback(() => {
    if (!eventsData?.content) return;
    const allIds = eventsData.content.map((e) => e.id);
    setSelectedIds((prev) =>
      prev.length === allIds.length ? [] : allIds
    );
  }, [eventsData]);

  const handleViewDetail = useCallback((event: SecurityEventDTO) => {
    setSelectedEvent(event);
  }, []);

  const handleBlockIp = useCallback((ip: string) => {
    if (confirm(`Quick block IP: ${ip}?\nFor advanced options, use the IP Management section below.`)) {
      blockIpMutation.mutate({
        ipAddress: ip,
        reason: "Blocked from security event review",
        blockType: "TEMPORARY",
        blockScope: "ENTIRE_SYSTEM",
      });
    }
  }, [blockIpMutation]);

  const handleReviewSelected = useCallback(async () => {
    for (const id of selectedIds) {
      await reviewSecurityEvent(id);
    }
    queryClient.invalidateQueries({ queryKey: ["security-events"] });
    queryClient.invalidateQueries({ queryKey: ["security-dashboard"] });
    setSelectedIds([]);
  }, [selectedIds, queryClient]);

  const handleExportSelected = useCallback(() => {
    exportMutation.mutate("csv");
  }, [exportMutation]);

  return (
    <>
      <PageMeta
        title="Security & Audit | MedicalTech Dashboard"
        description="Security event monitoring and audit logs"
      />
      <PageBreadcrumb pageTitle="Security & Audit" />

      <div className="space-y-6">
        {/* Dashboard Stats */}
        <SecurityStatsCards
          dashboard={dashboard}
          isLoading={isDashboardLoading}
          period={period}
          onPeriodChange={setPeriod}
        />

        {/* Events Section */}
        <ComponentCard
          title="Security Events"
          desc="Monitor and manage security events across the system"
        >
          {/* Export Buttons */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {eventsData
                ? `${eventsData.totalElements} events found`
                : "Loading..."}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => exportMutation.mutate("csv")}
                disabled={exportMutation.isPending}
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                CSV
              </button>
              <button
                onClick={() => exportMutation.mutate("excel")}
                disabled={exportMutation.isPending}
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Excel
              </button>
              <button
                onClick={() => exportMutation.mutate("pdf")}
                disabled={exportMutation.isPending}
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                PDF
              </button>
            </div>
          </div>

          {/* Filters */}
          <SecurityEventFilters
            filter={filter}
            onFilterChange={handleFilterChange}
          />

          {/* Bulk Actions */}
          <div className="mt-4">
            <SecurityBulkActions
              selectedCount={selectedIds.length}
              onReviewSelected={handleReviewSelected}
              onClearSelection={() => setSelectedIds([])}
              onExportSelected={handleExportSelected}
              isReviewing={reviewMutation.isPending}
            />
          </div>

          {/* Events Table */}
          <div className="mt-4">
            <SecurityEventTable
              data={eventsData}
              isLoading={isEventsLoading}
              filter={filter}
              onFilterChange={handleFilterChange}
              onViewDetail={handleViewDetail}
              onBlockIp={handleBlockIp}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onToggleSelectAll={handleToggleSelectAll}
            />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{dashboard?.totalSecurityEvents}</p>
        </ComponentCard>

        {/* IP Management Section */}
        <IpManagement />

        {/* Audit Trail Section */}
        <AuditTrail />

        {/* Activity Logs Section */}
        <ActivityLogs />

        {/* Session Management Section */}
        <SessionManagement />

        {/* Investigation Tools Section */}
        <InvestigationTools />

        {/* Inventory Audit Log Section */}
        <ComponentCard title="Inventory Audit Log" desc="Track all medication inventory changes including imports, exports, adjustments, and prescription deductions">
          <InventoryAuditLog embedded />
        </ComponentCard>

        {/* Service Order Audit Log Section */}
        <ServiceOrderAuditLog />
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <SecurityEventDetailModal
          event={selectedEvent}
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onReview={(id) => reviewMutation.mutate(id)}
          onResolve={(id, note) => resolveMutation.mutate({ id, note })}
          onBlockIp={handleBlockIp}
          isReviewing={reviewMutation.isPending}
          isResolving={resolveMutation.isPending}
        />
      )}

    </>
  );
}
