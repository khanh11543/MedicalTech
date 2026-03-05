import { useState, useCallback, useEffect } from "react";
import receptionistService from "../../../services/receptionistService";
import type { HourlyRevenueDTO, EndOfDayReportDTO } from "../../../services/receptionistService";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";

// ==================== HELPERS ====================

interface StatsData {
  totalRevenue: number;
  totalTransactions: number;
  cashRevenue: number;
  cashTransactions: number;
  momoRevenue: number;
  momoTransactions: number;
  pendingCount: number;
  pendingAmount: number;
}

const formatCurrency = (amount: number | undefined | null) => {
  if (!amount) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
};

const formatShortCurrency = (amount: number) => {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return amount.toString();
};

export default function TodayRevenue() {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [hourlyData, setHourlyData] = useState<HourlyRevenueDTO | null>(null);
  const [eodReport, setEodReport] = useState<EndOfDayReportDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const isToday = selectedDate === new Date().toISOString().split("T")[0];

  // ==================== FETCH ====================

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Use Promise.allSettled so partial failures don't kill everything
      const [statsResult, hourlyResult, eodResult] = await Promise.allSettled([
        receptionistService.getPaymentStatistics(selectedDate, selectedDate),
        receptionistService.getHourlyRevenue(selectedDate),
        receptionistService.getEndOfDayReport(selectedDate),
      ]);

      if (statsResult.status === "fulfilled") {
        const statsRes = statsResult.value;
        setStats({
          totalRevenue: statsRes?.totalRevenue || 0,
          totalTransactions: statsRes?.totalTransactions || 0,
          cashRevenue: statsRes?.cashRevenue || 0,
          cashTransactions: statsRes?.cashTransactions || 0,
          momoRevenue: statsRes?.momoRevenue || 0,
          momoTransactions: statsRes?.momoTransactions || 0,
          pendingCount: statsRes?.pendingCount || 0,
          pendingAmount: statsRes?.pendingAmount || 0,
        });
      } else {
        console.error("Failed to fetch payment statistics:", statsResult.reason);
      }

      if (hourlyResult.status === "fulfilled") {
        setHourlyData(hourlyResult.value);
      } else {
        console.error("Failed to fetch hourly revenue:", hourlyResult.reason);
      }

      if (eodResult.status === "fulfilled") {
        setEodReport(eodResult.value);
      } else {
        console.error("Failed to fetch end-of-day report:", eodResult.reason);
      }
    } catch (error) {
      console.error("Failed to fetch revenue data:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ==================== CHART CONFIG ====================

  const chartOptions: ApexOptions = {
    chart: {
      type: "bar",
      toolbar: { show: false },
      fontFamily: "inherit",
    },
    plotOptions: {
      bar: {
        columnWidth: "60%",
        borderRadius: 4,
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: hourlyData?.hourlyData?.map((h) => h.label) || [],
      labels: {
        style: { fontSize: "11px" },
        rotate: -45,
      },
    },
    yaxis: {
      labels: {
        formatter: (val: number) => formatShortCurrency(val),
        style: { fontSize: "11px" },
      },
    },
    colors: ["#22c55e", "#ec4899"],
    legend: {
      position: "top",
      horizontalAlign: "right",
      fontSize: "12px",
    },
    tooltip: {
      y: {
        formatter: (val: number) => formatCurrency(val),
      },
    },
    grid: {
      borderColor: "#e5e7eb",
      strokeDashArray: 3,
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          plotOptions: {
            bar: { columnWidth: "80%" },
          },
          xaxis: {
            labels: { rotate: -90, style: { fontSize: "9px" } },
          },
        },
      },
    ],
  };

  const chartSeries = [
    {
      name: "Cash",
      data: hourlyData?.hourlyData?.map((h) => h.cashAmount) || [],
    },
    {
      name: "MoMo",
      data: hourlyData?.hourlyData?.map((h) => h.momoAmount) || [],
    },
  ];

  // ==================== EXPORT ====================

  const handleExport = async (format: "EXCEL" | "TEXT") => {
    setExporting(true);
    try {
      const blob = await receptionistService.exportEndOfDayReport(selectedDate, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `revenue-report-${selectedDate}.${format === "EXCEL" ? "xlsx" : "txt"}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  // ==================== RENDER ====================

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Picker & Refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
          />
          {isToday && (
            <span className="px-2.5 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
              Today
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData()}
            className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Refresh
          </button>
          <div className="relative group">
            <button
              disabled={exporting}
              className="px-4 py-2 text-sm bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors font-medium"
            >
              Export
            </button>
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg py-1 hidden group-hover:block z-10 min-w-[140px]">
              <button
                onClick={() => handleExport("EXCEL")}
                className="block w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Excel (.xlsx)
              </button>
              <button
                onClick={() => handleExport("TEXT")}
                className="block w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Text (.txt)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Revenue */}
          <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl p-5 text-white">
            <p className="text-white/80 text-sm font-medium">Total Revenue</p>
            <p className="text-3xl font-bold mt-1">{formatCurrency(stats.totalRevenue)}</p>
            <p className="text-white/70 text-xs mt-2">{stats.totalTransactions} transactions</p>
          </div>

          {/* Cash */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Cash</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{formatCurrency(stats.cashRevenue)}</p>
            <p className="text-xs text-gray-400 mt-1">{stats.cashTransactions} transactions</p>
          </div>

          {/* MoMo */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-pink-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">MoMo</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{formatCurrency(stats.momoRevenue)}</p>
            <p className="text-xs text-gray-400 mt-1">{stats.momoTransactions} transactions</p>
          </div>

          {/* Pending */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-orange-200 dark:border-orange-800 p-5">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-sm font-medium text-orange-500">Pending</p>
            </div>
            <p className="text-2xl font-bold text-orange-600 mt-2">{formatCurrency(stats.pendingAmount)}</p>
            <p className="text-xs text-gray-400 mt-1">{stats.pendingCount} awaiting payment</p>
          </div>
        </div>
      )}

      {/* Hourly Revenue Chart */}
      {hourlyData && hourlyData.hourlyData && hourlyData.hourlyData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Hourly Revenue Breakdown</h3>
          <Chart
            options={chartOptions}
            series={chartSeries}
            type="bar"
            height={350}
          />
        </div>
      )}

      {/* Recent Transactions (from EOD report) */}
      {eodReport && eodReport.transactions && eodReport.transactions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Transactions</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {eodReport.transactions.length} transactions for {selectedDate}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Transaction</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Appointment</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Time</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Method</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Collected By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {eodReport.transactions.map((t, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 font-mono text-brand-500 text-xs">{t.transactionCode}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-xs">{t.appointmentCode}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-xs">
                      {t.paidTime ? new Date(t.paidTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{formatCurrency(t.amount)}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-xs">
                      {t.paymentMethod === "CASH" ? "Cash" : "MoMo"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-xs">{t.collectedBy || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EOD Summary */}
      {eodReport && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">End-of-Day Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Report Date</span>
                <span className="font-medium text-gray-900 dark:text-white">{eodReport.reportDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Generated By</span>
                <span className="text-gray-900 dark:text-white">{eodReport.generatedBy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Generated At</span>
                <span className="text-gray-900 dark:text-white">
                  {eodReport.generatedAt ? new Date(eodReport.generatedAt).toLocaleString("vi-VN") : "—"}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Total Revenue</span>
                <span className="font-bold text-brand-500">{formatCurrency(eodReport.totalRevenue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Cash Total</span>
                <span className="text-gray-900 dark:text-white">{formatCurrency(eodReport.cashTotal)} ({eodReport.cashTransactions})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">MoMo Total</span>
                <span className="text-gray-900 dark:text-white">{formatCurrency(eodReport.momoTotal)} ({eodReport.momoTransactions})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Pending</span>
                <span className="text-orange-600">{formatCurrency(eodReport.pendingAmount)} ({eodReport.pendingCount})</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
