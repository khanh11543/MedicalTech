import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Badge from "../../components/ui/badge/Badge";
import ComponentCard from "../../components/common/ComponentCard";
import gdprService, {
  ConsentStatsDTO,
  UserConsentDTO,
  UserConsentDetailDTO,
  ConsentTrendsDTO,
  ConsentFilter,
  ConsentType,
  ConsentStatus,
} from "../../services/gdprService";

const CONSENT_TYPE_LABELS: Record<ConsentType, string> = {
  TERMS_OF_SERVICE: "Terms of Service",
  PRIVACY_POLICY: "Privacy Policy",
  MARKETING_EMAILS: "Marketing Emails",
  SMS_NOTIFICATIONS: "SMS Notifications",
  DATA_PROCESSING: "Data Processing",
  THIRD_PARTY_SHARING: "Third-Party Sharing",
  RESEARCH_PARTICIPATION: "Research Participation",
};

const STATUS_COLORS: Record<ConsentStatus, "success" | "error" | "warning"> = {
  ACCEPTED: "success",
  DECLINED: "error",
  REVOKED: "warning",
};

export default function ConsentManagement() {
  // Stats
  const [stats, setStats] = useState<ConsentStatsDTO | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Trends
  const [trends, setTrends] = useState<ConsentTrendsDTO | null>(null);
  const [trendsLoading, setTrendsLoading] = useState(false);

  // Records
  const [records, setRecords] = useState<UserConsentDTO[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<ConsentFilter>({
    pageNumber: 0,
    pageSize: 10,
    sortBy: "consentDate",
    sortDir: "DESC",
  });

  // User detail modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [userDetail, setUserDetail] = useState<UserConsentDetailDTO | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Revoke modal
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [revokeId, setRevokeId] = useState<number | null>(null);
  const [revokeForm, setRevokeForm] = useState({ revocationReason: "", sendNotification: true });
  const [revoking, setRevoking] = useState(false);

  // Export
  const [exporting, setExporting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const formatDate = (date: string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const data = await gdprService.getConsentStatistics();
      setStats(data);
    } catch {
      // ignore
    } finally {
      setStatsLoading(false);
    }
  };

  const loadTrends = async () => {
    setTrendsLoading(true);
    try {
      const now = new Date();
      const sixMonthsAgo = new Date(now);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const data = await gdprService.getConsentTrends(
        sixMonthsAgo.toISOString().split("T")[0],
        now.toISOString().split("T")[0],
        "MONTH"
      );
      setTrends(data);
    } catch {
      // ignore
    } finally {
      setTrendsLoading(false);
    }
  };

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const data = await gdprService.getConsentRecords(filter);
      setRecords(data.content);
      setTotalElements(data.totalElements);
      setTotalPages(data.totalPages);
    } catch {
      showToast("Failed to load consent records", "error");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadStats();
    loadTrends();
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const handleViewDetail = async (userId: number) => {
    setDetailLoading(true);
    setDetailModalOpen(true);
    try {
      const detail = await gdprService.getUserConsentDetail(userId);
      setUserDetail(detail);
    } catch {
      showToast("Failed to load user consent details", "error");
      setDetailModalOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const openRevoke = (id: number) => {
    setRevokeId(id);
    setRevokeForm({ revocationReason: "", sendNotification: true });
    setRevokeModalOpen(true);
  };

  const submitRevoke = async () => {
    if (revokeId === null) return;
    setRevoking(true);
    try {
      await gdprService.revokeConsent(revokeId, revokeForm);
      showToast("Consent revoked successfully", "success");
      setRevokeModalOpen(false);
      loadRecords();
      loadStats();
    } catch {
      showToast("Failed to revoke consent", "error");
    } finally {
      setRevoking(false);
    }
  };

  const handleExport = async (format: string) => {
    setExporting(true);
    try {
      const blob = await gdprService.exportConsentRecords({ format });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `consent_records.${format.toLowerCase() === "excel" ? "xlsx" : "csv"}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast("Export downloaded", "success");
    } catch {
      showToast("Failed to export records", "error");
    } finally {
      setExporting(false);
    }
  };

  // Simple bar chart for trends
  const maxTrendValue = trends
    ? Math.max(...trends.dataPoints.map((p: { total: number }) => p.total), 1)
    : 1;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[99999] px-6 py-3 rounded-lg shadow-lg text-white ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
          {toast.message}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 bg-white rounded-xl border border-gray-200 dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg dark:bg-blue-500/20">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                {statsLoading ? "..." : stats?.totalUsers ?? 0}
              </h3>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl border border-gray-200 dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg dark:bg-green-500/20">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Accepted</p>
              <h3 className="text-2xl font-bold text-green-500">
                {statsLoading ? "..." : stats?.acceptedCount ?? 0}
              </h3>
              <p className="text-xs text-gray-400">{stats?.acceptanceRate?.toFixed(1) ?? 0}% rate</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl border border-gray-200 dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-lg dark:bg-red-500/20">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Declined / Revoked</p>
              <h3 className="text-2xl font-bold text-red-500">
                {statsLoading ? "..." : (stats?.declinedCount ?? 0) + (stats?.revokedCount ?? 0)}
              </h3>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl border border-gray-200 dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg dark:bg-purple-500/20">
              <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Consents</p>
              <h3 className="text-2xl font-bold text-purple-500">
                {statsLoading ? "..." : stats?.totalConsents ?? 0}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Consent by Type Stats */}
      {stats?.consentsByType && Object.keys(stats.consentsByType).length > 0 && (
        <ComponentCard title="Consent by Type">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Object.entries(stats.consentsByType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {CONSENT_TYPE_LABELS[type as ConsentType] || type}
                </span>
                <span className="font-bold text-gray-800 dark:text-white">{count as number}</span>
              </div>
            ))}
          </div>
        </ComponentCard>
      )}

      {/* Consent Trends Chart */}
      {trends && trends.dataPoints.length > 0 && (
        <ComponentCard title="Consent Trends Over Time">
          {trendsLoading ? (
            <div className="h-48 flex items-center justify-center text-gray-500">Loading trends...</div>
          ) : (
            <div>
              <div className="flex items-end justify-between gap-1 h-48 mb-4 px-4">
                {trends.dataPoints.map((point: { period: string; accepted: number; declined: number; revoked: number; total: number }, i: number) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex flex-col items-center gap-0.5" style={{ height: "160px" }}>
                      {/* Accepted bar */}
                      <div
                        className="w-3/4 bg-green-400 dark:bg-green-500 rounded-t"
                        style={{ height: `${(point.accepted / maxTrendValue) * 100}%`, minHeight: point.accepted > 0 ? "4px" : "0" }}
                        title={`Accepted: ${point.accepted}`}
                      />
                      {/* Declined bar */}
                      <div
                        className="w-3/4 bg-red-400 dark:bg-red-500 rounded"
                        style={{ height: `${(point.declined / maxTrendValue) * 100}%`, minHeight: point.declined > 0 ? "4px" : "0" }}
                        title={`Declined: ${point.declined}`}
                      />
                      {/* Revoked bar */}
                      <div
                        className="w-3/4 bg-yellow-400 dark:bg-yellow-500 rounded-b"
                        style={{ height: `${(point.revoked / maxTrendValue) * 100}%`, minHeight: point.revoked > 0 ? "4px" : "0" }}
                        title={`Revoked: ${point.revoked}`}
                      />
                    </div>
                    <span className="text-xs text-gray-400 mt-1 truncate w-full text-center">{point.period}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-400 rounded" /> Accepted ({trends.totalAccepted})</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-400 rounded" /> Declined ({trends.totalDeclined})</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-400 rounded" /> Revoked ({trends.totalRevoked})</div>
              </div>
            </div>
          )}
        </ComponentCard>
      )}

      {/* Consent Records */}
      <ComponentCard title="User Consent Records">
        <div className="flex flex-wrap items-end gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Consent Type</label>
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm"
              value={filter.consentType || ""}
              onChange={(e) => setFilter({ ...filter, consentType: (e.target.value || undefined) as ConsentType | undefined, pageNumber: 0 })}
            >
              <option value="">All Types</option>
              {Object.entries(CONSENT_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm"
              value={filter.status || ""}
              onChange={(e) => setFilter({ ...filter, status: (e.target.value || undefined) as ConsentStatus | undefined, pageNumber: 0 })}
            >
              <option value="">All Status</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="DECLINED">Declined</option>
              <option value="REVOKED">Revoked</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From Date</label>
            <input
              type="date"
              className="px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm"
              value={filter.from || ""}
              onChange={(e) => setFilter({ ...filter, from: e.target.value || undefined, pageNumber: 0 })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To Date</label>
            <input
              type="date"
              className="px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm"
              value={filter.to || ""}
              onChange={(e) => setFilter({ ...filter, to: e.target.value || undefined, pageNumber: 0 })}
            />
          </div>
          <button
            onClick={() => setFilter({ pageNumber: 0, pageSize: 10, sortBy: "consentDate", sortDir: "DESC" })}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Reset
          </button>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => handleExport("CSV")}
              disabled={exporting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Export CSV
            </button>
            <button
              onClick={() => handleExport("EXCEL")}
              disabled={exporting}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              Export Excel
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">User</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Consent Type</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Status</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Date</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">IP Address</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {loading ? (
                  <TableRow>
                    <td className="px-5 py-8 text-center text-gray-500" colSpan={6}>
                      <div className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        Loading...
                      </div>
                    </td>
                  </TableRow>
                ) : records.length === 0 ? (
                  <TableRow>
                    <td className="px-5 py-8 text-center text-gray-500" colSpan={6}>No consent records found</td>
                  </TableRow>
                ) : (
                  records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="px-5 py-4 text-start">
                        <div>
                          <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">{record.userName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{record.userEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {CONSENT_TYPE_LABELS[record.consentType] || record.consentType}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <Badge size="sm" color={STATUS_COLORS[record.status]}>
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {formatDate(record.consentDate)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {record.ipAddress || "—"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleViewDetail(record.userId)}
                            className="px-2.5 py-1 text-xs font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            View
                          </button>
                          {record.status === "ACCEPTED" && (
                            <button
                              onClick={() => openRevoke(record.id)}
                              className="px-2.5 py-1 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {(filter.pageNumber ?? 0) * (filter.pageSize ?? 10) + 1} to{" "}
              {Math.min(((filter.pageNumber ?? 0) + 1) * (filter.pageSize ?? 10), totalElements)} of {totalElements}
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={(filter.pageNumber ?? 0) === 0}
                onClick={() => setFilter({ ...filter, pageNumber: (filter.pageNumber ?? 0) - 1 })}
                className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Page {(filter.pageNumber ?? 0) + 1} of {totalPages}
              </span>
              <button
                disabled={(filter.pageNumber ?? 0) + 1 >= totalPages}
                onClick={() => setFilter({ ...filter, pageNumber: (filter.pageNumber ?? 0) + 1 })}
                className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </ComponentCard>

      {/* User Consent Detail Modal */}
      {detailModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">User Consent Detail</h3>
            </div>
            {detailLoading ? (
              <div className="p-12 text-center text-gray-500">
                <svg className="animate-spin h-8 w-8 mx-auto mb-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Loading...
              </div>
            ) : userDetail ? (
              <div className="p-6 space-y-6">
                {/* User Info */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">User Information</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-gray-500">Name:</span> <span className="font-medium dark:text-white">{userDetail.userName}</span></div>
                    <div><span className="text-gray-500">Email:</span> <span className="font-medium dark:text-white">{userDetail.userEmail}</span></div>
                    <div><span className="text-gray-500">ID:</span> <span className="font-medium dark:text-white">{userDetail.userId}</span></div>
                    <div><span className="text-gray-500">Role:</span> <span className="font-medium dark:text-white">{userDetail.userRole}</span></div>
                    <div><span className="text-gray-500">Account Created:</span> <span className="font-medium dark:text-white">{formatDate(userDetail.accountCreatedDate)}</span></div>
                    <div><span className="text-gray-500">Last Login:</span> <span className="font-medium dark:text-white">{formatDate(userDetail.lastLoginDate)}</span></div>
                  </div>
                </div>

                {/* Consent Overview */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-600">{userDetail.totalConsents}</p>
                    <p className="text-xs text-gray-500">Total</p>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600">{userDetail.activeConsents}</p>
                    <p className="text-xs text-gray-500">Active</p>
                  </div>
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center">
                    <p className="text-2xl font-bold text-yellow-600">{userDetail.revokedConsents}</p>
                    <p className="text-xs text-gray-500">Revoked</p>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                    <p className="text-2xl font-bold text-red-600">{userDetail.declinedConsents}</p>
                    <p className="text-xs text-gray-500">Declined</p>
                  </div>
                </div>

                {/* Current Consent Status - latest per type */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Current Consent Status</h4>
                  <div className="space-y-2">
                    {userDetail.latestConsents.map((consent: UserConsentDTO) => (
                      <div key={consent.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-white">
                            {CONSENT_TYPE_LABELS[consent.consentType] || consent.consentType}
                          </p>
                          <p className="text-xs text-gray-500">{formatDate(consent.consentDate)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge size="sm" color={STATUS_COLORS[consent.status]}>{consent.status}</Badge>
                          {consent.status === "ACCEPTED" && (
                            <button
                              onClick={() => { setDetailModalOpen(false); openRevoke(consent.id); }}
                              className="px-2 py-0.5 text-xs text-red-500 hover:text-red-700 transition-colors"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Consent History by Type */}
                {userDetail.consentsByType && Object.keys(userDetail.consentsByType).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Consent History (Timeline)</h4>
                    {Object.entries(userDetail.consentsByType).map(([type, consents]) => (
                      <div key={type} className="mb-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                          {CONSENT_TYPE_LABELS[type as ConsentType] || type}
                        </p>
                        <div className="border-l-2 border-gray-200 dark:border-gray-600 ml-3 space-y-3">
                          {(consents as UserConsentDTO[]).map((c: UserConsentDTO) => (
                            <div key={c.id} className="ml-4 relative">
                              <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-500" />
                              <div className="text-sm">
                                <div className="flex items-center gap-2">
                                  <Badge size="sm" color={STATUS_COLORS[c.status]}>{c.status}</Badge>
                                  <span className="text-gray-500 text-xs">{formatDate(c.consentDate)}</span>
                                </div>
                                {c.version && <p className="text-xs text-gray-400 mt-0.5">Version: {c.version}</p>}
                                {c.ipAddress && <p className="text-xs text-gray-400">IP: {c.ipAddress}</p>}
                                {c.userAgent && <p className="text-xs text-gray-400 truncate max-w-md">Agent: {c.userAgent}</p>}
                                {c.revocationReason && <p className="text-xs text-red-500 mt-0.5">Reason: {c.revocationReason}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button onClick={() => setDetailModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Modal */}
      {revokeModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Revoke Consent</h3>
              <p className="text-sm text-gray-500 mt-1">This will revoke consent on the user's behalf</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason for Revocation</label>
                <textarea
                  value={revokeForm.revocationReason}
                  onChange={(e) => setRevokeForm({ ...revokeForm, revocationReason: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
                  placeholder="Enter reason for revoking consent..."
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={revokeForm.sendNotification}
                  onChange={(e) => setRevokeForm({ ...revokeForm, sendNotification: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Notify User</span>
              </label>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button onClick={() => setRevokeModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 transition-colors">Cancel</button>
              <button
                onClick={submitRevoke}
                disabled={revoking || !revokeForm.revocationReason}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {revoking ? "Revoking..." : "Revoke Consent"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
