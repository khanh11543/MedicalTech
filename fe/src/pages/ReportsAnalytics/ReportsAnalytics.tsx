import React, { useEffect, useState, useCallback } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { reportsAnalyticsAPI, ReportsAnalytics } from "../../services/complianceService";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Pie, Doughnut } from "react-chartjs-2";
import {
  ChartBarSquareIcon,
  ArrowTrendingUpIcon,
  CreditCardIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import RevenueSummaryCards from "../RevenueReports/components/RevenueSummaryCards";
import RevenueLineChart from "../RevenueReports/components/RevenueLineChart";
import MethodPieChart from "../RevenueReports/components/MethodPieChart";
import DoctorRevenueChart from "../RevenueReports/components/DoctorRevenueChart";
import AppointmentTypeChart from "../RevenueReports/components/AppointmentTypeChart";
import RefundAnalysis from "../RevenueReports/components/RefundAnalysis";
import * as revenueService from "../../services/revenueService";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Filler, Title, Tooltip, Legend);

// ======================== Time Filter Types & Helpers ========================

type TimePreset = "this_day" | "last_day" | "this_month" | "last_month" | "this_quarter" | "last_quarter" | "this_year" | "custom";

interface DateRange {
  startDate: string; // yyyy-MM-dd
  endDate: string;
}

const PRESET_LABELS: Record<TimePreset, string> = {
  this_day: "Today",
  last_day: "Yesterday",
  this_month: "This Month",
  last_month: "Last Month",
  this_quarter: "This Quarter",
  last_quarter: "Last Quarter",
  this_year: "This Year",
  custom: "Custom Range",
};

const PRESET_ICONS: Record<TimePreset, React.ReactNode> = {
  this_day: null,
  last_day: null,
  this_month: null,
  last_month: null,
  this_quarter: null,
  last_quarter: null,
  this_year: null,
  custom: <CalendarDaysIcon className="w-5 h-5" />,
};

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function getQuarter(date: Date): number {
  return Math.floor(date.getMonth() / 3);
}

function computePresetRange(preset: TimePreset): DateRange {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth(); // 0-indexed

  switch (preset) {
    case "this_day":
      return {
        startDate: formatDate(now),
        endDate: formatDate(now),
      };
    case "last_day": {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      return {
        startDate: formatDate(yesterday),
        endDate: formatDate(yesterday),
      };
    }
    case "this_month":
      return {
        startDate: formatDate(new Date(y, m, 1)),
        endDate: formatDate(now),
      };
    case "last_month": {
      const first = new Date(y, m - 1, 1);
      const last = new Date(y, m, 0);
      return { startDate: formatDate(first), endDate: formatDate(last) };
    }
    case "this_quarter": {
      const q = getQuarter(now);
      const qStart = new Date(y, q * 3, 1);
      return { startDate: formatDate(qStart), endDate: formatDate(now) };
    }
    case "last_quarter": {
      const q = getQuarter(now);
      const lqStart = new Date(y, (q - 1) * 3, 1);
      const lqEnd = new Date(y, q * 3, 0);
      return { startDate: formatDate(lqStart), endDate: formatDate(lqEnd) };
    }
    case "this_year":
      return {
        startDate: formatDate(new Date(y, 0, 1)),
        endDate: formatDate(now),
      };
    case "custom":
      // custom handled separately
      return { startDate: "", endDate: "" };
  }
}

// ======================== Component ========================

export default function ReportsAnalyticsPage() {
  const [analytics, setAnalytics] = useState<ReportsAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "appointments" | "revenue" | "doctors">("overview");
  const [activeRevenueSection, setActiveRevenueSection] = useState<string>("overview");

  // Time filter state
  const [timePreset, setTimePreset] = useState<TimePreset>("this_month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [customError, setCustomError] = useState("");

  // Revenue specific state
  const [revenueSummary, setRevenueSummary] = useState<revenueService.RevenueSummaryDTO | undefined>();
  const [revenueDaily, setRevenueDaily] = useState<revenueService.DailyRevenueComparisonDTO | undefined>();
  const [methodData, setMethodData] = useState<revenueService.MethodRevenueDTO[] | undefined>();
  const [doctorData, setDoctorData] = useState<revenueService.DoctorRevenueDTO[] | undefined>();
  const [apptTypeData, setApptTypeData] = useState<revenueService.AppointmentTypeRevenueDTO[] | undefined>();
  const [refundData, setRefundData] = useState<revenueService.RefundAnalysisDTO | undefined>();
  const [includePrepay, setIncludePrepay] = useState(false);
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [loadingRevenue, setLoadingRevenue] = useState(false);

  // Fetch Revenue data independently
  useEffect(() => {
    let range: DateRange;
    if (timePreset === "custom") {
      if (!customStartDate || !customEndDate) return;
      range = { startDate: customStartDate, endDate: customEndDate };
    } else {
      range = computePresetRange(timePreset);
    }

    if (!range.startDate || !range.endDate) return;

    const fetchRevenue = async () => {
      try {
        setLoadingRevenue(true);
        const [summary, daily, methods, doctors, apptTypes, refunds] = await Promise.all([
          revenueService.getRevenueSummary(range.startDate, range.endDate).catch((err) => { console.error(err); return undefined; }),
          revenueService.getDailyRevenue(range.startDate, range.endDate, compareEnabled).catch((err) => { console.error(err); return undefined; }),
          revenueService.getRevenueByMethod(range.startDate, range.endDate).catch((err) => { console.error(err); return undefined; }),
          revenueService.getRevenueByDoctor(range.startDate, range.endDate, 10).catch((err) => { console.error(err); return undefined; }),
          revenueService.getRevenueByAppointmentType(range.startDate, range.endDate, includePrepay).catch((err) => { console.error(err); return undefined; }),
          revenueService.getRefundAnalysis(range.startDate, range.endDate).catch((err) => { console.error(err); return undefined; }),
        ]);
        if (summary) setRevenueSummary(summary);
        if (daily) setRevenueDaily(daily);
        if (methods) setMethodData(methods);
        if (doctors) setDoctorData(doctors);
        if (apptTypes) setApptTypeData(apptTypes);
        if (refunds) setRefundData(refunds);
      } catch (err) {
        console.error("Failed to fetch revenue stats", err);
      } finally {
        setLoadingRevenue(false);
      }
    };

    fetchRevenue();
  }, [timePreset, customStartDate, customEndDate, compareEnabled, includePrepay]);

  const loadAnalytics = useCallback(async (range: DateRange) => {
    if (!range.startDate || !range.endDate) return;
    try {
      setLoading(true);
      const response = await reportsAnalyticsAPI.getAnalytics({
        startDate: range.startDate,
        endDate: range.endDate,
      });
      setAnalytics(response.data);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount with default preset
  useEffect(() => {
    const range = computePresetRange("this_month");
    loadAnalytics(range);
  }, [loadAnalytics]);

  // Handle preset change
  const handlePresetChange = (preset: TimePreset) => {
    setTimePreset(preset);
    setCustomError("");
    if (preset !== "custom") {
      setCustomStartDate("");
      setCustomEndDate("");
      const range = computePresetRange(preset);
      loadAnalytics(range);
    }
  };

  // Handle custom date change
  const handleCustomDateChange = (field: "start" | "end", value: string) => {
    let newStart = field === "start" ? value : customStartDate;
    let newEnd = field === "end" ? value : customEndDate;

    if (field === "start") setCustomStartDate(value);
    else setCustomEndDate(value);

    setCustomError("");

    if (newStart && newEnd) {
      if (newStart > newEnd) {
        setCustomError("Start date must be before or equal to end date");
        return;
      }
      loadAnalytics({ startDate: newStart, endDate: newEnd });
    }
  };

  // Current active range for display
  const getActiveRangeLabel = (): string => {
    if (timePreset === "custom") {
      if (customStartDate && customEndDate) return `${customStartDate} → ${customEndDate}`;
      return "Select date range";
    }
    const range = computePresetRange(timePreset);
    return `${range.startDate} → ${range.endDate}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // ======================== Render ========================

  return (
    <>
      <PageMeta
        title="Reports & Analytics | MediTech Admin"
        description="View reports and analytics in the MediTech system"
      />
      <PageBreadcrumb pageTitle="Reports & Analytics" />

      {/* ==================== TIME FILTER BAR ==================== */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-4">
        {/* Preset Buttons */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {(Object.keys(PRESET_LABELS) as TimePreset[]).map((preset) => (
            <button
              key={preset}
              onClick={() => handlePresetChange(preset)}
              className={`
                inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium
                transition-all duration-200 border
                ${timePreset === preset
                  ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/25"
                  : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700 dark:hover:border-gray-600"
                }
              `}
            >
              <span className="text-base">{PRESET_ICONS[preset]}</span>
              {PRESET_LABELS[preset]}
            </button>
          ))}
        </div>

        {/* Active Range Display + Custom Inputs */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="font-medium">{getActiveRangeLabel()}</span>
          </div>

          {/* Custom Range Inputs */}
          {timePreset === "custom" && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <input
                  id="custom-start-date"
                  type="date"
                  value={customStartDate}
                  onChange={(e) => handleCustomDateChange("start", e.target.value)}
                  className="pl-3 pr-10 py-1.5 rounded-lg border border-gray-300 text-sm bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all [&::-webkit-calendar-picker-indicator]:hidden"
                />
                <button
                  type="button"
                  onClick={() => (document.getElementById("custom-start-date") as HTMLInputElement)?.showPicker?.()}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  <CalendarDaysIcon className="w-5 h-5" />
                </button>
              </div>
              <span className="text-gray-400 dark:text-gray-500 text-sm font-medium">to</span>
              <div className="relative">
                <input
                  id="custom-end-date"
                  type="date"
                  value={customEndDate}
                  onChange={(e) => handleCustomDateChange("end", e.target.value)}
                  className="pl-3 pr-10 py-1.5 rounded-lg border border-gray-300 text-sm bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all [&::-webkit-calendar-picker-indicator]:hidden"
                />
                <button
                  type="button"
                  onClick={() => (document.getElementById("custom-end-date") as HTMLInputElement)?.showPicker?.()}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  <CalendarDaysIcon className="w-5 h-5" />
                </button>
              </div>
              {customError && (
                <span className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {customError}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ==================== LOADING STATE ==================== */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">Loading analytics data...</p>
          </div>
        </div>
      )}

      {/* ==================== ERROR STATE ==================== */}
      {!loading && !analytics && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Failed to load analytics data.</p>
        </div>
      )}

      {/* ==================== DATA CONTENT ==================== */}
      {!loading && analytics && (
        <>
          {/* Overview Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.totalUsers}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">All-time</p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Appointments</p>
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.totalAppointments}</p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Payments</p>
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.totalPayments}</p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                  <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(analytics.totalRevenue)}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200 dark:border-gray-800">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("overview")}
                className={`${activeTab === "overview"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("appointments")}
                className={`${activeTab === "appointments"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Appointments
              </button>
              <button
                onClick={() => setActiveTab("revenue")}
                className={`${activeTab === "revenue"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Revenue
              </button>
              <button
                onClick={() => setActiveTab("doctors")}
                className={`${activeTab === "doctors"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Top Doctors
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bar Chart - Appointments by Status */}
              <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Appointments by Status</h3>
                <Bar
                  data={{
                    labels: Object.keys(analytics.appointmentsByStatus),
                    datasets: [{
                      label: "Appointments",
                      data: Object.values(analytics.appointmentsByStatus),
                      backgroundColor: ["rgba(234,179,8,0.7)", "rgba(34,197,94,0.7)", "rgba(239,68,68,0.7)", "rgba(59,130,246,0.7)", "rgba(168,85,247,0.7)"],
                      borderRadius: 8,
                    }],
                  }}
                  options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }}
                />
              </div>

              {/* Pie Chart - Revenue by Payment Method */}
              <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue by Payment Method</h3>
                <Pie
                  data={{
                    labels: Object.keys(analytics.revenueByPaymentMethod),
                    datasets: [{
                      data: Object.values(analytics.revenueByPaymentMethod),
                      backgroundColor: ["rgba(59,130,246,0.8)", "rgba(34,197,94,0.8)", "rgba(168,85,247,0.8)", "rgba(234,179,8,0.8)"],
                      borderWidth: 2,
                      borderColor: "#fff",
                    }],
                  }}
                  options={{
                    responsive: true,
                    layout: { padding: 20 },
                    plugins: { legend: { position: "bottom" } },
                  }}
                />
              </div>

              {/* Bar Chart - Users by Role */}
              <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Users by Role</h3>
                <Bar
                  data={{
                    labels: Object.keys(analytics.usersByRole),
                    datasets: [{
                      label: "Users",
                      data: Object.values(analytics.usersByRole),
                      backgroundColor: ["rgba(59,130,246,0.7)", "rgba(34,197,94,0.7)", "rgba(6,182,212,0.7)", "rgba(234,179,8,0.7)"],
                      borderRadius: 8,
                    }],
                  }}
                  options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }}
                />
              </div>

              {/* Doughnut Chart - Top Specialties */}
              <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Specialties</h3>
                {analytics.specialtyStatistics.length > 0 ? (
                  <Doughnut
                    data={{
                      labels: analytics.specialtyStatistics.slice(0, 6).map((s) => s.specialtyName),
                      datasets: [
                        {
                          data: analytics.specialtyStatistics.slice(0, 6).map((s) => s.appointmentCount),
                          backgroundColor: [
                            "rgba(59,130,246,0.8)",
                            "rgba(34,197,94,0.8)",
                            "rgba(234,179,8,0.8)",
                            "rgba(168,85,247,0.8)",
                            "rgba(239,68,68,0.8)",
                            "rgba(6,182,212,0.8)",
                          ],
                          borderWidth: 2,
                          borderColor: "#fff",
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      layout: { padding: 20 },
                      cutout: "55%",
                      plugins: {
                        legend: {
                          position: "bottom",
                          onClick: () => { },
                        },

                        tooltip: {
                          callbacks: {
                            label: (ctx) => {
                              const data = (ctx.dataset.data || []) as number[];
                              const total = data.reduce((a, b) => a + Number(b ?? 0), 0);
                              const raw = Number(ctx.raw ?? 0);
                              const pct = total ? ((raw / total) * 100).toFixed(1) : "0.0";
                              return `${ctx.label}: ${raw} (${pct}%)`;
                            },
                          },
                        },
                      },
                    }}
                  />
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">No specialty data</p>
                )}
              </div>
            </div>
          )}

          {activeTab === "appointments" && (
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Appointments by Specialty</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Specialty
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Appointments
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {Object.entries(analytics.appointmentsBySpecialty).map(([specialty, count]) => (
                      <tr key={specialty}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {specialty}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900 dark:text-white">
                          {count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "revenue" && (
            <div className="space-y-6">
              {/* Revenue Section Nav */}
              <div className="flex flex-wrap gap-1">
                {[
                  { id: 'overview', label: 'Overview', icon: <ChartBarSquareIcon className="h-4 w-4" /> },
                  { id: 'daily', label: 'Daily Revenue', icon: <ArrowTrendingUpIcon className="h-4 w-4" /> },
                  { id: 'methods', label: 'Payment Methods', icon: <CreditCardIcon className="h-4 w-4" /> },
                  { id: 'doctors', label: 'By Doctor', icon: <UserGroupIcon className="h-4 w-4" /> },
                  { id: 'appointments', label: 'Appointment Types', icon: <ClipboardDocumentListIcon className="h-4 w-4" /> },
                  { id: 'refunds', label: 'Refund Analysis', icon: <ArrowPathIcon className="h-4 w-4" /> },
                ].map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => setActiveRevenueSection(sec.id)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      activeRevenueSection === sec.id
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {sec.icon}
                      {sec.label}
                    </span>
                  </button>
                ))}
              </div>

              <RevenueSummaryCards data={revenueSummary} isLoading={loadingRevenue} />
              
              {(activeRevenueSection === 'overview' || activeRevenueSection === 'daily') && (
                <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Daily Revenue Trend</h3>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={compareEnabled}
                        onChange={(e) => setCompareEnabled(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-gray-600 dark:text-gray-400">Compare with previous period</span>
                    </label>
                  </div>
                  <RevenueLineChart data={revenueDaily} isLoading={loadingRevenue} onDayClick={() => {}} />
                </div>
              )}

              {(activeRevenueSection === 'overview' || activeRevenueSection === 'methods') && (
                <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue by Payment Method</h3>
                  <MethodPieChart data={methodData} isLoading={loadingRevenue} onMethodClick={() => {}} />
                </div>
              )}

              {(activeRevenueSection === 'overview' || activeRevenueSection === 'doctors') && (
                <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue by Doctor</h3>
                  <DoctorRevenueChart data={doctorData} isLoading={loadingRevenue} onDoctorClick={() => {}} />
                </div>
              )}

              {(activeRevenueSection === 'overview' || activeRevenueSection === 'appointments') && (
                <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue by Appointment Type</h3>
                  <AppointmentTypeChart
                    data={apptTypeData}
                    isLoading={loadingRevenue}
                    includePrepay={includePrepay}
                    onIncludePrepayChange={setIncludePrepay}
                    onTypeClick={() => {}}
                  />
                </div>
              )}

              {(activeRevenueSection === 'overview' || activeRevenueSection === 'refunds') && (
                <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Refund Impact Analysis</h3>
                  <RefundAnalysis data={refundData} isLoading={loadingRevenue} />
                </div>
              )}
            </div>
          )}

          {activeTab === "doctors" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Doctors by Appointments */}
              <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Doctors by Appointments</h3>
                <div className="space-y-3">
                  {analytics.topDoctorsByAppointments.map((doctor, index) => (
                    <div key={doctor.doctorId} className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">#{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{doctor.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{doctor.specialty}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">{doctor.appointmentCount}</p>
                        <p className="text-xs text-gray-500">appointments</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Doctors by Rating */}
              <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Doctors by Rating</h3>
                <div className="space-y-3">
                  {analytics.topDoctorsByRating.map((doctor, index) => (
                    <div key={doctor.doctorId} className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">#{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{doctor.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{doctor.specialty}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="font-semibold text-gray-900 dark:text-white">{doctor.averageRating.toFixed(1)}</span>
                        </div>
                        <p className="text-xs text-gray-500">{doctor.appointmentCount} appts</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
