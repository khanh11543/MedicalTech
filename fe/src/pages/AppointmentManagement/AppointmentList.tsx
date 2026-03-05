import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Badge from "../../components/ui/badge/Badge";
import { Modal } from "../../components/ui/modal";
import Label from "../../components/form/Label";
import DatePicker from "../../components/form/date-picker";
import appointmentService, {
  AppointmentDTO,
  AppointmentStatus,
  AppointmentType,
  PaymentStatus,
  AppointmentFilterDTO,
  DoctorOption,
  PatientOption,
  RescheduleDTO,
} from "../../services/appointmentService";

// =========== HELPER FUNCTIONS ===========
const getStatusBadgeColor = (status: AppointmentStatus) => {
  const colorMap: Record<AppointmentStatus, "warning" | "info" | "primary" | "error" | "success" | "light" | "dark"> = {
    [AppointmentStatus.PENDING]: "warning",
    [AppointmentStatus.CONFIRMED]: "info",
    [AppointmentStatus.CHECKED_IN]: "primary",
    [AppointmentStatus.IN_PROGRESS]: "warning",
    [AppointmentStatus.COMPLETED]: "success",
    [AppointmentStatus.CANCELLED]: "error",
    [AppointmentStatus.NO_SHOW]: "light",
    [AppointmentStatus.RESCHEDULED]: "info",
  };
  return colorMap[status] || "light";
};

const getPaymentBadgeColor = (status?: PaymentStatus) => {
  if (!status) return "light";
  const colorMap: Record<PaymentStatus, "success" | "warning" | "info"> = {
    [PaymentStatus.PAID]: "success",
    [PaymentStatus.PENDING]: "warning",
    [PaymentStatus.REFUNDED]: "info",
  };
  return colorMap[status];
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatTime = (timeStr: string) => {
  if (!timeStr) return "-";
  return timeStr.substring(0, 5); // HH:mm
};

const getQuickDateRange = (option: string): { from: string; to: string } => {
  const today = new Date();
  const from = new Date(today);
  const to = new Date(today);

  switch (option) {
    case "today":
      break;
    case "tomorrow":
      from.setDate(from.getDate() + 1);
      to.setDate(to.getDate() + 1);
      break;
    case "thisWeek":
      from.setDate(from.getDate() - from.getDay() + 1); // Monday
      to.setDate(from.getDate() + 6); // Sunday
      break;
    case "thisMonth":
      from.setDate(1);
      to.setMonth(to.getMonth() + 1);
      to.setDate(0);
      break;
    default:
      break;
  }

  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
};

// =========== STATS CARD COMPONENT ===========
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, trend, icon, color }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <h3 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{value}</h3>
        {subtitle && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
        {trend !== undefined && (
          <p className={`mt-1 text-xs ${trend >= 0 ? "text-green-500" : "text-red-500"}`}>
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}% vs last week
          </p>
        )}
      </div>
      <div className={`flex h-12 w-12 items-center justify-center rounded-full ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);

// =========== ICONS ===========
const CalendarIcon = () => (
  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ChartIcon = () => (
  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const CancelIcon = () => (
  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const UserXIcon = () => (
  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const SearchIcon = () => (
  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const FilterIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const BellIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

// =========== MAIN COMPONENT ===========
export default function AppointmentList() {
  const navigate = useNavigate();
  
  // State
  const [appointments, setAppointments] = useState<AppointmentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<AppointmentStatus[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<AppointmentType | null>(null);
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<PaymentStatus | null>(null);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  // Options for dropdowns
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [patients, setPatients] = useState<PatientOption[]>([]);

  // Selected items for bulk actions
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [bulkCancelModalOpen, setBulkCancelModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentDTO | null>(null);

  // Form states
  const [cancelReason, setCancelReason] = useState("");
  const [rescheduleData, setRescheduleData] = useState<RescheduleDTO>({
    newDate: "",
    newStartTime: "",
    newEndTime: "",
    reason: "",
  });

  // Stats
  const [stats, setStats] = useState({
    todayTotal: 0,
    todayByStatus: {} as Record<AppointmentStatus, number>,
    weekTotal: 0,
    weekTrend: 0,
    cancellationRate: 0,
    cancellationTrend: 0,
    noShowRate: 0,
  });

  // =========== FETCH DATA ===========
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const filter: AppointmentFilterDTO = {
        search: searchQuery || undefined,
        doctorId: selectedDoctor,
        patientId: selectedPatient,
        status: selectedStatuses.length === 1 ? selectedStatuses[0] : undefined,
        statuses: selectedStatuses.length > 1 ? selectedStatuses : undefined,
        from: dateFrom || undefined,
        to: dateTo || undefined,
        appointmentType: selectedType || undefined,
        paymentStatus: selectedPaymentStatus || undefined,
        pageNumber: currentPage,
        pageSize,
      };

      const response = await appointmentService.getAllAppointments(filter);
      setAppointments(response.content);
      setTotalElements(response.totalElements);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
      setAppointments([]);
      setTotalElements(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedStatuses, selectedDoctor, selectedPatient, selectedType, selectedPaymentStatus, dateFrom, dateTo, currentPage, pageSize]);

  const fetchDropdownOptions = useCallback(async () => {
    try {
      const [doctorsData, patientsData] = await Promise.all([
        appointmentService.getDoctors(),
        appointmentService.getPatients(),
      ]);
      setDoctors(doctorsData);
      setPatients(patientsData);
    } catch (error) {
      console.error("Failed to fetch dropdown options:", error);
      setDoctors([]);
      setPatients([]);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const statsData = await appointmentService.getAppointmentStats();
      
      // Map backend response to local state
      const todayByStatus = {
        [AppointmentStatus.PENDING]: statsData.todayPending || 0,
        [AppointmentStatus.CONFIRMED]: statsData.todayConfirmed || 0,
        [AppointmentStatus.CHECKED_IN]: statsData.todayCheckedIn || 0,
        [AppointmentStatus.COMPLETED]: statsData.todayCompleted || 0,
        [AppointmentStatus.CANCELLED]: statsData.todayCancelled || 0,
        [AppointmentStatus.NO_SHOW]: statsData.todayNoShow || 0,
        [AppointmentStatus.IN_PROGRESS]: 0,
        [AppointmentStatus.RESCHEDULED]: 0,
      } as Record<AppointmentStatus, number>;
      
      setStats({
        todayTotal: statsData.todayTotal || 0,
        todayByStatus,
        weekTotal: statsData.weekTotal || 0,
        weekTrend: statsData.weekOverWeekChange || 0,
        cancellationRate: Math.round((statsData.cancellationRate || 0) * 10) / 10,
        cancellationTrend: 0,
        noShowRate: Math.round((statsData.noShowRate || 0) * 10) / 10,
      });
    } catch {
      // Calculate stats from current appointments
      const today = new Date().toISOString().split("T")[0];
      const todayAppts = appointments.filter((a) => a.appointmentDate === today);
      const statusCounts = todayAppts.reduce((acc, a) => {
        acc[a.status] = (acc[a.status] || 0) + 1;
        return acc;
      }, {} as Record<AppointmentStatus, number>);

      const cancelled = appointments.filter((a) => a.status === AppointmentStatus.CANCELLED).length;
      const noShow = appointments.filter((a) => a.status === AppointmentStatus.NO_SHOW).length;

      setStats({
        todayTotal: todayAppts.length,
        todayByStatus: statusCounts,
        weekTotal: appointments.length,
        weekTrend: 0,
        cancellationRate: appointments.length > 0 ? Math.round((cancelled / appointments.length) * 100) : 0,
        cancellationTrend: 0,
        noShowRate: appointments.length > 0 ? Math.round((noShow / appointments.length) * 100) : 0,
      });
    }
  }, [appointments]);

  useEffect(() => {
    fetchAppointments();
    fetchDropdownOptions();
  }, [fetchAppointments, fetchDropdownOptions]);

  useEffect(() => {
    if (appointments.length > 0) {
      fetchStats();
    }
  }, [appointments, fetchStats]);

  // =========== HANDLERS ===========
  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedStatuses([]);
    setSelectedDoctor(null);
    setSelectedPatient(null);
    setSelectedType(null);
    setSelectedPaymentStatus(null);
    setDateFrom("");
    setDateTo("");
    setCurrentPage(0);
  };

  const handleQuickDateFilter = (option: string) => {
    const { from, to } = getQuickDateRange(option);
    setDateFrom(from);
    setDateTo(to);
  };

  const handleStatusToggle = (status: AppointmentStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
    } else {
      setSelectedIds(appointments.map((a) => a.id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleView = (appointment: AppointmentDTO) => {
    setSelectedAppointment(appointment);
    setViewModalOpen(true);
  };

  const handleViewDetail = (appointmentId: number) => {
    navigate(`/appointment-detail/${appointmentId}`);
  };

  const handleRescheduleClick = (appointment: AppointmentDTO) => {
    setSelectedAppointment(appointment);
    setRescheduleData({
      newDate: appointment.appointmentDate,
      newStartTime: appointment.startTime.substring(0, 5),
      newEndTime: appointment.endTime.substring(0, 5),
      reason: "",
    });
    setRescheduleModalOpen(true);
  };

  const handleCancelClick = (appointment: AppointmentDTO) => {
    setSelectedAppointment(appointment);
    setCancelReason("");
    setCancelModalOpen(true);
  };

  const handleRescheduleSubmit = async () => {
    if (!selectedAppointment) return;
    try {
      await appointmentService.rescheduleAppointment(selectedAppointment.id, rescheduleData);
      setRescheduleModalOpen(false);
      fetchAppointments();
    } catch (error) {
      console.error("Failed to reschedule:", error);
      alert("Failed to reschedule appointment");
    }
  };

  const handleCancelSubmit = async () => {
    if (!selectedAppointment) return;
    try {
      await appointmentService.cancelAppointment(selectedAppointment.id, { reason: cancelReason });
      setCancelModalOpen(false);
      fetchAppointments();
    } catch (error) {
      console.error("Failed to cancel:", error);
      alert("Failed to cancel appointment");
    }
  };

  const handleBulkCancel = async () => {
    try {
      await appointmentService.bulkCancel(selectedIds, cancelReason);
      setBulkCancelModalOpen(false);
      setSelectedIds([]);
      setSelectAll(false);
      fetchAppointments();
    } catch (error) {
      console.error("Failed to bulk cancel:", error);
      alert("Failed to cancel appointments");
    }
  };

  const handleExportExcel = async () => {
    try {
      const blob = await appointmentService.exportToExcel({
        doctorId: selectedDoctor,
        patientId: selectedPatient,
        from: dateFrom,
        to: dateTo,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `appointments_${new Date().toISOString().split("T")[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export:", error);
      alert("Export feature requires backend implementation");
    }
  };

  const handleSendReminder = async () => {
    const eligibleIds = selectedIds.filter((id) => {
      const appt = appointments.find((a) => a.id === id);
      return appt && [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED].includes(appt.status);
    });

    if (eligibleIds.length === 0) {
      alert("No eligible appointments selected (only PENDING/CONFIRMED)");
      return;
    }

    try {
      await appointmentService.sendReminder(eligibleIds);
      alert(`Reminder sent to ${eligibleIds.length} appointments`);
    } catch (error) {
      console.error("Failed to send reminder:", error);
      alert("Send reminder feature requires backend implementation");
    }
  };

  return (
    <>
      <PageMeta
        title="Appointment Management | MedicalTech Dashboard"
        description="Manage appointments in the MedicalTech system"
      />
      <PageBreadcrumb pageTitle="Appointment Management" />
      
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Today's Appointments"
            value={stats.todayTotal}
            subtitle={`${Object.entries(stats.todayByStatus).map(([k, v]) => `${k}: ${v}`).join(", ") || "No breakdown"}`}
            icon={<CalendarIcon />}
            color="bg-blue-500"
          />
          <StatCard
            title="This Week"
            value={stats.weekTotal}
            trend={stats.weekTrend}
            icon={<ChartIcon />}
            color="bg-green-500"
          />
          <StatCard
            title="Cancellation Rate"
            value={`${stats.cancellationRate}%`}
            trend={stats.cancellationTrend}
            icon={<CancelIcon />}
            color="bg-red-500"
          />
          <StatCard
            title="No-Show Rate"
            value={`${stats.noShowRate}%`}
            icon={<UserXIcon />}
            color="bg-gray-500"
          />
        </div>

        {/* Filters Section */}
        <ComponentCard title="Filters &amp; Search">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">
                  <SearchIcon />
                </span>
                <input
                  type="text"
                  placeholder="Search by Appointment Code, Patient Name/Email, Doctor Name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent pl-10 pr-4 text-sm focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <FilterIcon />
                {showFilters ? "Hide Filters" : "Show Filters"}
              </button>
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <RefreshIcon />
                Reset
              </button>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {/* Date Range */}
                <div>
                  <Label htmlFor="dateFrom">Date From</Label>
                  <DatePicker
                    id="dateFrom"
                    placeholder="Select start date"
                    defaultDate={dateFrom || undefined}
                    onChange={(selectedDates) => {
                      if (selectedDates.length > 0) {
                        setDateFrom(selectedDates[0].toISOString().split("T")[0]);
                      }
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="dateTo">Date To</Label>
                  <DatePicker
                    id="dateTo"
                    placeholder="Select end date"
                    defaultDate={dateTo || undefined}
                    onChange={(selectedDates) => {
                      if (selectedDates.length > 0) {
                        setDateTo(selectedDates[0].toISOString().split("T")[0]);
                      }
                    }}
                  />
                </div>

                {/* Quick Date Options */}
                <div className="sm:col-span-2 lg:col-span-1">
                  <Label>Quick Select</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {["today", "tomorrow", "thisWeek", "thisMonth"].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => handleQuickDateFilter(opt)}
                        className="rounded-md bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                      >
                        {opt === "today" ? "Today" : opt === "tomorrow" ? "Tomorrow" : opt === "thisWeek" ? "This Week" : "This Month"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status Filter */}
                <div className="sm:col-span-2">
                  <Label>Status</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {Object.values(AppointmentStatus).map((status) => (
                      <label key={status} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedStatuses.includes(status)}
                          onChange={() => handleStatusToggle(status)}
                          className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                        />
                        <Badge size="sm" color={getStatusBadgeColor(status)}>
                          {status}
                        </Badge>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Doctor Filter */}
                <div>
                  <Label htmlFor="doctorFilter">Doctor</Label>
                  <select
                    id="doctorFilter"
                    value={selectedDoctor || ""}
                    onChange={(e) => setSelectedDoctor(e.target.value ? Number(e.target.value) : null)}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  >
                    <option value="">All Doctors</option>
                    {doctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name} - {doc.specialization}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Patient Filter */}
                <div>
                  <Label htmlFor="patientFilter">Patient</Label>
                  <select
                    id="patientFilter"
                    value={selectedPatient || ""}
                    onChange={(e) => setSelectedPatient(e.target.value ? Number(e.target.value) : null)}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  >
                    <option value="">All Patients</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Appointment Type Filter */}
                <div>
                  <Label htmlFor="typeFilter">Appointment Type</Label>
                  <select
                    id="typeFilter"
                    value={selectedType || ""}
                    onChange={(e) => setSelectedType(e.target.value ? (e.target.value as AppointmentType) : null)}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  >
                    <option value="">All Types</option>
                    {Object.values(AppointmentType).map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Payment Status Filter */}
                <div>
                  <Label htmlFor="paymentFilter">Payment Status</Label>
                  <select
                    id="paymentFilter"
                    value={selectedPaymentStatus || ""}
                    onChange={(e) => setSelectedPaymentStatus(e.target.value ? (e.target.value as PaymentStatus) : null)}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  >
                    <option value="">All Payment Status</option>
                    {Object.values(PaymentStatus).map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </ComponentCard>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/30">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {selectedIds.length} selected
            </span>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
            >
              <DownloadIcon />
              Export Excel
            </button>
            <button
              onClick={handleSendReminder}
              className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
            >
              <BellIcon />
              Send Reminder
            </button>
            <button
              onClick={() => {
                setCancelReason("");
                setBulkCancelModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
            >
              <CancelIcon />
              Cancel Selected
            </button>
          </div>
        )}

        {/* Appointments Table */}
        <ComponentCard title={`Appointments List (${totalElements} total)`}>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className="px-4 py-3 w-12">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                      />
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      ID
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Appointment Code
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Date &amp; Time
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Patient
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Doctor
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Type
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Status
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Queue
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Payment
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {loading ? (
                    <TableRow>
                      <td className="px-4 py-8 text-center" colSpan={11}>
                        <div className="flex items-center justify-center">
                          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
                          <span className="ml-2 text-gray-500">Loading...</span>
                        </div>
                      </td>
                    </TableRow>
                  ) : appointments.length === 0 ? (
                    <TableRow>
                      <td className="px-4 py-8 text-center text-gray-500" colSpan={11}>
                        No appointments found
                      </td>
                    </TableRow>
                  ) : (
                    appointments.map((appointment) => (
                      <TableRow key={appointment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <TableCell className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(appointment.id)}
                            onChange={() => handleSelectOne(appointment.id)}
                            className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                          />
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                          {appointment.id}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <button
                            onClick={() => handleView(appointment)}
                            className="font-medium text-brand-500 hover:text-brand-600 hover:underline"
                          >
                            {appointment.appointmentCode}
                          </button>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-700 text-theme-sm dark:text-gray-300">
                          <div>{formatDate(appointment.appointmentDate)}</div>
                          <div className="text-xs text-gray-500">
                            {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <button className="font-medium text-gray-800 hover:text-brand-500 hover:underline dark:text-white">
                            {appointment.patientName}
                          </button>
                          <div className="text-xs text-gray-500">{appointment.patientEmail}</div>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <button className="font-medium text-gray-800 hover:text-brand-500 hover:underline dark:text-white">
                            {appointment.doctorName}
                          </button>
                          <div className="text-xs text-gray-500">{appointment.doctorSpecialization}</div>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <Badge size="sm" variant="light" color="primary">
                            {appointment.appointmentType || "CONSULTATION"}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <Badge size="sm" color={getStatusBadgeColor(appointment.status)}>
                            {appointment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center text-theme-sm">
                          {appointment.queueNumber ? (
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 font-bold text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                              {appointment.queueNumber}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <Badge size="sm" color={getPaymentBadgeColor(appointment.paymentStatus)}>
                            {appointment.paymentStatus || "PENDING"}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleView(appointment)}
                              className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-300"
                            >
                              Preview
                            </button>
                            <button
                              onClick={() => handleViewDetail(appointment.id)}
                              className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600 transition-colors"
                            >
                              Detail
                            </button>
                            {![AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW].includes(appointment.status) && (
                              <>
                                <button
                                  onClick={() => handleRescheduleClick(appointment)}
                                  className="rounded-lg bg-yellow-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-yellow-600 transition-colors"
                                >
                                  Reschedule
                                </button>
                                <button
                                  onClick={() => handleCancelClick(appointment)}
                                  className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 transition-colors"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i)}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                        currentPage === i
                          ? "bg-brand-500 text-white"
                          : "border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={currentPage >= totalPages - 1}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </ComponentCard>
      </div>

      {/* View Modal */}
      <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} className="max-w-2xl">
        <div className="p-6">
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
            Appointment Details
          </h2>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Appointment Code</Label>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedAppointment.appointmentCode}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <p><Badge color={getStatusBadgeColor(selectedAppointment.status)}>{selectedAppointment.status}</Badge></p>
                </div>
                <div>
                  <Label>Date</Label>
                  <p className="text-gray-700 dark:text-gray-300">{formatDate(selectedAppointment.appointmentDate)}</p>
                </div>
                <div>
                  <Label>Time</Label>
                  <p className="text-gray-700 dark:text-gray-300">
                    {formatTime(selectedAppointment.startTime)} - {formatTime(selectedAppointment.endTime)}
                  </p>
                </div>
              </div>

              <hr className="border-gray-200 dark:border-gray-700" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Patient Name</Label>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedAppointment.patientName}</p>
                </div>
                <div>
                  <Label>Patient Email</Label>
                  <p className="text-gray-700 dark:text-gray-300">{selectedAppointment.patientEmail}</p>
                </div>
                <div>
                  <Label>Patient Phone</Label>
                  <p className="text-gray-700 dark:text-gray-300">{selectedAppointment.patientPhone}</p>
                </div>
              </div>

              <hr className="border-gray-200 dark:border-gray-700" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Doctor Name</Label>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedAppointment.doctorName}</p>
                </div>
                <div>
                  <Label>Specialization</Label>
                  <p className="text-gray-700 dark:text-gray-300">{selectedAppointment.doctorSpecialization}</p>
                </div>
              </div>

              <hr className="border-gray-200 dark:border-gray-700" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Reason for Visit</Label>
                  <p className="text-gray-700 dark:text-gray-300">{selectedAppointment.reasonForVisit || "-"}</p>
                </div>
                <div>
                  <Label>Symptoms</Label>
                  <p className="text-gray-700 dark:text-gray-300">{selectedAppointment.symptoms || "-"}</p>
                </div>
                <div>
                  <Label>Queue Number</Label>
                  <p className="text-gray-700 dark:text-gray-300">{selectedAppointment.queueNumber || "-"}</p>
                </div>
                <div>
                  <Label>Payment Status</Label>
                  <p><Badge color={getPaymentBadgeColor(selectedAppointment.paymentStatus)}>{selectedAppointment.paymentStatus || "PENDING"}</Badge></p>
                </div>
                <div>
                  <Label>Booked By</Label>
                  <p className="text-gray-700 dark:text-gray-300">{selectedAppointment.bookedBy} ({selectedAppointment.bookedByUserName})</p>
                </div>
                <div>
                  <Label>Check-in Time</Label>
                  <p className="text-gray-700 dark:text-gray-300">{selectedAppointment.checkedInAt ? new Date(selectedAppointment.checkedInAt).toLocaleString() : "-"}</p>
                </div>
              </div>

              {selectedAppointment.notes && (
                <div>
                  <Label>Notes</Label>
                  <p className="text-gray-700 dark:text-gray-300">{selectedAppointment.notes}</p>
                </div>
              )}

              {selectedAppointment.cancellationReason && (
                <div>
                  <Label>Cancellation Reason</Label>
                  <p className="text-red-600 dark:text-red-400">{selectedAppointment.cancellationReason}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setViewModalOpen(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setViewModalOpen(false);
                    handleViewDetail(selectedAppointment.id);
                  }}
                  className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
                >
                  View Full Details
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Reschedule Modal */}
      <Modal isOpen={rescheduleModalOpen} onClose={() => setRescheduleModalOpen(false)} className="max-w-md">
        <div className="p-6">
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
            Reschedule Appointment
          </h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newDate">New Date</Label>
              <input
                id="newDate"
                type="date"
                value={rescheduleData.newDate}
                onChange={(e) => setRescheduleData({ ...rescheduleData, newDate: e.target.value })}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="newStartTime">Start Time</Label>
                <input
                  id="newStartTime"
                  type="time"
                  value={rescheduleData.newStartTime}
                  onChange={(e) => setRescheduleData({ ...rescheduleData, newStartTime: e.target.value })}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
              <div>
                <Label htmlFor="newEndTime">End Time</Label>
                <input
                  id="newEndTime"
                  type="time"
                  value={rescheduleData.newEndTime}
                  onChange={(e) => setRescheduleData({ ...rescheduleData, newEndTime: e.target.value })}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="rescheduleReason">Reason</Label>
              <textarea
                id="rescheduleReason"
                value={rescheduleData.reason}
                onChange={(e) => setRescheduleData({ ...rescheduleData, reason: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-sm focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                placeholder="Enter reason for rescheduling..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setRescheduleModalOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleRescheduleSubmit}
                className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600"
              >
                Reschedule
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Cancel Modal */}
      <Modal isOpen={cancelModalOpen} onClose={() => setCancelModalOpen(false)} className="max-w-md">
        <div className="p-6">
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
            Cancel Appointment
          </h2>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            Are you sure you want to cancel this appointment? This action cannot be undone.
          </p>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cancelReason">Cancellation Reason *</Label>
              <textarea
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-sm focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                placeholder="Enter reason for cancellation..."
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
              >
                Close
              </button>
              <button
                onClick={handleCancelSubmit}
                disabled={!cancelReason.trim()}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
              >
                Cancel Appointment
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Bulk Cancel Modal */}
      <Modal isOpen={bulkCancelModalOpen} onClose={() => setBulkCancelModalOpen(false)} className="max-w-md">
        <div className="p-6">
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
            Cancel {selectedIds.length} Appointments
          </h2>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            Are you sure you want to cancel {selectedIds.length} appointments? This action cannot be undone.
          </p>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bulkCancelReason">Cancellation Reason *</Label>
              <textarea
                id="bulkCancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-sm focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                placeholder="Enter reason for cancellation..."
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setBulkCancelModalOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
              >
                Close
              </button>
              <button
                onClick={handleBulkCancel}
                disabled={!cancelReason.trim()}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
              >
                Cancel All Selected
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}


