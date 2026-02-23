import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import patientService, {
  type Appointment,
  type AppointmentStatus,
} from "../../services/patientService";

const statusConfig: Record<string, { label: string; classes: string }> = {
  PENDING: { label: "Pending", classes: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  CONFIRMED: { label: "Confirmed", classes: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  CHECKED_IN: { label: "Checked In", classes: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400" },
  IN_PROGRESS: { label: "In Progress", classes: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" },
  COMPLETED: { label: "Completed", classes: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  CANCELLED: { label: "Cancelled", classes: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  NO_SHOW: { label: "No Show", classes: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400" },
  RESCHEDULED: { label: "Rescheduled", classes: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
};

const statusFilters: { value: string; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "IN_PROGRESS", label: "In Progress" },
];

export default function MyAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const result = await patientService.getMyAppointments({
        status: statusFilter || undefined,
        pageNumber: page,
        pageSize: 10,
      });
      setAppointments(result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch (err) {
      console.error("Failed to load appointments:", err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return (
    <>
      <PageMeta title="My Appointments | MedicalTech" description="View your appointments" />
      <div className="p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">My Appointments</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {totalElements} total appointment{totalElements !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => navigate("/patient/doctors")}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors text-sm font-medium shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Book New
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => { setStatusFilter(f.value); setPage(0); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                statusFilter === f.value
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Appointment List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 p-5 flex gap-4">
                <div className="w-14 h-14 rounded-xl bg-gray-200 dark:bg-gray-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-white mb-2">No appointments found</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {statusFilter ? "Try a different filter" : "You haven't booked any appointments yet"}
            </p>
            <button
              onClick={() => navigate("/patient/doctors")}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors text-sm font-medium"
            >
              Book Appointment
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((appt) => (
              <AppointmentCard key={appt.id} appointment={appt} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 pt-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              Previous
            </button>
            <span className="flex items-center px-4 text-sm text-gray-600 dark:text-gray-400">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function AppointmentCard({ appointment: a }: { appointment: Appointment }) {
  const [expanded, setExpanded] = useState(false);
  const sc = statusConfig[a.status] || statusConfig.PENDING;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-800/50 overflow-hidden hover:shadow-md transition-shadow">
      <div
        className="flex items-center gap-4 p-4 sm:p-5 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Date Badge */}
        <div className="w-14 h-14 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex flex-col items-center justify-center shrink-0">
          <span className="text-[10px] font-bold text-blue-500 uppercase leading-tight">
            {new Date(a.appointmentDate).toLocaleDateString("en-US", { month: "short" })}
          </span>
          <span className="text-lg font-bold text-blue-700 dark:text-blue-300 leading-tight">
            {new Date(a.appointmentDate).getDate()}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Dr. {a.doctorName}</h3>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${sc.classes}`}>
              {sc.label}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {a.doctorSpecialization} • {a.startTime?.slice(0, 5)} – {a.endTime?.slice(0, 5)}
          </p>
          {a.appointmentCode && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Code: {a.appointmentCode}
            </p>
          )}
        </div>

        {/* Chevron */}
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform shrink-0 ${expanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-5 pb-5 pt-0 border-t border-gray-100 dark:border-gray-700/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 mt-4 text-sm">
            {a.reasonForVisit && (
              <DetailRow label="Reason" value={a.reasonForVisit} />
            )}
            {a.symptoms && (
              <DetailRow label="Symptoms" value={a.symptoms} />
            )}
            {a.notes && (
              <DetailRow label="Notes" value={a.notes} />
            )}
            {a.queueNumber !== null && a.queueNumber > 0 && (
              <DetailRow label="Queue #" value={String(a.queueNumber)} />
            )}
            {a.cancellationReason && (
              <DetailRow label="Cancellation Reason" value={a.cancellationReason} />
            )}
            <DetailRow label="Booked By" value={a.bookedByUserName || a.bookedBy} />
            <DetailRow label="Created" value={new Date(a.createdAt).toLocaleString()} />
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-gray-400 dark:text-gray-500 block">{label}</span>
      <span className="text-gray-700 dark:text-gray-300">{value}</span>
    </div>
  );
}
