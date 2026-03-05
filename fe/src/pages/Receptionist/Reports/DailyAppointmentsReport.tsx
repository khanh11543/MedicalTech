import { useState, useCallback, useEffect } from "react";
import receptionistService from "../../../services/receptionistService";
import type {
  DailyAppointmentReportDTO,
  DoctorQueueStatusDTO,
} from "../../../services/receptionistService";

// ==================== HELPERS ====================

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  CONFIRMED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  SCHEDULED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  CHECKED_IN: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  IN_PROGRESS: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  NO_SHOW: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  RESCHEDULED: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
};

const PAYMENT_COLORS: Record<string, string> = {
  PAID: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  "N/A": "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500",
};

const formatTime = (time: string | null) => {
  if (!time) return "—";
  // HH:mm:ss → HH:mm
  return time.substring(0, 5);
};

export default function DailyAppointmentsReport() {
  const [selectedDate, setSelectedDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [selectedDoctor, setSelectedDoctor] = useState<number | undefined>(undefined);
  const [report, setReport] = useState<DailyAppointmentReportDTO | null>(null);
  const [doctors, setDoctors] = useState<DoctorQueueStatusDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ==================== FETCH ====================

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await receptionistService.getDailyAppointmentReport(
        selectedDate,
        selectedDoctor
      );
      setReport(data);
    } catch (err: unknown) {
      console.error("Failed to fetch daily appointments report:", err);
      setError("Failed to load report. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedDoctor]);

  const fetchDoctors = useCallback(async () => {
    try {
      const data = await receptionistService.getQueueStatus();
      setDoctors(data);
    } catch (err) {
      console.error("Failed to load doctors:", err);
    }
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // ==================== EXPORT ====================

  const handleExport = async (format: "PDF" | "EXCEL" | "CSV") => {
    setExporting(true);
    try {
      const blob = await receptionistService.exportDailyAppointments(
        format,
        selectedDate,
        selectedDoctor
      );
      const ext = format === "EXCEL" ? "xlsx" : format.toLowerCase();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `daily_appointments_${selectedDate}.${ext}`;
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

  const s = report?.summary;

  // ==================== RENDER ====================

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap items-end gap-4">
          {/* Date */}
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

          {/* Doctor filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Doctor
            </label>
            <select
              value={selectedDoctor ?? ""}
              onChange={(e) =>
                setSelectedDoctor(e.target.value ? Number(e.target.value) : undefined)
              }
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[180px]"
            >
              <option value="">All Doctors</option>
              {doctors.map((d) => (
                <option key={d.doctorId} value={d.doctorId}>
                  {d.doctorName}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh */}
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

          {/* Export */}
          <div className="relative ml-auto">
            <div className="flex gap-1">
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

      {/* Report */}
      {!loading && report && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <SummaryCard label="Total" value={s?.totalAppointments ?? 0} color="blue" />
            <SummaryCard label="Confirmed" value={s?.confirmed ?? 0} color="blue" />
            <SummaryCard label="Checked In" value={s?.checkedIn ?? 0} color="indigo" />
            <SummaryCard label="Completed" value={s?.completed ?? 0} color="green" />
            <SummaryCard label="Cancelled" value={s?.cancelled ?? 0} color="red" />
            <SummaryCard label="No-Show" value={s?.noShow ?? 0} color="gray" />
          </div>

          {/* Completion Rate */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
            <div className="flex-1">
              <div className="text-sm text-gray-500 dark:text-gray-400">Completion Rate</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {s?.completionRate?.toFixed(1)}%
              </div>
            </div>
            <div className="w-48 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className="bg-green-500 rounded-full h-3 transition-all"
                style={{ width: `${Math.min(s?.completionRate ?? 0, 100)}%` }}
              />
            </div>
          </div>

          {/* Metadata */}
          <div className="text-xs text-gray-400 dark:text-gray-500 flex flex-wrap gap-4">
            <span>Generated by: {report.generatedBy}</span>
            <span>Branch: {report.branch}</span>
            <span>Generated at: {report.generatedAt?.replace("T", " ")}</span>
          </div>

          {/* Appointment Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">#</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Code</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Time</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Patient</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Phone</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Doctor</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Room</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Queue</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {report.appointments.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-4 py-8 text-center text-gray-400">
                        No appointments found for this date.
                      </td>
                    </tr>
                  )}
                  {report.appointments.map((apt, idx) => (
                    <tr
                      key={apt.appointmentCode}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-700 dark:text-gray-300">
                        {apt.appointmentCode}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {formatTime(apt.startTime)} – {formatTime(apt.endTime)}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {apt.patientName}
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                        {apt.maskedPhone}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {apt.doctorName}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {apt.room || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            STATUS_COLORS[apt.status] || "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {apt.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                        {apt.queueNumber ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            PAYMENT_COLORS[apt.paymentStatus] || "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {apt.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {report.appointments.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400">
                Total: {report.appointments.length} appointments
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ==================== SUB-COMPONENTS ====================

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
    green: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400",
    red: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
    gray: "bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400",
    indigo: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400",
    purple: "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
  };

  return (
    <div className={`rounded-xl p-4 ${colorMap[color] || colorMap.blue}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs mt-1 opacity-80">{label}</div>
    </div>
  );
}
