import { useState, useCallback, useEffect } from "react";
import receptionistService from "../../../services/receptionistService";
import type { QueuePerformanceReportDTO } from "../../../services/receptionistService";

export default function QueuePerformanceReport() {
  const [report, setReport] = useState<QueuePerformanceReportDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ==================== FETCH ====================

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await receptionistService.getQueuePerformanceReport();
      setReport(data);
    } catch (err: unknown) {
      console.error("Failed to fetch queue performance report:", err);
      setError("Failed to load report. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // ==================== EXPORT ====================

  const handleExport = async (format: "PDF" | "EXCEL" | "CSV") => {
    setExporting(true);
    try {
      const blob = await receptionistService.exportQueuePerformance(format);
      const ext = format === "EXCEL" ? "xlsx" : format.toLowerCase();
      const today = new Date().toISOString().split("T")[0];
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `queue_performance_${today}.${ext}`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Export failed";
      if (message.includes("limit")) {
        alert("Daily export limit exceeded (max 10). Try again tomorrow.");
      } else {
        alert("Export failed. Please try again.");
      }
      console.error("Export error:", err);
    } finally {
      setExporting(false);
    }
  };

  // ==================== HELPERS ====================

  const getWaitColor = (minutes: number) => {
    if (minutes <= 10) return "text-green-600 dark:text-green-400";
    if (minutes <= 20) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getWaitBg = (minutes: number) => {
    if (minutes <= 10) return "bg-green-50 dark:bg-green-900/20";
    if (minutes <= 20) return "bg-yellow-50 dark:bg-yellow-900/20";
    return "bg-red-50 dark:bg-red-900/20";
  };

  // ==================== RENDER ====================

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium text-gray-700 dark:text-gray-300">Today Only</span>
            <span className="text-xs">— Live queue metrics</span>
          </div>

          <button
            onClick={fetchReport}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium flex items-center gap-2"
          >
            <svg className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>

          <div className="flex gap-1 ml-auto">
            {(["PDF", "EXCEL", "CSV"] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => handleExport(fmt)}
                disabled={exporting || !report}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 text-sm font-medium"
              >
                {exporting ? "..." : fmt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-xl border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      )}

      {!loading && report && (
        <>
          {/* Overview Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Checked-In */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Total Checked-In
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {report.totalCheckedIn}
              </div>
            </div>

            {/* Avg Wait */}
            <div className={`rounded-xl border p-5 ${getWaitBg(report.avgWaitMinutes)} border-gray-200 dark:border-gray-700`}>
              <div className="text-sm text-gray-500 dark:text-gray-400">Avg Wait Time</div>
              <div className={`text-3xl font-bold mt-2 ${getWaitColor(report.avgWaitMinutes)}`}>
                {report.avgWaitMinutes.toFixed(1)}
                <span className="text-base font-normal ml-1">min</span>
              </div>
            </div>

            {/* Longest Wait */}
            <div className={`rounded-xl border p-5 ${getWaitBg(report.longestWaitMinutes)} border-gray-200 dark:border-gray-700`}>
              <div className="text-sm text-gray-500 dark:text-gray-400">Longest Wait</div>
              <div className={`text-3xl font-bold mt-2 ${getWaitColor(report.longestWaitMinutes)}`}>
                {report.longestWaitMinutes.toFixed(1)}
                <span className="text-base font-normal ml-1">min</span>
              </div>
            </div>

            {/* No-Show Rate */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="text-sm text-gray-500 dark:text-gray-400">No-Show Rate</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {report.noShowRate.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {report.noShowCount} / {report.totalScheduled} scheduled
              </div>
            </div>
          </div>

          {/* No-Show Progress Bar */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                No-Show Rate
              </span>
              <span className="text-sm text-gray-500">{report.noShowCount} no-shows</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div
                className={`rounded-full h-2.5 transition-all ${
                  report.noShowRate > 15 ? "bg-red-500" : report.noShowRate > 5 ? "bg-yellow-500" : "bg-green-500"
                }`}
                style={{ width: `${Math.min(report.noShowRate, 100)}%` }}
              />
            </div>
          </div>

          {/* Metadata */}
          <div className="text-xs text-gray-400 dark:text-gray-500 flex flex-wrap gap-4">
            <span>Generated by: {report.generatedBy}</span>
            <span>Branch: {report.branch}</span>
            <span>Generated at: {report.generatedAt?.replace("T", " ")}</span>
          </div>

          {/* Doctor Performance Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">Performance by Doctor</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Doctor</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Room</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Served</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Waiting</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">
                      Avg Wait
                      <span className="text-xs font-normal ml-1">(min)</span>
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">
                      Longest
                      <span className="text-xs font-normal ml-1">(min)</span>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Peak Hour</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {(!report.byDoctor || report.byDoctor.length === 0) && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                        No queue data available for today.
                      </td>
                    </tr>
                  )}
                  {report.byDoctor?.map((doc) => (
                    <tr key={doc.doctorId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {doc.doctorName}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {doc.room || "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-bold text-sm">
                          {doc.patientsServed}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {doc.patientsWaiting > 0 ? (
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 font-bold text-sm">
                            {doc.patientsWaiting}
                          </span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>
                      <td className={`px-4 py-3 text-center font-medium ${getWaitColor(doc.avgWaitMinutes)}`}>
                        {doc.avgWaitMinutes.toFixed(1)}
                      </td>
                      <td className={`px-4 py-3 text-center font-medium ${getWaitColor(doc.longestWaitMinutes)}`}>
                        {doc.longestWaitMinutes.toFixed(1)}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300 text-xs">
                        {doc.peakHour}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {report.byDoctor && report.byDoctor.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400">
                {report.byDoctor.length} doctors with queue activity today
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
