import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PageMeta from "../../components/common/PageMeta";
import Badge from "../../components/ui/badge/Badge";
import {
  getDoctorDashboard,
  DoctorDashboard as DoctorDashboardData,
  callPatient,
  callNextPatient,
  skipPatient,
} from "../../services/doctorService";

// ============ Helpers ============
function fmtTime(t: string | null | undefined): string {
  if (!t) return "—";
  return t.length >= 5 ? t.substring(0, 5) : t;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 18) return "Good Afternoon";
  return "Good Evening";
}

function useElapsedTimer(startedAt: string | null | undefined, isActive: boolean) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!isActive || !startedAt) {
      setElapsed(0);
      return;
    }
    const parts = startedAt.split(":").map(Number);
    const startMinutes = (parts[0] || 0) * 60 + (parts[1] || 0);
    const tick = () => {
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      setElapsed(Math.max(0, nowMinutes - startMinutes));
    };
    tick();
    const interval = setInterval(tick, 30000);
    return () => clearInterval(interval);
  }, [startedAt, isActive]);
  return elapsed;
}

// ============ SVG Icons (professional, no emoji) ============
const IconCalendar = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);
const IconUsers = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);
const IconActivity = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);
const IconClock = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const IconChart = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);
const IconStar = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);
const IconBell = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);
const IconChevronRight = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DoctorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [skipModal, setSkipModal] = useState(false);
  const [skipReason, setSkipReason] = useState("");

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getDoctorDashboard();
      setData(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load dashboard data";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 60000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const elapsedMinutes = useElapsedTimer(
    data?.inProgress?.startedAt,
    data?.inProgress?.isExamining ?? false
  );

  if (loading && !data) {
    return (
      <>
        <PageMeta title="Dashboard | Doctor" description="Workday overview" />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-500" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading data...</p>
          </div>
        </div>
      </>
    );
  }

  if (error && !data) {
    return (
      <>
        <PageMeta title="Dashboard | Doctor" description="Workday overview" />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <p className="text-red-500 dark:text-red-400 font-medium">{error}</p>
            <button
              onClick={fetchDashboard}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!data) return null;

  const {
    todayAppointments: today,
    patientsWaiting,
    inProgress,
    upcoming,
    noShowRate,
    rating,
    nextPatient,
    notifications,
    unreadNotificationCount,
    quickActions,
  } = data;

  const greeting = getGreeting();
  const welcomeStat =
    patientsWaiting.waitingCount > 0
      ? `There are ${patientsWaiting.waitingCount} patient${patientsWaiting.waitingCount === 1 ? "" : "s"} waiting for you today.`
      : today.total > 0
        ? `You have ${today.total} appointment${today.total === 1 ? "" : "s"} today.`
        : "You have no appointments scheduled for today.";

  return (
    <>
      <PageMeta title="Dashboard | Doctor" description="Workday overview" />
      <div className="space-y-6">
        {/* ---------- Welcome banner (Mediczen style) ---------- */}
        <div className="rounded-xl border border-gray-200 bg-gradient-to-r from-slate-50 to-white px-6 py-5 dark:border-gray-700 dark:from-gray-800/80 dark:to-gray-900/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
                {greeting}, Dr. {data.doctorName}!
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {welcomeStat}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <span className="font-medium text-gray-500 dark:text-gray-400">Room:</span>
                <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2 py-0.5 font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                  {data.roomNumber || "Not assigned"}
                </span>
                {data.roomName && (
                  <span className="text-gray-500 dark:text-gray-400">
                    ({data.roomName})
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {data.generatedAt ? new Date(data.generatedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—"}
              </span>
              <button
                onClick={fetchDashboard}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <svg className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* ---------- Top row: 3 summary cards (Beds/Doctors style) ---------- */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <button
            onClick={() => navigate("/doctor/today")}
            className="group flex items-center justify-between rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-all hover:border-brand-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800/50 dark:hover:border-brand-600"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                <IconCalendar className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Today&apos;s Appointments</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{today.total}</p>
              </div>
            </div>
            <IconChevronRight className="h-5 w-5 text-gray-300 transition-colors group-hover:text-brand-500 dark:text-gray-500" />
          </button>

          <button
            onClick={() => navigate("/doctor/today")}
            className={`group flex items-center justify-between rounded-xl border p-5 text-left shadow-sm transition-all hover:shadow-md ${
              patientsWaiting.hasLongWaitAlert
                ? "border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-500/5"
                : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/50 hover:border-brand-300 dark:hover:border-brand-600"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                patientsWaiting.hasLongWaitAlert ? "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400" : "bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
              }`}>
                <IconUsers className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Patients Waiting</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{patientsWaiting.waitingCount}</p>
                {patientsWaiting.waitingCount > 0 && (
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    Avg. wait {patientsWaiting.avgWaitTimeMinutes} min
                  </p>
                )}
              </div>
            </div>
            <IconChevronRight className="h-5 w-5 text-gray-300 transition-colors group-hover:text-brand-500 dark:text-gray-500" />
          </button>

          <button
            onClick={() => navigate(inProgress.isExamining ? "/doctor/consultation" : "/doctor/today")}
            className={`group flex items-center justify-between rounded-xl border p-5 text-left shadow-sm transition-all hover:shadow-md ${
              inProgress.isExamining
                ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-500/5"
                : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/50 hover:border-brand-300 dark:hover:border-brand-600"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                inProgress.isExamining ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-gray-100 text-gray-500 dark:bg-gray-600 dark:text-gray-400"
              }`}>
                <IconActivity className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">In Progress</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {inProgress.isExamining ? "1" : "0"}
                  <span className="text-sm font-normal text-gray-400">/1</span>
                </p>
                {inProgress.isExamining && (
                  <p className="mt-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">{elapsedMinutes} min</p>
                )}
              </div>
            </div>
            <IconChevronRight className="h-5 w-5 text-gray-300 transition-colors group-hover:text-brand-500 dark:text-gray-500" />
          </button>
        </div>

        {/* ---------- Two columns: Patient table + Notifications ---------- */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* PATIENT — table style */}
          <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800/50">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-700">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Patient</h2>
                <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-300">Your queue and next patients today</p>
              </div>
              <button
                onClick={() => navigate("/doctor/today")}
                className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
              >
                See All
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-400">
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Queue No.</th>
                    <th className="px-5 py-3">Priority</th>
                    <th className="px-5 py-3">Time</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {nextPatient ? (
                    <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                      <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">{nextPatient.patientName || "—"}</td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-300">#{nextPatient.queueNumber ?? "—"}</td>
                      <td className="px-5 py-3">
                        <Badge color="warning" size="sm">{nextPatient.status}</Badge>
                      </td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-300">
                        {fmtTime(nextPatient.startTime)} – {fmtTime(nextPatient.endTime)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            disabled={!!actionLoading || inProgress.isExamining}
                            onClick={async (e) => {
                              e.stopPropagation();
                              setActionLoading("start");
                              try {
                                await callPatient(nextPatient.appointmentId);
                                await fetchDashboard();
                                navigate("/doctor/consultation");
                              } catch {}
                              setActionLoading(null);
                            }}
                            className="rounded-lg bg-brand-500 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                          >
                            {actionLoading === "start" ? "..." : "Start"}
                          </button>
                          <button
                            disabled={!!actionLoading || inProgress.isExamining}
                            onClick={async (e) => {
                              e.stopPropagation();
                              setActionLoading("call");
                              try {
                                await callNextPatient();
                                await fetchDashboard();
                              } catch {}
                              setActionLoading(null);
                            }}
                            className="rounded-lg border border-brand-500 bg-white px-2.5 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50 disabled:opacity-50 dark:bg-gray-800 dark:text-brand-400 dark:hover:bg-gray-700"
                          >
                            Call
                          </button>
                          <button
                            disabled={!!actionLoading}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSkipModal(true);
                              setSkipReason("");
                            }}
                            className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                          >
                            Skip
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                  {!nextPatient && upcoming.nextAppointment && (
                    <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                      <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">{upcoming.nextAppointment.patientName}</td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-300">#{upcoming.nextAppointment.queueNumber ?? "—"}</td>
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400">Upcoming</td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{fmtTime(upcoming.nextAppointment.startTime)}</td>
                      <td className="px-5 py-3 text-right">—</td>
                    </tr>
                  )}
                  {!nextPatient && !upcoming.nextAppointment && (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                        No patients in queue. Check back later or view today&apos;s schedule.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* NOTIFICATIONS */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800/50">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                  <IconBell className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Notifications</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{notifications?.length ?? 0} recent</p>
                </div>
              </div>
              {unreadNotificationCount > 0 && (
                <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                  {unreadNotificationCount}
                </span>
              )}
            </div>
            <div className="max-h-[280px] overflow-y-auto p-3">
              {notifications && notifications.length > 0 ? (
                <ul className="space-y-2">
                  {notifications.map((n) => (
                    <li
                      key={n.id}
                      className={`rounded-lg border px-3 py-2.5 text-sm ${
                        n.isRead
                          ? "border-transparent bg-gray-50/80 dark:bg-gray-700/30"
                          : "border-indigo-100 bg-indigo-50/50 dark:border-indigo-900/30 dark:bg-indigo-500/10"
                      }`}
                    >
                      <p className={`font-medium ${n.isRead ? "text-gray-600 dark:text-gray-400" : "text-gray-900 dark:text-white"}`}>{n.title}</p>
                      <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">{n.message}</p>
                      <p className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">{timeAgo(n.createdAt)}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">No recent notifications.</p>
              )}
            </div>
            <div className="border-t border-gray-100 p-3 dark:border-gray-700">
              <button
                onClick={() => navigate("/doctor/notifications")}
                className="w-full rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                View All Notifications
              </button>
            </div>
          </div>
        </div>

        {/* ---------- Second row: Stats + Quick actions ---------- */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button
            onClick={() => navigate("/doctor/today")}
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-all hover:border-brand-300 hover:shadow dark:border-gray-700 dark:bg-gray-800/50 dark:hover:border-brand-600"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400">
              <IconClock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Upcoming (2h)</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{upcoming.count}</p>
            </div>
          </button>

          <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/50">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${noShowRate.noShowRatePercent > 20 ? "bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-red-400" : "bg-sky-50 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400"}`}>
              <IconChart className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">No-show (week)</p>
              <p className={`text-xl font-bold ${noShowRate.noShowRatePercent > 20 ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-white"}`}>
                {noShowRate.noShowRatePercent}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{noShowRate.totalWeekAppointments} appts</p>
            </div>
          </div>

          <button
            onClick={() => navigate("/doctor/reviews")}
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-all hover:border-brand-300 hover:shadow dark:border-gray-700 dark:bg-gray-800/50 dark:hover:border-brand-600"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
              <IconStar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Rating</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {rating.averageRating > 0 ? Number(rating.averageRating).toFixed(1) : "—"}/5
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{rating.totalReviews} reviews</p>
            </div>
          </button>

          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/50">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Quick Actions</p>
            <div className="space-y-2">
              <button
                onClick={() => navigate("/doctor/today")}
                className="flex w-full items-center justify-between rounded-lg border border-gray-100 bg-gray-50/80 py-2.5 px-3 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-brand-50 hover:border-brand-100 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-300 dark:hover:bg-brand-500/10 dark:hover:border-brand-500/20"
              >
                <span>Today&apos;s Schedule</span>
                <span className="text-xs text-gray-500">{quickActions.todayTotal} appts</span>
              </button>
              <button
                onClick={() => navigate("/doctor/appointments")}
                className="flex w-full items-center justify-between rounded-lg border border-gray-100 bg-gray-50/80 py-2.5 px-3 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-brand-50 hover:border-brand-100 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-300 dark:hover:bg-brand-500/10 dark:hover:border-brand-500/20"
              >
                <span>Pending Confirmations</span>
                <span className="text-xs text-gray-500">{quickActions.pendingConfirmations}</span>
              </button>
              <button
                onClick={() => navigate("/doctor/today")}
                className="flex w-full items-center justify-between rounded-lg border border-gray-100 bg-gray-50/80 py-2.5 px-3 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-brand-50 hover:border-brand-100 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-300 dark:hover:bg-brand-500/10 dark:hover:border-brand-500/20"
              >
                <span>Patient Queue</span>
                <span className="text-xs text-gray-500">{quickActions.checkedInCount} checked in</span>
              </button>
            </div>
          </div>
        </div>

        <p className="text-right text-xs text-gray-400 dark:text-gray-500">
          Updated {data.generatedAt ? new Date(data.generatedAt).toLocaleTimeString("en-US") : "—"} · Auto-refresh every 60s
        </p>
      </div>

      {/* Skip Modal */}
      {skipModal && nextPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">Skip Patient</h3>
            <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">
              Skip <strong>{nextPatient.patientName}</strong> (Queue #{nextPatient.queueNumber})
            </p>
            <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">A reason is required. This action will be recorded in the audit log.</p>
            <textarea
              value={skipReason}
              onChange={(e) => setSkipReason(e.target.value)}
              placeholder="Enter reason for skipping..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setSkipModal(false)}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                disabled={!skipReason.trim() || !!actionLoading}
                onClick={async () => {
                  setActionLoading("skip");
                  try {
                    await skipPatient(nextPatient.appointmentId, skipReason.trim());
                    setSkipModal(false);
                    await fetchDashboard();
                  } catch {}
                  setActionLoading(null);
                }}
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === "skip" ? "Skipping..." : "Confirm Skip"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
