import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Toast from "../../components/common/Toast";
import { useToast } from "../../hooks/useToast";
import Badge from "../../components/ui/badge/Badge";
import { DashboardSkeleton } from "../../components/ui/skeleton/Skeleton";
import {
  DoctorTodayData,
  CurrentPatient,
  QueueItem,
  TimelineItem,
  QueueSummary,
  getDoctorToday,
  callNextPatient,
  callPatient,
  completeConsultation,
  skipPatient,
  markNoShow,
  changeDoctorStatus,
} from "../../services/doctorService";

// ===================================================================
// Hook: live elapsed timer (seconds)
// ===================================================================
function useElapsedTimer(baseSeconds: number | null, active: boolean) {
  const [elapsed, setElapsed] = useState(baseSeconds ?? 0);
  useEffect(() => {
    setElapsed(baseSeconds ?? 0);
    if (!active || baseSeconds == null) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [baseSeconds, active]);
  return elapsed;
}

function fmtTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`;
}

function fmtSlot(t: string | null) {
  if (!t) return "--:--";
  return t.substring(0, 5); // "HH:mm"
}

// ===================================================================
// MAIN COMPONENT
// ===================================================================
export default function DoctorToday() {
  const navigate = useNavigate();
  const [view, setView] = useState<"queue" | "timeline">("queue");
  const [data, setData] = useState<DoctorTodayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [skipModal, setSkipModal] = useState<number | null>(null);
  const [skipReason, setSkipReason] = useState("");
  const [noShowModal, setNoShowModal] = useState<number | null>(null);
  const [noShowReason, setNoShowReason] = useState("");
  const [timelineFilter, setTimelineFilter] = useState<string | null>(null);
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { toast, showToast, dismissToast } = useToast();

  // ---- Fetch ----
  const fetchData = useCallback(async () => {
    try {
      const result = await getDoctorToday();
      setData(result);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh 30s
  useEffect(() => {
    if (autoRefresh) {
      refreshRef.current = setInterval(fetchData, 30_000);
    }
    return () => {
      if (refreshRef.current) clearInterval(refreshRef.current);
    };
  }, [autoRefresh, fetchData]);

  // ---- Action helpers ----
  const doAction = async (key: string, fn: () => Promise<void>) => {
    setActionLoading(key);
    try {
      await fn();
      await fetchData();
      showToast("Action completed successfully", "success");
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const axiosMsg = (err as any)?.response?.data?.message;
      const msg = axiosMsg || (err instanceof Error ? err.message : "Action failed");
      showToast(msg, "error");
    } finally {
      setActionLoading(null);
    }
  };

  // ---- Loading / Error ----
  if (loading) {
    return (
      <>
        <PageMeta title="Today | Doctor Panel" />
        <PageBreadcrumb pageTitle="Today" />
        <DashboardSkeleton />
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageMeta title="Today | Doctor Panel" />
        <PageBreadcrumb pageTitle="Today" />
        <div className="rounded-2xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10 p-8 text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600"
          >
            Retry
          </button>
        </div>
      </>
    );
  }

  if (!data) return null;

  const { currentPatient, waitingQueue, timeline, summary, doctorStatus } = data;

  return (
    <>
      <PageMeta title="Today | Doctor Panel" />
      <PageBreadcrumb pageTitle="Today" />

      <div className="space-y-5">
        {/* ================================================================
            TOP BAR: View toggle + Doctor Status + Auto-refresh
           ================================================================ */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: View toggle */}
          <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-1 bg-gray-50 dark:bg-gray-800">
            <button
              onClick={() => setView("queue")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                view === "queue"
                  ? "bg-white dark:bg-gray-700 text-brand-600 dark:text-brand-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              Queue View
            </button>
            <button
              onClick={() => setView("timeline")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                view === "timeline"
                  ? "bg-white dark:bg-gray-700 text-brand-600 dark:text-brand-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              Timeline View
            </button>
          </div>

          {/* Right: Doctor status + auto-refresh */}
          <div className="flex items-center gap-3">
            <DoctorStatusSelector
              current={doctorStatus}
              loading={actionLoading === "status"}
              onChange={(s) => doAction("status", () => changeDoctorStatus(s))}
            />
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
              />
              Auto-refresh
            </label>
          </div>
        </div>

        {/* ================================================================
            SUMMARY PILLS
           ================================================================ */}
        <SummaryBar summary={summary} />

        {/* ================================================================
            QUEUE VIEW
           ================================================================ */}
        {view === "queue" && (
          <div className="space-y-5">
            {/* A) Current Patient */}
            <CurrentPatientCard
              patient={currentPatient}
              actionLoading={actionLoading}
              onComplete={(id) => doAction("complete", () => completeConsultation(id))}
              onOpenConsultation={() => navigate("/doctor/consultation")}
            />

            {/* Queue actions */}
            <div className="flex flex-wrap gap-3">
              <button
                disabled={!!actionLoading || !!currentPatient}
                onClick={() => doAction("callNext", () => callNextPatient())}
                className="px-5 py-2.5 bg-brand-500 text-white font-medium text-sm rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {actionLoading === "callNext" ? "Calling..." : "Call Next Patient"}
              </button>
            </div>

            {/* B) Waiting Queue List */}
            <WaitingQueueList
              queue={waitingQueue}
              actionLoading={actionLoading}
              onCall={(id) => doAction(`call-${id}`, () => callPatient(id))}
              onNoShow={(id) => {
                setNoShowModal(id);
                setNoShowReason("");
              }}
              onSkip={(id) => {
                setSkipModal(id);
                setSkipReason("");
              }}
              hasCurrentPatient={!!currentPatient}
            />
          </div>
        )}

        {/* ================================================================
            TIMELINE VIEW
           ================================================================ */}
        {view === "timeline" && (
          <TimelineView
            items={timeline}
            filter={timelineFilter}
            onFilterChange={setTimelineFilter}
          />
        )}
      </div>

      {/* ================================================================
          SKIP MODAL
         ================================================================ */}
      {skipModal !== null && (
        <ReasonModal
          title="Skip Patient"
          description="A reason is required to skip a patient. This action will be recorded in the audit log."
          confirmLabel="Confirm Skip"
          confirmColor="bg-yellow-500 hover:bg-yellow-600"
          onCancel={() => setSkipModal(null)}
          onConfirm={() => {
            const id = skipModal;
            setSkipModal(null);
            doAction(`skip-${id}`, () => skipPatient(id, skipReason));
          }}
          reason={skipReason}
          setReason={setSkipReason}
        />
      )}
      {noShowModal !== null && (
        <ReasonModal
          title="Mark No-Show"
          description="A reason is required to mark a patient as no-show. This action will be recorded in the audit log and cannot be undone."
          confirmLabel="Confirm No-Show"
          confirmColor="bg-red-500 hover:bg-red-600"
          onCancel={() => setNoShowModal(null)}
          onConfirm={() => {
            const id = noShowModal;
            setNoShowModal(null);
            doAction(`noshow-${id}`, () => markNoShow(id, noShowReason));
          }}
          reason={noShowReason}
          setReason={setNoShowReason}
        />
      )}
      <Toast toast={toast} onDismiss={dismissToast} />
    </>
  );
}

// ===================================================================
// SUB-COMPONENTS
// ===================================================================

// ---- Doctor Status Selector ----
function DoctorStatusSelector({
  current,
  loading,
  onChange,
}: {
  current: string;
  loading: boolean;
  onChange: (s: string) => void;
}) {
  const colors: Record<string, string> = {
    AVAILABLE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    ON_BREAK: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    OFFLINE: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  };
  const icons: Record<string, string> = {
    AVAILABLE: "\u25CF",
    ON_BREAK: "\u25D0",
    OFFLINE: "\u25CB",
  };

  return (
    <div className="relative">
      <select
        disabled={loading}
        value={current}
        onChange={(e) => onChange(e.target.value)}
        title="Doctor Status"
        aria-label="Doctor Status"
        className={`appearance-none pl-6 pr-8 py-2 text-sm font-medium rounded-lg border-0 cursor-pointer focus:ring-2 focus:ring-brand-500 ${colors[current] || colors.OFFLINE}`}
      >
        <option value="AVAILABLE">Available</option>
        <option value="ON_BREAK">On Break</option>
        <option value="OFFLINE">Offline</option>
      </select>
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs pointer-events-none">
        {icons[current] || "\u25CB"}
      </span>
    </div>
  );
}

// ---- Summary Bar ----
function SummaryBar({ summary }: { summary: QueueSummary }) {
  const pills = [
    { label: "Total", value: summary.totalToday, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    { label: "Waiting", value: summary.waiting, color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
    { label: "In Progress", value: summary.inProgress, color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" },
    { label: "Completed", value: summary.completed, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    { label: "Not Checked In", value: summary.notCheckedIn, color: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300" },
    { label: "No-show", value: summary.noShow, color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {pills.map((p) => (
        <span key={p.label} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${p.color}`}>
          {p.label}: <span className="font-bold">{p.value}</span>
        </span>
      ))}
    </div>
  );
}

// ---- Current Patient Card ----
function CurrentPatientCard({
  patient,
  actionLoading,
  onComplete,
  onOpenConsultation,
}: {
  patient: CurrentPatient | null;
  actionLoading: string | null;
  onComplete: (id: number) => void;
  onOpenConsultation: () => void;
}) {
  const elapsed = useElapsedTimer(patient?.elapsedSeconds ?? null, !!patient);

  if (!patient) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 p-8 text-center">
        <p className="text-gray-400 dark:text-gray-500 text-lg">No patient in consultation</p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Click &quot;Call Next Patient&quot; to start</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-brand-400 dark:border-brand-500 bg-brand-50 dark:bg-brand-900/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-brand-500 dark:bg-brand-600 text-white">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold">#{patient.queueNumber}</span>
          <span className="text-sm opacity-80">{patient.appointmentCode}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs opacity-80">Time in consultation</span>
          <span className="text-xl font-mono font-bold bg-white/20 px-3 py-1 rounded-lg">
            {fmtTime(elapsed)}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Patient info */}
          <div className="space-y-2">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white">{patient.patientName ?? "Unknown"}</h4>
            <div className="flex flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-400">
              {patient.age != null && <span>{patient.age} years</span>}
              {patient.gender && <span>&middot; {patient.gender}</span>}
            </div>
            {patient.reasonForVisit && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Reason:</span> {patient.reasonForVisit}
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Scheduled: {fmtSlot(patient.scheduledStart)} &ndash; {fmtSlot(patient.scheduledEnd)}
            </p>
          </div>

          {/* Alerts */}
          <div className="space-y-2">
            {patient.allergies && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <span className="text-red-500 text-lg">&#x26A0;&#xFE0F;</span>
                <div>
                  <span className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase">Allergies</span>
                  <p className="text-sm text-red-700 dark:text-red-300">{patient.allergies}</p>
                </div>
              </div>
            )}
            {patient.medicalHistory && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <span className="text-amber-500 text-lg">&#x1F4CB;</span>
                <div>
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase">Medical History</span>
                  <p className="text-sm text-amber-700 dark:text-amber-300 line-clamp-3">{patient.medicalHistory}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onOpenConsultation}
            className="px-5 py-2.5 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 transition-colors"
          >
            Open Consultation Notes
          </button>
          <button
            onClick={() => onComplete(patient.appointmentId)}
            disabled={actionLoading === "complete"}
            className="px-5 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {actionLoading === "complete" ? "Completing..." : "Complete Consultation"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Waiting Queue List ----
function WaitingQueueList({
  queue,
  actionLoading,
  onCall,
  onNoShow,
  onSkip,
  hasCurrentPatient,
}: {
  queue: QueueItem[];
  actionLoading: string | null;
  onCall: (id: number) => void;
  onNoShow: (id: number) => void;
  onSkip: (id: number) => void;
  hasCurrentPatient: boolean;
}) {
  if (queue.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-8 text-center">
        <p className="text-gray-400 dark:text-gray-500">No patients waiting</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          Waiting Queue ({queue.length})
        </h3>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {queue.map((item) => {
          const bgClass =
            item.waitLevel === "CRITICAL"
              ? "bg-red-50/60 dark:bg-red-900/10 animate-pulse"
              : item.waitLevel === "WARNING"
              ? "bg-yellow-50/60 dark:bg-yellow-900/10"
              : "";

          return (
            <div
              key={item.appointmentId}
              className={`flex items-center gap-4 px-6 py-4 ${bgClass} hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors`}
            >
              {/* Queue # */}
              <div className="flex-shrink-0 w-12 h-12 bg-brand-100 dark:bg-brand-900/30 rounded-xl flex items-center justify-center">
                <span className="text-lg font-bold text-brand-600 dark:text-brand-400">
                  {item.isEmergency ? "\uD83D\uDEA8" : `#${item.queueNumber}`}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-800 dark:text-white truncate">
                    {item.patientName ?? "Unknown"}
                  </span>
                  {item.age != null && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">{item.age}y</span>
                  )}
                  {item.isEmergency && (
                    <Badge variant="solid" color="error" size="sm">Emergency</Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>Appt: {fmtSlot(item.appointmentTime)}</span>
                  {item.checkedInAt && (
                    <span>Check-in: {fmtSlot(item.checkedInAt.substring(11))}</span>
                  )}
                  <span className={`font-medium ${
                    item.waitLevel === "CRITICAL" ? "text-red-600 dark:text-red-400" :
                    item.waitLevel === "WARNING" ? "text-yellow-600 dark:text-yellow-400" :
                    "text-gray-600 dark:text-gray-300"
                  }`}>
                    Wait: {item.waitMinutes}m
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => onCall(item.appointmentId)}
                  disabled={!!actionLoading || hasCurrentPatient}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title={hasCurrentPatient ? "Complete current consultation first" : "Call this patient"}
                >
                  Call
                </button>
                <button
                  onClick={() => onSkip(item.appointmentId)}
                  disabled={!!actionLoading}
                  className="px-3 py-1.5 text-xs font-medium text-yellow-700 bg-yellow-100 rounded-lg hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-900/50 disabled:opacity-50 transition-colors"
                >
                  Skip
                </button>
                <button
                  onClick={() => onNoShow(item.appointmentId)}
                  disabled={!!actionLoading}
                  className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 disabled:opacity-50 transition-colors"
                >
                  No-show
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- Timeline View ----
function TimelineView({
  items,
  filter,
  onFilterChange,
}: {
  items: TimelineItem[];
  filter: string | null;
  onFilterChange: (f: string | null) => void;
}) {
  const filterPills = [
    { key: null, label: "All" },
    { key: "NOT_CHECKED_IN", label: "Not Checked In", color: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300" },
    { key: "CHECKED_IN", label: "Waiting", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
    { key: "IN_PROGRESS", label: "In Progress", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    { key: "COMPLETED", label: "Completed", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    { key: "NO_SHOW", label: "No-Show", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
    { key: "NEEDS_FOLLOWUP", label: "Needs Follow-up", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  ] as const;

  const filteredItems = items.filter((item) => {
    if (!filter) return true;
    if (filter === "NOT_CHECKED_IN") return item.status === "CONFIRMED" || item.status === "PENDING";
    if (filter === "NEEDS_FOLLOWUP") return item.needsFollowUp;
    return item.status === filter;
  });

  // Group by hour
  const grouped: Record<string, TimelineItem[]> = {};
  filteredItems.forEach((item) => {
    const hour = item.startTime.substring(0, 2) + ":00";
    if (!grouped[hour]) grouped[hour] = [];
    grouped[hour].push(item);
  });

  const hours = Object.keys(grouped).sort();

  const now = new Date();
  const nowStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const statusColors: Record<string, string> = {
    green: "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700",
    blue: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-700",
    yellow: "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-700",
    indigo: "bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-700",
    red: "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700",
    orange: "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-700",
    gray: "bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600",
  };

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Today&apos;s Timeline</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">Current time: {nowStr}</span>
        </div>
        {/* Filter pills */}
        <div className="flex flex-wrap gap-2">
          {filterPills.map((pill) => (
            <button
              key={pill.key ?? "all"}
              onClick={() => onFilterChange(pill.key)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                filter === pill.key
                  ? "bg-brand-500 text-white shadow-sm"
                  : pill.key === null
                  ? "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  : `${pill.color} hover:opacity-80`
              }`}
            >
              {pill.label}
              {pill.key && (
                <span className="ml-1 font-bold">
                  {pill.key === "NOT_CHECKED_IN"
                    ? items.filter((i) => i.status === "CONFIRMED" || i.status === "PENDING").length
                    : pill.key === "NEEDS_FOLLOWUP"
                    ? items.filter((i) => i.needsFollowUp).length
                    : items.filter((i) => i.status === pill.key).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-gray-400 dark:text-gray-500 text-lg">
            {items.length === 0 ? "No appointments scheduled for today" : "No appointments match this filter"}
          </p>
        </div>
      ) : (
        <div className="relative">
          {hours.map((hour) => {
            const hourItems = grouped[hour];
            const hourNum = parseInt(hour);
            const nowHour = now.getHours();
            const isPastHour = hourNum < nowHour;
            const isCurrentHour = hourNum === nowHour;

            return (
              <div key={hour} className="relative">
                <div
                  className={`flex items-center gap-4 px-6 py-3 border-b border-gray-100 dark:border-gray-800 ${
                    isCurrentHour
                      ? "bg-brand-50 dark:bg-brand-900/10"
                      : isPastHour
                      ? "bg-gray-50/50 dark:bg-gray-900/30"
                      : ""
                  }`}
                >
                  <div className="relative">
                    <span
                      className={`text-sm font-bold w-14 text-center inline-block ${
                        isCurrentHour
                          ? "text-brand-600 dark:text-brand-400"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {hour}
                    </span>
                    {isCurrentHour && (
                      <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
                    )}
                  </div>

                  <div className="flex-1 flex flex-wrap gap-2">
                    {hourItems.map((item) => (
                      <div
                        key={item.appointmentId}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                          item.isNextSlot
                            ? "ring-2 ring-brand-400 dark:ring-brand-500 shadow-md"
                            : ""
                        } ${statusColors[item.statusColor] || statusColors.gray} ${
                          item.isCurrentSlot ? "shadow-md" : ""
                        }`}
                      >
                        {item.queueNumber && (
                          <span className="text-sm font-bold opacity-70">#{item.queueNumber}</span>
                        )}
                        <span className="text-xs font-mono opacity-70">
                          {fmtSlot(item.startTime)}&ndash;{fmtSlot(item.endTime)}
                        </span>
                        <span className="font-medium text-sm truncate max-w-[160px]">
                          {item.patientName ?? "Unknown"}
                        </span>
                        {item.age != null && (
                          <span className="text-xs opacity-60">{item.age}y</span>
                        )}
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            item.status === "COMPLETED"
                              ? "bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200"
                              : item.status === "IN_PROGRESS"
                              ? "bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200"
                              : item.status === "CHECKED_IN"
                              ? "bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200"
                              : item.status === "NO_SHOW"
                              ? "bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200"
                              : "bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-200"
                          }`}
                        >
                          {item.statusLabel}
                        </span>
                        {item.needsFollowUp && (
                          <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase">
                            Follow-up
                          </span>
                        )}
                        {item.isNextSlot && (
                          <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase">
                            Next &#x27A4;
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---- Generic Reason Modal (used for Skip + No-show) ----
function ReasonModal({
  title,
  description,
  confirmLabel,
  confirmColor,
  onCancel,
  onConfirm,
  reason,
  setReason,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  confirmColor: string;
  onCancel: () => void;
  onConfirm: () => void;
  reason: string;
  setReason: (r: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          {title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          {description}
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Enter reason..."
          rows={3}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
        />
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!reason.trim()}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${confirmColor}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
