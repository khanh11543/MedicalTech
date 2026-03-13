import { useState, useEffect, useCallback } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Label from "../../components/form/Label";
import { useWorkstation } from "../../context/WorkstationContext";
import { maskEmail } from "../../utils/privacyMask";
import appointmentService, {
  StatisticsFilterDTO,
  AppointmentOverTimeDTO,
  AppointmentByStatusDTO,
  AppointmentByDoctorDTO,
  PeakHoursDTO,
  CancellationAnalysisDTO,
  NoShowAnalysisDTO,
  WaitTimeAnalysisDTO,
  SummaryStatisticsDTO,
} from "../../services/appointmentService";

// =========== HELPER FUNCTIONS ===========
const formatNumber = (num: number) => {
  return new Intl.NumberFormat("vi-VN").format(num);
};

const formatPercentage = (value: number) => {
  return `${value.toFixed(1)}%`;
};

const formatMinutes = (minutes: number) => {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins}m`;
};

// Status colors
const STATUS_COLORS: Record<string, string> = {
  PENDING: "#F59E0B",
  CONFIRMED: "#3B82F6",
  CHECKED_IN: "#8B5CF6",
  IN_PROGRESS: "#EAB308",
  COMPLETED: "#10B981",
  CANCELLED: "#EF4444",
  NO_SHOW: "#6B7280",
  RESCHEDULED: "#06B6D4",
};

// =========== ICONS ===========
const CalendarIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const TrendUpIcon = () => (
  <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const TrendDownIcon = () => (
  <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
  </svg>
);

// =========== CARD COMPONENT ===========
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, trend, color }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <h3 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{value}</h3>
        {subtitle && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
        {trend && (
          <div className="mt-2 flex items-center gap-1">
            {trend.isPositive ? <TrendUpIcon /> : <TrendDownIcon />}
            <span className={`text-sm ${trend.isPositive ? "text-green-500" : "text-red-500"}`}>
              {trend.isPositive ? "+" : ""}{trend.value}%
            </span>
            <span className="text-xs text-gray-500">vs last period</span>
          </div>
        )}
      </div>
      <div className={`flex h-12 w-12 items-center justify-center rounded-full ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);

// =========== CHART CARD COMPONENT ===========
interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, subtitle, children, actions, className = "" }) => (
  <div className={`rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800 ${className}`}>
    <div className="mb-4 flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
      </div>
      {actions}
    </div>
    {children}
  </div>
);

// =========== MAIN COMPONENT ===========
export default function AppointmentStatistics() {
  const { settings: wsSettings } = useWorkstation();
  const isDarkMode = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
  // Filter states - user edits this directly
  const defaultFilter: StatisticsFilterDTO = {
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    to: new Date().toISOString().split("T")[0],
    period: "DAILY",
  };
  const [filter, setFilter] = useState<StatisticsFilterDTO>(defaultFilter);
  // Applied filter - only updated when user clicks Apply/Refresh
  const [appliedFilter, setAppliedFilter] = useState<StatisticsFilterDTO>(defaultFilter);
  const [doctors, setDoctors] = useState<{ id: number; name: string }[]>([]);

  // Data states
  const [summary, setSummary] = useState<SummaryStatisticsDTO | null>(null);
  const [appointmentsOverTime, setAppointmentsOverTime] = useState<AppointmentOverTimeDTO[]>([]);
  const [appointmentsByStatus, setAppointmentsByStatus] = useState<AppointmentByStatusDTO[]>([]);
  const [appointmentsByDoctor, setAppointmentsByDoctor] = useState<AppointmentByDoctorDTO[]>([]);
  const [peakHours, setPeakHours] = useState<PeakHoursDTO[]>([]);
  const [cancellationAnalysis, setCancellationAnalysis] = useState<CancellationAnalysisDTO | null>(null);
  const [noShowAnalysis, setNoShowAnalysis] = useState<NoShowAnalysisDTO | null>(null);
  const [waitTimeAnalysis, setWaitTimeAnalysis] = useState<WaitTimeAnalysisDTO | null>(null);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Fetch doctors list from API
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const doctorsData = await appointmentService.getDoctors();
        setDoctors(doctorsData.map(d => ({ id: d.id, name: d.name })));
      } catch (error) {
        console.error("Failed to fetch doctors:", error);
        setDoctors([]);
      }
    };
    fetchDoctors();
  }, []);

  // Apply filters and fetch
  const handleApplyFilters = useCallback(() => {
    if (!filter.from || !filter.to) return; // Don't fetch with invalid dates
    setAppliedFilter({ ...filter });
  }, [filter]);

  // Fetch all statistics using appliedFilter
  const fetchStatistics = useCallback(async () => {
    if (!appliedFilter.from || !appliedFilter.to) return;
    setLoading(true);

    const results = await Promise.allSettled([
      appointmentService.getSummaryStatistics(appliedFilter),
      appointmentService.getAppointmentsOverTime(appliedFilter),
      appointmentService.getAppointmentsByStatus(appliedFilter),
      appointmentService.getAppointmentsByDoctor(appliedFilter),
      appointmentService.getPeakHoursAnalysis(appliedFilter),
      appointmentService.getCancellationAnalysis(appliedFilter),
      appointmentService.getNoShowAnalysis(appliedFilter),
      appointmentService.getAverageWaitTime(appliedFilter),
    ]);

    setSummary(results[0].status === "fulfilled" ? results[0].value : null);
    setAppointmentsOverTime(results[1].status === "fulfilled" ? results[1].value : []);
    setAppointmentsByStatus(results[2].status === "fulfilled" ? results[2].value : []);
    setAppointmentsByDoctor(results[3].status === "fulfilled" ? results[3].value : []);
    setPeakHours(results[4].status === "fulfilled" ? results[4].value : []);
    setCancellationAnalysis(results[5].status === "fulfilled" ? results[5].value : null);
    setNoShowAnalysis(results[6].status === "fulfilled" ? results[6].value : null);
    setWaitTimeAnalysis(results[7].status === "fulfilled" ? results[7].value : null);

    // Log any individual failures
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        console.error(`Statistics API call ${i} failed:`, r.reason);
      }
    });

    setLoading(false);
  }, [appliedFilter]);

  // Fetch when appliedFilter changes
  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  // Export to PDF
  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const blob = await appointmentService.exportStatisticsToPDF(appliedFilter);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `appointment_statistics_${appliedFilter.from}_${appliedFilter.to}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export:", error);
      alert("Export feature requires backend implementation");
    } finally {
      setExporting(false);
    }
  };

  // =========== CHART OPTIONS ===========
  // Line chart - Appointments over time
  const lineChartOptions: ApexOptions = {
    chart: {
      type: "area",
      height: 350,
      fontFamily: "Outfit, sans-serif",
      toolbar: { show: true },
      zoom: { enabled: true },
    },
    colors: ["#3B82F6", "#10B981", "#EF4444", "#6B7280"],
    stroke: { curve: "smooth", width: 2 },
    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.4,
        opacityTo: 0.1,
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: appointmentsOverTime.map((d) => d.label),
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { title: { text: "Appointments" } },
    legend: { position: "top", horizontalAlign: "left" },
    tooltip: { shared: true, intersect: false },
  };

  const lineChartSeries = [
    { name: "Total", data: appointmentsOverTime.map((d) => d.total) },
    { name: "Completed", data: appointmentsOverTime.map((d) => d.completed) },
    { name: "Cancelled", data: appointmentsOverTime.map((d) => d.cancelled) },
    { name: "No-Show", data: appointmentsOverTime.map((d) => d.noShow) },
  ];

  // Pie chart - Appointments by status
  const pieChartOptions: ApexOptions = {
    chart: {
      type: "donut",
      fontFamily: "Outfit, sans-serif",
      animations: { enabled: false },
      foreColor: isDarkMode ? "#E5E7EB" : "#111827",
    },
    colors: appointmentsByStatus.map((s) => STATUS_COLORS[s.status] || "#6B7280"),
    labels: appointmentsByStatus.map((s) => s.status),
    stroke: {
      show: true,
      width: 2,
      colors: ["#ffffff"],
    },
    legend: {
      position: "bottom",
      horizontalAlign: "center",
    },
    plotOptions: {
      pie: {
        donut: {
          size: "65%",
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: "14px",
              fontWeight: 600,
              color: isDarkMode ? "#D1D5DB" : "#374151",
            },
            value: {
              show: true,
              fontSize: "20px",
              fontWeight: 700,
              color: isDarkMode ? "#F9FAFB" : "#111827",
              formatter: (val: string) => formatNumber(Number(val)),
            },
            total: {
              show: true,
              label: "Total",
              fontSize: "14px",
              fontWeight: 600,
              color: isDarkMode ? "#D1D5DB" : "#374151",
              formatter: () => formatNumber(appointmentsByStatus.reduce((sum, s) => sum + s.count, 0)),
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`,
      style: {
        fontSize: "16px",
        fontWeight: "bold",
        colors: ["#FFFFFF"],
      },
      // Drop shadow makes labels look blurry on some displays/zoom levels
      dropShadow: { enabled: false },
    },
    tooltip: {
      y: {
        formatter: (val: number) => formatNumber(val),
      },
    },
  };

  const pieChartSeries = appointmentsByStatus.map((s) => s.count);

  // Bar chart - Appointments by doctor
  const barChartOptions: ApexOptions = {
    chart: {
      type: "bar",
      height: 350,
      fontFamily: "Outfit, sans-serif",
      toolbar: { show: false },
    },
    colors: ["#3B82F6", "#10B981", "#EF4444"],
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
        dataLabels: { position: "top" },
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: appointmentsByDoctor.slice(0, 10).map((d) => d.doctorName),
    },
    yaxis: { title: { text: undefined } },
    legend: { position: "top", horizontalAlign: "left" },
    tooltip: { shared: true, intersect: false },
  };

  const barChartSeries = [
    { name: "Total", data: appointmentsByDoctor.slice(0, 10).map((d) => d.total) },
    { name: "Completed", data: appointmentsByDoctor.slice(0, 10).map((d) => d.completed) },
    { name: "Cancelled", data: appointmentsByDoctor.slice(0, 10).map((d) => d.cancelled) },
  ];

  // Heatmap - Peak hours
  const heatmapOptions: ApexOptions = {
    chart: {
      type: "heatmap",
      height: 350,
      fontFamily: "Outfit, sans-serif",
      toolbar: { show: false },
    },
    dataLabels: { enabled: false },
    colors: ["#3B82F6"],
    xaxis: {
      categories: Array.from({ length: 10 }, (_, i) => `${i + 8}:00`),
      title: { text: "Hour of Day" },
    },
    yaxis: { title: { text: "Day of Week" } },
    tooltip: {
      y: {
        formatter: (val: number) => `${val} appointments`,
      },
    },
  };

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const heatmapSeries = dayNames.map((dayName, dayIndex) => ({
    name: dayName,
    data: Array.from({ length: 10 }, (_, hourOffset) => {
      const hour = hourOffset + 8;
      const found = peakHours.find((p) => p.dayOfWeek === dayIndex && p.hour === hour);
      return found?.count || 0;
    }),
  }));

  // Cancellation reasons pie chart
  const cancellationPieOptions: ApexOptions = {
    chart: {
      type: "pie",
      fontFamily: "Outfit, sans-serif",
    },
    colors: ["#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#6B7280"],
    labels: cancellationAnalysis?.reasons.map((r) => r.reason) || [],
    legend: { position: "bottom" },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`,
      style: {
        fontSize: "14px",
        fontWeight: "bold",
        colors: ["#FFFFFF"],
      },
      dropShadow: {
        enabled: true,
        top: 1,
        left: 1,
        blur: 2,
        color: "#000000",
        opacity: 0.6,
      },
    },
  };

  const cancellationPieSeries = cancellationAnalysis?.reasons.map((r) => r.count) || [];

  // Wait time by hour bar chart
  const waitTimeBarOptions: ApexOptions = {
    chart: {
      type: "bar",
      height: 300,
      fontFamily: "Outfit, sans-serif",
      toolbar: { show: false },
    },
    colors: ["#8B5CF6"],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "50%",
        borderRadius: 4,
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${Math.round(val)} min`,
      offsetY: -20,
      style: { fontSize: "10px", colors: ["#374151"] },
    },
    xaxis: {
      categories: waitTimeAnalysis?.byDoctor.map((d) => d.doctorName) || [],
    },
    yaxis: {
      title: { text: "Minutes" },
    },
  };

  const waitTimeBarSeries = [{
    name: "Avg Wait Time",
    data: waitTimeAnalysis?.byDoctor.map((d) => Math.round(d.averageWaitTime)) || [],
  }];

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <>
      <PageMeta title="Appointment Statistics | MedicalTech" description="Appointment statistics and analytics" />
      <PageBreadcrumb pageTitle="Appointment Statistics" />

      {/* Filters */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[150px]">
            <Label htmlFor="from">From Date</Label>
            <input
              id="from"
              type="date"
              value={filter.from || ""}
              onChange={(e) => setFilter({ ...filter, from: e.target.value })}
              className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm focus:border-brand-300 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            />
          </div>
          <div className="min-w-[150px]">
            <Label htmlFor="to">To Date</Label>
            <input
              id="to"
              type="date"
              value={filter.to || ""}
              onChange={(e) => setFilter({ ...filter, to: e.target.value })}
              className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm focus:border-brand-300 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            />
          </div>
          <div className="min-w-[200px]">
            <Label htmlFor="doctor">Doctor</Label>
            <select
              id="doctor"
              value={filter.doctorId || ""}
              onChange={(e) => setFilter({ ...filter, doctorId: e.target.value ? parseInt(e.target.value) : undefined })}
              className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm focus:border-brand-300 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            >
              <option value="">All Doctors</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[150px]">
            <Label htmlFor="period">Period</Label>
            <select
              id="period"
              value={filter.period || "DAILY"}
              onChange={(e) => setFilter({ ...filter, period: e.target.value as any })}
              className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm focus:border-brand-300 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            >
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </div>
          <button
            onClick={handleApplyFilters}
            className="flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600"
          >
            <RefreshIcon />
            Apply Filters
          </button>
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="flex h-10 items-center gap-2 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300"
          >
            <DownloadIcon />
            {exporting ? "Exporting..." : "Export PDF"}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Appointments"
            value={formatNumber(summary.totalAppointments)}
            subtitle={`${summary.pendingAppointments} pending`}
            icon={<CalendarIcon />}
            trend={summary.changePercentage ? { value: Math.abs(summary.changePercentage), isPositive: summary.changePercentage >= 0 } : undefined}
            color="bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
          />
          <StatCard
            title="Completion Rate"
            value={formatPercentage(summary.completionRate)}
            subtitle={`${formatNumber(summary.completedAppointments)} completed`}
            icon={<CheckIcon />}
            color="bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400"
          />
          <StatCard
            title="Cancellation Rate"
            value={formatPercentage(summary.cancellationRate)}
            subtitle={`${formatNumber(summary.cancelledAppointments)} cancelled`}
            icon={<XIcon />}
            color="bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400"
          />
          <StatCard
            title="No-Show Rate"
            value={formatPercentage(summary.noShowRate)}
            subtitle={`${formatNumber(summary.noShowAppointments)} no-shows`}
            icon={<ClockIcon />}
            color="bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400"
          />
        </div>
      )}

      {/* Period Comparison & Avg per Day */}
      {summary && (
        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-gradient-to-r from-blue-500 to-indigo-600 p-5 text-white dark:border-gray-700">
            <p className="text-sm opacity-80">Previous Period</p>
            <h3 className="mt-1 text-3xl font-bold">{formatNumber(summary.previousPeriodTotal || 0)}</h3>
            <p className="mt-2 text-sm opacity-80">
              Change: {summary.changePercentage != null ? `${summary.changePercentage > 0 ? "+" : ""}${summary.changePercentage.toFixed(1)}%` : "N/A"}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gradient-to-r from-green-500 to-emerald-600 p-5 text-white dark:border-gray-700">
            <p className="text-sm opacity-80">Avg Appointments / Day</p>
            <h3 className="mt-1 text-3xl font-bold">{(summary.averageAppointmentsPerDay || 0).toFixed(1)}</h3>
            <p className="mt-2 text-sm opacity-80">
              In selected period
            </p>
          </div>
          {appointmentsByDoctor.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">Top Performing Doctor</p>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900/50 dark:text-brand-400">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">{appointmentsByDoctor[0].doctorName}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{appointmentsByDoctor[0].doctorSpecialization}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">{appointmentsByDoctor[0].total} appointments</span>
                <span className="font-medium text-green-600">{formatPercentage(appointmentsByDoctor[0].completionRate)} completion</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Appointments Over Time */}
        <ChartCard
          title="Appointments Over Time"
          subtitle="Daily appointment trends"
          className="xl:col-span-2"
        >
          <Chart options={lineChartOptions} series={lineChartSeries} type="area" height={350} />
        </ChartCard>

        {/* Appointments by Status */}
        <ChartCard title="Appointments by Status" subtitle="Distribution breakdown">
          <Chart options={pieChartOptions} series={pieChartSeries} type="donut" height={350} />
        </ChartCard>

        {/* Appointments by Doctor */}
        <ChartCard title="Top 10 Doctors" subtitle="By total appointments">
          <Chart options={barChartOptions} series={barChartSeries} type="bar" height={350} />
        </ChartCard>

        {/* Peak Hours Heatmap */}
        <ChartCard
          title="Peak Hours Analysis"
          subtitle="Appointment density by day and hour"
          className="xl:col-span-2"
        >
          <Chart options={heatmapOptions} series={heatmapSeries} type="heatmap" height={350} />
        </ChartCard>

        {/* Cancellation Analysis */}
        {cancellationAnalysis && (
          <>
            <ChartCard title="Cancellation Reasons" subtitle={`Total: ${cancellationAnalysis.totalCancellations} cancellations`}>
              {cancellationAnalysis.reasons.length > 0 ? (
                <Chart options={cancellationPieOptions} series={cancellationPieSeries} type="pie" height={300} />
              ) : (
                <div className="flex h-[300px] items-center justify-center text-gray-500 dark:text-gray-400">
                  No cancellation data available
                </div>
              )}
            </ChartCard>

            <ChartCard title="Cancellation Details" subtitle="Breakdown by initiator">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Overall Rate</p>
                    <p className="text-xl font-bold text-red-500">{formatPercentage(cancellationAnalysis.cancellationRate)}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Cancellations</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{formatNumber(cancellationAnalysis.totalCancellations)}</p>
                  </div>
                </div>
                {cancellationAnalysis.trend.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Recent Trend</p>
                    {cancellationAnalysis.trend.slice(-5).map((t) => (
                      <div key={t.date} className="flex items-center justify-between border-b border-gray-100 py-2 dark:border-gray-700">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{t.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{t.total}</span>
                          <span className="text-xs text-red-500">({formatPercentage(t.rate)})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ChartCard>
          </>
        )}

        {/* No-Show Analysis */}
        {noShowAnalysis && (
          <>
            <ChartCard
              title="No-Show Rate"
              subtitle={`Overall: ${formatPercentage(noShowAnalysis.noShowRate)}`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <div className="relative h-32 w-32">
                    <svg className="h-32 w-32" viewBox="0 0 36 36">
                      <path
                        className="text-gray-200 dark:text-gray-700"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      />
                      <path
                        className="text-gray-500"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeDasharray={`${noShowAnalysis.noShowRate}, 100`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatPercentage(noShowAnalysis.noShowRate)}
                      </span>
                      <span className="text-xs text-gray-500">No-Show Rate</span>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {noShowAnalysis.totalNoShows} total no-shows in selected period
                  </p>
                </div>
              </div>
            </ChartCard>

            <ChartCard title="Repeat No-Show Patients" subtitle="Patients with multiple no-shows">
              {noShowAnalysis.repeatOffenders.length > 0 ? (
                <div className="space-y-3">
                  {noShowAnalysis.repeatOffenders.map((p) => (
                    <div key={p.patientId} className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{p.patientName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{wsSettings.hideEmail ? maskEmail(p.patientEmail) : p.patientEmail}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-500">{p.noShowCount}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">no-shows</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-[200px] items-center justify-center text-gray-500 dark:text-gray-400">
                  No repeat offenders found
                </div>
              )}
            </ChartCard>
          </>
        )}

        {/* Wait Time Analysis */}
        {waitTimeAnalysis && (
          <>
            <ChartCard
              title="Average Wait Time by Hour"
              subtitle={`Overall avg: ${formatMinutes(waitTimeAnalysis.overallAverageWaitTime)}`}
            >
              {waitTimeAnalysis.byDoctor.length > 0 ? (
                <Chart options={waitTimeBarOptions} series={waitTimeBarSeries} type="bar" height={300} />
              ) : (
                <div className="flex h-[300px] items-center justify-center text-gray-500 dark:text-gray-400">
                  No wait time data available
                </div>
              )}
            </ChartCard>

            <ChartCard title="Wait Time by Day of Week" subtitle="Comparison across days">
              {waitTimeAnalysis.byType.length > 0 ? (
                <div className="space-y-4">
                  {waitTimeAnalysis.byType.map((t) => (
                    <div key={t.appointmentType} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full bg-purple-500" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{t.appointmentType}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {t.appointmentCount} appointments
                        </span>
                        <span className="text-sm font-bold text-purple-600">
                          {formatMinutes(t.averageWaitTime)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-[200px] items-center justify-center text-gray-500 dark:text-gray-400">
                  No day-of-week data available
                </div>
              )}
            </ChartCard>
          </>
        )}
      </div>
    </>
  );
}
