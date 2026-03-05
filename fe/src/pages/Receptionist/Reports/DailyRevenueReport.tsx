import { useState, useCallback, useEffect } from "react";
import receptionistService from "../../../services/receptionistService";
import type { DailyRevenueReportDTO } from "../../../services/receptionistService";

// ==================== HELPERS ====================

const formatCurrency = (amount: number | undefined | null) => {
  if (!amount && amount !== 0) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

const PAYMENT_METHOD_ICON: Record<string, string> = {
  CASH: "Cash",
  MOMO: "MoMo",
};

export default function DailyRevenueReport() {
  const [selectedDate, setSelectedDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [report, setReport] = useState<DailyRevenueReportDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPending, setShowPending] = useState(false);

  // ==================== FETCH ====================

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await receptionistService.getDailyRevenueReport(selectedDate);
      setReport(data);
    } catch (err: unknown) {
      console.error("Failed to fetch revenue report:", err);
      setError("Failed to load report. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // ==================== EXPORT ====================

  const handleExport = async (format: "PDF" | "EXCEL" | "CSV") => {
    setExporting(true);
    try {
      const blob = await receptionistService.exportDailyRevenue(format, selectedDate);
      const ext = format === "EXCEL" ? "xlsx" : format.toLowerCase();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `daily_revenue_${selectedDate}.${ext}`;
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

  // ==================== END-OF-DAY ====================

  const handleEndOfDay = async () => {
    if (!confirm("Generate End-of-Day report? This will export the full daily summary as PDF.")) return;
    setExporting(true);
    try {
      const blob = await receptionistService.exportDailyRevenue("PDF", selectedDate);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `end_of_day_${selectedDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert("Failed to generate End-of-Day report.");
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  // ==================== RENDER ====================

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
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

          {/* Export buttons */}
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
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Revenue */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-lg">
              <div className="text-sm opacity-80">Total Revenue</div>
              <div className="text-2xl font-bold mt-1">{formatCurrency(report.totalRevenue)}</div>
              <div className="text-xs opacity-70 mt-2">
                {(report.cashTransactions || 0) + (report.momoTransactions || 0)} transactions
              </div>
            </div>

            {/* Cash */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg> Cash
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(report.cashTotal)}
              </div>
              <div className="text-xs text-gray-400 mt-2">
                {report.cashTransactions} transactions
              </div>
            </div>

            {/* MoMo */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <svg className="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg> MoMo
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(report.momoTotal)}
              </div>
              <div className="text-xs text-gray-400 mt-2">
                {report.momoTransactions} transactions
              </div>
            </div>

            {/* Pending */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-yellow-300 dark:border-yellow-700 p-5">
              <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Pending
              </div>
              <div className="text-xl font-bold text-yellow-700 dark:text-yellow-400 mt-1">
                {report.pendingPaymentsCount}
              </div>
              <div className="text-xs text-yellow-500 mt-2">
                {formatCurrency(report.pendingPaymentsAmount)}
              </div>
            </div>
          </div>

          {/* Cash Drawer */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Cash Drawer Expected Balance</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(report.cashDrawerExpectedBalance)}
              </div>
            </div>
            <button
              onClick={handleEndOfDay}
              disabled={exporting}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Generate End-of-Day Report
            </button>
          </div>

          {/* Metadata */}
          <div className="text-xs text-gray-400 dark:text-gray-500 flex flex-wrap gap-4">
            <span>Generated by: {report.generatedBy}</span>
            <span>Branch: {report.branch}</span>
            <span>Generated at: {report.generatedAt?.replace("T", " ")}</span>
          </div>

          {/* Transaction Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">Transactions</h3>
              <span className="text-xs text-gray-400">{report.transactions?.length || 0} records</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">#</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Code</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Time</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Appointment</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Patient</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Amount</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Method</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Collected By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {(!report.transactions || report.transactions.length === 0) && (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                        No transactions for this date.
                      </td>
                    </tr>
                  )}
                  {report.transactions?.map((tx, idx) => (
                    <tr key={tx.transactionCode} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-700 dark:text-gray-300">
                        {tx.transactionCode}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {tx.paidTime ? tx.paidTime.substring(0, 5) : "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">
                        {tx.appointmentCode || "—"}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {tx.patientName}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 text-xs">
                          {PAYMENT_METHOD_ICON[tx.paymentMethod] || tx.paymentMethod}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{tx.collectedBy || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pending Payments */}
          {report.pendingPayments && report.pendingPayments.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-yellow-200 dark:border-yellow-800 overflow-hidden">
              <button
                onClick={() => setShowPending(!showPending)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-yellow-50 dark:hover:bg-yellow-900/10"
              >
                <h3 className="font-semibold text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Pending Payments ({report.pendingPayments.length})
                </h3>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${showPending ? "rotate-180" : ""}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showPending && (
                <div className="overflow-x-auto border-t border-yellow-200 dark:border-yellow-800">
                  <table className="w-full text-sm">
                    <thead className="bg-yellow-50 dark:bg-yellow-900/20">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-yellow-700 dark:text-yellow-400">Code</th>
                        <th className="px-4 py-3 text-left font-medium text-yellow-700 dark:text-yellow-400">Appointment</th>
                        <th className="px-4 py-3 text-left font-medium text-yellow-700 dark:text-yellow-400">Patient</th>
                        <th className="px-4 py-3 text-left font-medium text-yellow-700 dark:text-yellow-400">Phone</th>
                        <th className="px-4 py-3 text-right font-medium text-yellow-700 dark:text-yellow-400">Amount</th>
                        <th className="px-4 py-3 text-left font-medium text-yellow-700 dark:text-yellow-400">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-yellow-100 dark:divide-yellow-900/30">
                      {report.pendingPayments.map((p) => (
                        <tr key={p.paymentCode} className="hover:bg-yellow-50 dark:hover:bg-yellow-900/10">
                          <td className="px-4 py-3 font-mono text-xs text-gray-700 dark:text-gray-300">{p.paymentCode}</td>
                          <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.appointmentCode}</td>
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{p.patientName}</td>
                          <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.maskedPhone}</td>
                          <td className="px-4 py-3 text-right font-medium text-yellow-700 dark:text-yellow-400">
                            {formatCurrency(p.amount)}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {p.createdAt?.replace("T", " ").substring(0, 16)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
