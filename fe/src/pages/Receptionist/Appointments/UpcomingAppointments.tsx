import { useEffect, useState, useCallback, useMemo } from "react";
import receptionistService from "../../../services/receptionistService";
import type { ReceptionistAppointmentListDTO } from "../../../services/receptionistService";
import { StatusBadge, Spinner, EmptyState, Pagination, Toast, ConfirmDialog } from "./SharedComponents";

// ── Upcoming-only allowed actions ──
// NO check-in, payment, mark no-show, medical info
const UPCOMING_ACTIONS_PER_STATUS: Record<string, string[]> = {
  PENDING: ["VIEW", "CONFIRM", "SEND_REMINDER", "RESCHEDULE", "CANCEL"],
  CONFIRMED: ["VIEW", "SEND_REMINDER", "RESCHEDULE", "CANCEL"],
};

const ACTION_BUTTON_CONFIG: Record<string, { label: string; bg: string; hover: string; text: string }> = {
  VIEW: { label: "View", bg: "bg-gray-500", hover: "hover:bg-gray-600", text: "text-white" },
  CONFIRM: { label: "Confirm", bg: "bg-blue-500", hover: "hover:bg-blue-600", text: "text-white" },
  SEND_REMINDER: { label: "Remind", bg: "bg-indigo-500", hover: "hover:bg-indigo-600", text: "text-white" },
  RESCHEDULE: { label: "Reschedule", bg: "bg-amber-500", hover: "hover:bg-amber-600", text: "text-white" },
  CANCEL: { label: "Cancel", bg: "bg-red-500", hover: "hover:bg-red-600", text: "text-white" },
};

interface UpcomingAppointmentsProps {
  onViewDetail: (id: number) => void;
  onCreateNew: () => void;
}

interface GroupedDay {
  date: string;
  appointments: ReceptionistAppointmentListDTO[];
  confirmedCount: number;
  pendingCount: number;
  doctorBreakdown: { name: string; specialization: string; count: number }[];
}

// ── Helpers ──
function getDefaultFrom(): string {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

function getDefaultTo(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1, 0); // last day of current month
  return d.toISOString().split("T")[0];
}

function isWithin24h(dateStr: string): boolean {
  const now = new Date();
  const target = new Date(dateStr + "T00:00:00");
  const diffMs = target.getTime() - now.getTime();
  return diffMs > 0 && diffMs <= 24 * 60 * 60 * 1000;
}

function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday = dateStr === today.toISOString().split("T")[0];
  const isTomorrow = dateStr === tomorrow.toISOString().split("T")[0];
  const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "long" });
  const formatted = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  if (isToday) return `Today — ${formatted}`;
  if (isTomorrow) return `Tomorrow — ${formatted}`;
  return `${dayOfWeek} — ${formatted}`;
}

export default function UpcomingAppointments({ onViewDetail, onCreateNew: _onCreateNew }: UpcomingAppointmentsProps) {
  // ── State ──
  const [appointments, setAppointments] = useState<ReceptionistAppointmentListDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(50);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Filters
  const [dateFrom, setDateFrom] = useState(getDefaultFrom);
  const [dateTo, setDateTo] = useState(getDefaultTo);
  const [statusFilter, setStatusFilter] = useState<string[]>(["CONFIRMED", "PENDING"]);
  const [searchQuery, setSearchQuery] = useState("");

  // Action states
  const [sendingReminderAll, setSendingReminderAll] = useState<string | null>(null);
  const [confirmingAll, setConfirmingAll] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [exportingDate, setExportingDate] = useState<string | null>(null);
  const [showCollapsedDoctors, setShowCollapsedDoctors] = useState<Set<string>>(new Set());

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    variant: "danger" | "warning" | "info";
    onConfirm: () => void;
  } | null>(null);

  // ── Fetch ──
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await receptionistService.getUpcomingAppointments({
        from: dateFrom,
        to: dateTo,
        pageNumber: page,
        pageSize,
      });
      let list = data?.content || [];
      // Client-side status filter & search
      if (statusFilter.length > 0) {
        list = list.filter((a) => statusFilter.includes(a.status));
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        list = list.filter(
          (a) =>
            a.patientName?.toLowerCase().includes(q) ||
            a.doctorName?.toLowerCase().includes(q) ||
            a.appointmentCode?.toLowerCase().includes(q)
        );
      }
      setAppointments(list);
      setTotalElements(data?.totalElements || 0);
      setTotalPages(data?.totalPages || 0);
    } catch (error) {
      console.error("Failed to fetch upcoming:", error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, dateFrom, dateTo, statusFilter, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Group by date ──
  const grouped: GroupedDay[] = useMemo(() => {
    const dateMap = new Map<string, ReceptionistAppointmentListDTO[]>();
    appointments.forEach((apt) => {
      const date = apt.appointmentDate;
      if (!dateMap.has(date)) dateMap.set(date, []);
      dateMap.get(date)!.push(apt);
    });

    const result: GroupedDay[] = [];
    dateMap.forEach((apts, date) => {
      const confirmedCount = apts.filter((a) => a.status === "CONFIRMED").length;
      const pendingCount = apts.filter((a) => a.status === "PENDING").length;

      // Doctor breakdown
      const doctorMap = new Map<number, { name: string; specialization: string; count: number }>();
      apts.forEach((a) => {
        const existing = doctorMap.get(a.doctorId);
        if (existing) {
          existing.count++;
        } else {
          doctorMap.set(a.doctorId, { name: a.doctorName, specialization: a.doctorSpecialization, count: 1 });
        }
      });

      result.push({
        date,
        appointments: apts,
        confirmedCount,
        pendingCount,
        doctorBreakdown: Array.from(doctorMap.values()).sort((a, b) => b.count - a.count),
      });
    });

    result.sort((a, b) => a.date.localeCompare(b.date));
    return result;
  }, [appointments]);

  // ── Overview stats ──
  const overviewStats = useMemo(() => {
    const totalConfirmed = appointments.filter((a) => a.status === "CONFIRMED").length;
    const totalPending = appointments.filter((a) => a.status === "PENDING").length;
    const urgentPending = appointments.filter(
      (a) => a.status === "PENDING" && isWithin24h(a.appointmentDate)
    ).length;
    const uniqueDoctors = new Set(appointments.map((a) => a.doctorId)).size;
    const totalDays = grouped.length;
    const busiestDay = grouped.reduce<GroupedDay | null>((max, g) => (!max || g.appointments.length > max.appointments.length ? g : max), null);
    return { totalConfirmed, totalPending, urgentPending, uniqueDoctors, totalDays, busiestDay };
  }, [appointments, grouped]);

  // ── Actions ──
  const handleSendReminderAll = async (date: string, apts: ReceptionistAppointmentListDTO[]) => {
    const eligibleIds = apts.filter((a) => a.status === "CONFIRMED" || a.status === "PENDING").map((a) => a.id);
    if (eligibleIds.length === 0) {
      setToast({ message: "No appointments to remind", type: "info" });
      return;
    }
    try {
      setSendingReminderAll(date);
      const result = await receptionistService.bulkSendReminders(eligibleIds);
      setToast({
        message: `${result.successCount} reminders sent for ${formatDateHeader(date)} (quota: ${result.quotaRemaining}/${result.quotaLimit})`,
        type: "success",
      });
    } catch {
      setToast({ message: "Failed to send reminders", type: "error" });
    } finally {
      setSendingReminderAll(null);
    }
  };

  const handleConfirmAllPending = async (date: string, apts: ReceptionistAppointmentListDTO[]) => {
    const pendingIds = apts.filter((a) => a.status === "PENDING").map((a) => a.id);
    if (pendingIds.length === 0) {
      setToast({ message: "No pending appointments to confirm", type: "info" });
      return;
    }
    setConfirmDialog({
      open: true,
      title: "Confirm All Pending",
      message: `Are you sure you want to confirm ${pendingIds.length} pending appointment(s) for ${formatDateHeader(date)}?`,
      variant: "info",
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          setConfirmingAll(date);
          await receptionistService.bulkConfirm(pendingIds);
          setToast({ message: `${pendingIds.length} appointments confirmed`, type: "success" });
          fetchData();
        } catch {
          setToast({ message: "Failed to confirm appointments", type: "error" });
        } finally {
          setConfirmingAll(null);
        }
      },
    });
  };

  const handleExportDailyList = async (date: string) => {
    try {
      setExportingDate(date);
      const blob = await receptionistService.exportAppointments({
        from: date,
        to: date,
        statuses: statusFilter.length > 0 ? statusFilter : ["CONFIRMED", "PENDING"],
        format: "CSV",
        columns: [
          "appointmentCode", "patientName", "patientPhone", "doctorName",
          "specialty", "startTime", "endTime", "status", "reasonForVisit",
        ],
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `schedule_${date}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setToast({ message: `Exported schedule for ${date}`, type: "success" });
    } catch {
      setToast({ message: "Failed to export", type: "error" });
    } finally {
      setExportingDate(null);
    }
  };

  const handlePrintSchedule = (date: string, apts: ReceptionistAppointmentListDTO[]) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const rows = apts
      .map(
        (a) =>
          `<tr>
            <td style="padding:4px 8px;border:1px solid #ddd">${a.startTime}–${a.endTime}</td>
            <td style="padding:4px 8px;border:1px solid #ddd">${a.appointmentCode}</td>
            <td style="padding:4px 8px;border:1px solid #ddd">${a.patientName}</td>
            <td style="padding:4px 8px;border:1px solid #ddd">${a.doctorName}</td>
            <td style="padding:4px 8px;border:1px solid #ddd">${a.doctorSpecialization}</td>
            <td style="padding:4px 8px;border:1px solid #ddd">${a.status}</td>
          </tr>`
      )
      .join("");
    printWindow.document.write(`
      <html><head><title>Schedule ${date}</title></head>
      <body style="font-family:Arial,sans-serif;padding:20px">
        <h2>Appointment Schedule — ${formatDateHeader(date)}</h2>
        <p>Total: ${apts.length} | Confirmed: ${apts.filter((a) => a.status === "CONFIRMED").length} | Pending: ${apts.filter((a) => a.status === "PENDING").length}</p>
        <table style="border-collapse:collapse;width:100%;font-size:13px">
          <thead><tr style="background:#f3f4f6">
            <th style="padding:6px 8px;border:1px solid #ddd;text-align:left">Time</th>
            <th style="padding:6px 8px;border:1px solid #ddd;text-align:left">Code</th>
            <th style="padding:6px 8px;border:1px solid #ddd;text-align:left">Patient</th>
            <th style="padding:6px 8px;border:1px solid #ddd;text-align:left">Doctor</th>
            <th style="padding:6px 8px;border:1px solid #ddd;text-align:left">Specialty</th>
            <th style="padding:6px 8px;border:1px solid #ddd;text-align:left">Status</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="margin-top:16px;font-size:11px;color:#888">Printed at ${new Date().toLocaleString()}</p>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleAction = async (action: string, apt: ReceptionistAppointmentListDTO) => {
    switch (action) {
      case "VIEW":
        onViewDetail(apt.id);
        break;
      case "CONFIRM":
        try {
          setActionLoading(apt.id);
          await receptionistService.confirmAppointment(apt.id);
          setToast({ message: `Confirmed: ${apt.appointmentCode}`, type: "success" });
          fetchData();
        } catch {
          setToast({ message: "Confirmation failed", type: "error" });
        } finally {
          setActionLoading(null);
        }
        break;
      case "SEND_REMINDER":
        try {
          setActionLoading(apt.id);
          await receptionistService.sendReminder(apt.id, "EMAIL");
          setToast({ message: "Reminder sent", type: "success" });
        } catch {
          setToast({ message: "Failed to send reminder", type: "error" });
        } finally {
          setActionLoading(null);
        }
        break;
      case "RESCHEDULE":
        onViewDetail(apt.id);
        break;
      case "CANCEL":
        setConfirmDialog({
          open: true,
          title: "Cancel Appointment",
          message: `Cancel ${apt.appointmentCode} for ${apt.patientName}?`,
          variant: "danger",
          onConfirm: async () => {
            setConfirmDialog(null);
            try {
              setActionLoading(apt.id);
              await receptionistService.bulkCancel([apt.id], "Cancelled by receptionist from upcoming view", true);
              setToast({ message: `Cancelled: ${apt.appointmentCode}`, type: "success" });
              fetchData();
            } catch {
              setToast({ message: "Cancellation failed", type: "error" });
            } finally {
              setActionLoading(null);
            }
          },
        });
        break;
      default:
        onViewDetail(apt.id);
    }
  };

  const toggleDoctorBreakdown = (date: string) => {
    setShowCollapsedDoctors((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  const handleStatusToggle = (status: string) => {
    setStatusFilter((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
    setPage(0);
  };

  return (
    <div className="space-y-4">
      {/* ════════════ FILTERS ════════════ */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap items-end gap-4">
          {/* Date range */}
          <div className="flex items-center gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>
            <span className="text-gray-400 mt-5">→</span>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Status chips */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
            <div className="flex gap-1.5">
              {["CONFIRMED", "PENDING"].map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusToggle(s)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    statusFilter.includes(s)
                      ? s === "CONFIRMED"
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700"
                        : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700"
                      : "bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600"
                  }`}
                >
                  {s === "CONFIRMED" ? "Confirmed" : "Pending"}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
              placeholder="Patient, doctor, code..."
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400"
            />
          </div>

          {/* Quick presets */}
          <div className="flex gap-1.5">
            <button
              onClick={() => { setDateFrom(getDefaultFrom()); setDateTo(getDefaultFrom()); setPage(0); }}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Tomorrow
            </button>
            <button
              onClick={() => {
                const from = getDefaultFrom();
                const to = new Date();
                to.setDate(to.getDate() + 7);
                setDateFrom(from);
                setDateTo(to.toISOString().split("T")[0]);
                setPage(0);
              }}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Next 7 days
            </button>
            <button
              onClick={() => { setDateFrom(getDefaultFrom()); setDateTo(getDefaultTo()); setPage(0); }}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              This month
            </button>
          </div>
        </div>
      </div>

      {/* ════════════ OVERVIEW SUMMARY ════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <SummaryCard label="Total" value={appointments.length} color="gray" />
        <SummaryCard label="Confirmed" value={overviewStats.totalConfirmed} color="blue" />
        <SummaryCard label="Pending" value={overviewStats.totalPending} color="yellow" />
        <SummaryCard
          label="Urgent (< 24h)"
          value={overviewStats.urgentPending}
          color={overviewStats.urgentPending > 0 ? "red" : "gray"}
        />
        <SummaryCard label="Doctors" value={overviewStats.uniqueDoctors} color="indigo" />
        <SummaryCard
          label="Busiest Day"
          value={overviewStats.busiestDay ? overviewStats.busiestDay.appointments.length : 0}
          subtext={overviewStats.busiestDay ? formatDateHeader(overviewStats.busiestDay.date) : "—"}
          color="emerald"
        />
      </div>

      {/* ════════════ URGENT ALERT ════════════ */}
      {overviewStats.urgentPending > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <span className="text-sm font-semibold text-red-800 dark:text-red-300">
              {overviewStats.urgentPending} PENDING appointment{overviewStats.urgentPending > 1 ? "s" : ""} within 24 hours
            </span>
            <span className="text-xs text-red-600 dark:text-red-400 ml-2">
              — needs confirmation now to avoid no-show
            </span>
          </div>
        </div>
      )}

      {/* ════════════ GROUPED LIST ════════════ */}
      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Spinner />
        </div>
      ) : grouped.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <EmptyState message="No upcoming appointments in this range" />
        </div>
      ) : (
        <>
          {grouped.map(({ date, appointments: dayApts, confirmedCount, pendingCount, doctorBreakdown }) => {
            const urgent = isWithin24h(date);
            const hasPendingUrgent = urgent && pendingCount > 0;

            return (
              <div
                key={date}
                className={`bg-white dark:bg-gray-800 rounded-xl border overflow-hidden ${
                  hasPendingUrgent
                    ? "border-red-300 dark:border-red-700 ring-1 ring-red-200 dark:ring-red-800"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                {/* ── Date Header ── */}
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatDateHeader(date)}
                      </h3>
                      {hasPendingUrgent && (
                        <span className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full animate-pulse">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          URGENT
                        </span>
                      )}
                    </div>

                    {/* Per-date summary badges */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                        {dayApts.length} total
                      </span>
                      {confirmedCount > 0 && (
                        <span className="text-xs text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                          {confirmedCount} confirmed
                        </span>
                      )}
                      {pendingCount > 0 && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          hasPendingUrgent
                            ? "text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 font-semibold"
                            : "text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30"
                        }`}>
                          {pendingCount} pending
                        </span>
                      )}
                      {/* Doctor breakdown toggle */}
                      <button
                        onClick={() => toggleDoctorBreakdown(date)}
                        className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline"
                      >
                        {doctorBreakdown.length} doctor{doctorBreakdown.length > 1 ? "s" : ""}
                      </button>
                    </div>
                  </div>

                  {/* Doctor breakdown (collapsible) */}
                  {showCollapsedDoctors.has(date) && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {doctorBreakdown.map((doc) => (
                        <span
                          key={doc.name}
                          className="inline-flex items-center gap-1 text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 px-2 py-1 rounded-md"
                        >
                          <span className="font-medium">{doc.name}</span>
                          <span className="text-indigo-500">·</span>
                          <span>{doc.specialization}</span>
                          <span className="bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-300 px-1.5 rounded-full font-semibold ml-1">
                            {doc.count}
                          </span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Per-date actions */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => handleSendReminderAll(date, dayApts)}
                      disabled={sendingReminderAll === date}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-900/30 disabled:opacity-50 transition-colors"
                    >
                      {sendingReminderAll === date ? (
                        <div className="w-3 h-3 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <BellIcon />
                      )}
                      Send Reminder All
                    </button>

                    {pendingCount > 0 && (
                      <button
                        onClick={() => handleConfirmAllPending(date, dayApts)}
                        disabled={confirmingAll === date}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 disabled:opacity-50 transition-colors"
                      >
                        {confirmingAll === date ? (
                          <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <CheckIcon />
                        )}
                        Confirm All Pending
                      </button>
                    )}

                    <button
                      onClick={() => handlePrintSchedule(date, dayApts)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <PrintIcon />
                      Print
                    </button>

                    <button
                      onClick={() => handleExportDailyList(date)}
                      disabled={exportingDate === date}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
                    >
                      {exportingDate === date ? (
                        <div className="w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <ExportIcon />
                      )}
                      Export
                    </button>
                  </div>
                </div>

                {/* ── Appointments Table ── */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                        <th className="px-4 py-2 font-medium">Time</th>
                        <th className="px-4 py-2 font-medium">Code</th>
                        <th className="px-4 py-2 font-medium">Patient</th>
                        <th className="px-4 py-2 font-medium">Doctor</th>
                        <th className="px-4 py-2 font-medium">Status</th>
                        <th className="px-4 py-2 font-medium">Booked By</th>
                        <th className="px-4 py-2 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {dayApts.map((apt) => {
                        const isPendingUrgent = apt.status === "PENDING" && urgent;
                        const actions = UPCOMING_ACTIONS_PER_STATUS[apt.status] || ["VIEW"];

                        return (
                          <tr
                            key={apt.id}
                            className={`transition-colors ${
                              isPendingUrgent
                                ? "bg-red-50/50 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20"
                                : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                            }`}
                          >
                            <td className="px-4 py-3 w-24">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{apt.startTime}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{apt.endTime}</div>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => onViewDetail(apt.id)}
                                className="text-sm font-mono text-brand-600 dark:text-brand-400 hover:underline"
                              >
                                {apt.appointmentCode || `#${apt.id}`}
                              </button>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{apt.patientName}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{apt.maskedPhone}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm text-gray-900 dark:text-white">{apt.doctorName}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{apt.doctorSpecialization}</div>
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={apt.status} />
                              {isPendingUrgent && (
                                <span className="block text-[10px] font-semibold text-red-500 mt-0.5">Needs confirm!</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {apt.bookedBy === "ONLINE" ? "🌐 Online" : apt.bookedBy === "RECEPTIONIST" ? "🏥 Reception" : apt.bookedBy || "—"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {actionLoading === apt.id ? (
                                <div className="flex justify-end">
                                  <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                              ) : (
                                <div className="flex flex-wrap items-center gap-1 justify-end">
                                  {actions.map((action) => {
                                    const cfg = ACTION_BUTTON_CONFIG[action] || {
                                      label: action,
                                      bg: "bg-gray-500",
                                      hover: "hover:bg-gray-600",
                                      text: "text-white",
                                    };
                                    return (
                                      <button
                                        key={action}
                                        onClick={() => handleAction(action, apt)}
                                        className={`px-2.5 py-1 text-xs font-semibold rounded-md ${cfg.bg} ${cfg.hover} ${cfg.text} transition-colors whitespace-nowrap shadow-sm`}
                                      >
                                        {cfg.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          <Pagination
            page={page}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </>
      )}

      {/* Confirm Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          isOpen={confirmDialog.open}
          title={confirmDialog.title}
          message={confirmDialog.message}
          variant={confirmDialog.variant}
          confirmLabel="Confirm"
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ════════════════════════════════════════
// ── Small Presentational Components ──
// ════════════════════════════════════════

function SummaryCard({
  label,
  value,
  subtext,
  color,
}: {
  label: string;
  value: number;
  subtext?: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    gray: "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white",
    blue: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300",
    yellow: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300",
    red: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300",
    indigo: "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300",
    emerald: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300",
  };

  return (
    <div className={`rounded-xl border p-3 ${colorMap[color] || colorMap.gray}`}>
      <div className="text-xs font-medium opacity-70 mb-1">{label}</div>
      <div className="text-xl font-bold">{value}</div>
      {subtext && <div className="text-[10px] opacity-60 mt-0.5 truncate">{subtext}</div>}
    </div>
  );
}

function BellIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function PrintIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
    </svg>
  );
}

function ExportIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
