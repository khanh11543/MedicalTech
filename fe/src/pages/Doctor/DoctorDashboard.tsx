import { useEffect, useState, useCallback } from "react";
import PageMeta from "../../components/common/PageMeta";
import Badge from "../../components/ui/badge/Badge";
import { DashboardSkeleton } from "../../components/ui/skeleton/Skeleton";
import {
  getDoctorDashboard,
  DoctorDashboard as DoctorDashboardData,
} from "../../services/doctorService";

// ============ Helper: format time "HH:mm:ss" → "HH:mm" ============
function fmtTime(t: string | null | undefined): string {
  if (!t) return "—";
  return t.length >= 5 ? t.substring(0, 5) : t;
}

// ============ Relative time helper ============
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

// ============ Live elapsed timer hook ============
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

// ============ Notification type → icon mapping ============
function notifIcon(type: string): string {
  switch (type?.toLowerCase()) {
    case "appointment": return "📅";
    case "reminder": return "⏰";
    case "system": return "🔧";
    case "payment": return "💳";
    case "review": return "⭐";
    default: return "🔔";
  }
}

export default function DoctorDashboard() {
  const [data, setData] = useState<DoctorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    // Auto-refresh every 60s
    const interval = setInterval(fetchDashboard, 60000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const elapsedMinutes = useElapsedTimer(
    data?.inProgress?.startedAt,
    data?.inProgress?.isExamining ?? false
  );

  // ========== Loading state ==========
  if (loading && !data) {
    return (
      <>
        <PageMeta title="Dashboard | Doctor" description="Workday overview" />
        <DashboardSkeleton />
      </>
    );
  }

  // ========== Error state ==========
  if (error && !data) {
    return (
      <>
        <PageMeta title="Dashboard | Doctor" description="Workday overview" />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="text-5xl">⚠️</div>
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

  const { todayAppointments: today, patientsWaiting, inProgress, upcoming, noShowRate, rating, nextPatient, notifications, unreadNotificationCount, quickActions } = data;

  return (
    <>
      <PageMeta title="Dashboard | Doctor" description="Workday overview" />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              Hello, Dr. {data.doctorName} 👋
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Today's workday overview
            </p>
          </div>
          <button
            onClick={fetchDashboard}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors disabled:opacity-50"
          >
            <svg className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* ==================== 6 CARDS ==================== */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-5">

          {/* ===== Card 1: Today's Appointments ===== */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/15">
                  <span className="text-xl">📅</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Today's Appointments</p>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{today.total}</h3>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {today.confirmed > 0 && <Badge color="info" size="sm">Confirmed: {today.confirmed}</Badge>}
              {today.checkedIn > 0 && <Badge color="warning" size="sm">Checked In: {today.checkedIn}</Badge>}
              {today.inProgress > 0 && <Badge color="primary" size="sm">In Progress: {today.inProgress}</Badge>}
              {today.completed > 0 && <Badge color="success" size="sm">Completed: {today.completed}</Badge>}
              {today.cancelled > 0 && <Badge color="error" size="sm">Cancelled: {today.cancelled}</Badge>}
              {today.noShow > 0 && <Badge color="dark" size="sm">No-show: {today.noShow}</Badge>}
              {today.pending > 0 && <Badge color="light" size="sm">Pending: {today.pending}</Badge>}
              {today.rescheduled > 0 && <Badge color="light" size="sm">Rescheduled: {today.rescheduled}</Badge>}
              {today.total === 0 && <span className="text-sm text-gray-400">No appointments today</span>}
            </div>
          </div>

          {/* ===== Card 2: Patients Waiting ===== */}
          <div className={`rounded-2xl border p-5 md:p-6 ${
            patientsWaiting.hasLongWaitAlert
              ? "border-red-300 bg-red-50/50 dark:border-red-500/30 dark:bg-red-500/5"
              : "border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                  patientsWaiting.hasLongWaitAlert
                    ? "bg-red-100 dark:bg-red-500/15"
                    : "bg-orange-50 dark:bg-orange-500/15"
                }`}>
                  <span className="text-xl">🕐</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Patients Waiting</p>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{patientsWaiting.waitingCount}</h3>
                </div>
              </div>
              {patientsWaiting.hasLongWaitAlert && (
                <div className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-500/20 rounded-full animate-pulse">
                  <span className="text-xs">🔴</span>
                  <span className="text-xs font-medium text-red-600 dark:text-red-400">
                    {patientsWaiting.longWaitCount} waiting &gt;30m
                  </span>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Avg. wait</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {patientsWaiting.waitingCount > 0 ? `${patientsWaiting.avgWaitTimeMinutes} min` : "—"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Longest</span>
                <span className={`font-medium ${
                  patientsWaiting.maxWaitTimeMinutes > 30
                    ? "text-red-500"
                    : "text-gray-700 dark:text-gray-300"
                }`}>
                  {patientsWaiting.waitingCount > 0 ? `${patientsWaiting.maxWaitTimeMinutes} min` : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* ===== Card 3: In Progress ===== */}
          <div className={`rounded-2xl border p-5 md:p-6 ${
            inProgress.isExamining
              ? "border-green-300 bg-green-50/50 dark:border-green-500/30 dark:bg-green-500/5"
              : "border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                  inProgress.isExamining
                    ? "bg-green-100 dark:bg-green-500/15"
                    : "bg-gray-100 dark:bg-gray-500/15"
                }`}>
                  <span className="text-xl">{inProgress.isExamining ? "🩺" : "💤"}</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">In Progress</p>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                    {inProgress.isExamining ? "1" : "0"}<span className="text-base font-normal text-gray-400">/1</span>
                  </h3>
                </div>
              </div>
              {inProgress.isExamining && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-100 dark:bg-green-500/20 rounded-full">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-xs font-semibold text-green-700 dark:text-green-400">
                    {elapsedMinutes} min
                  </span>
                </div>
              )}
            </div>
            {inProgress.isExamining ? (
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Patient</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{inProgress.currentPatientName || "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Scheduled</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {fmtTime(inProgress.scheduledStartTime)} – {fmtTime(inProgress.scheduledEndTime)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Started at</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{fmtTime(inProgress.startedAt)}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500">No patient currently being examined</p>
            )}
          </div>

          {/* ===== Card 4: Upcoming (Next 2 hours) ===== */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-500/15">
                  <span className="text-xl">⏰</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Upcoming (2h)</p>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{upcoming.count}</h3>
                </div>
              </div>
            </div>
            {upcoming.nextAppointment ? (
              <div className="p-3 rounded-xl bg-purple-50/50 dark:bg-purple-500/5 border border-purple-100 dark:border-purple-500/10">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Next up</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {upcoming.nextAppointment.patientName}
                  </span>
                  <Badge color="primary" size="sm">
                    {fmtTime(upcoming.nextAppointment.startTime)}
                  </Badge>
                </div>
                {upcoming.nextAppointment.queueNumber && (
                  <p className="text-xs text-gray-400 mt-1">Queue: #{upcoming.nextAppointment.queueNumber}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500">No appointments in the next 2 hours</p>
            )}
          </div>

          {/* ===== Card 5: No-show Rate ===== */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                  noShowRate.noShowRatePercent > 20
                    ? "bg-red-50 dark:bg-red-500/15"
                    : "bg-sky-50 dark:bg-sky-500/15"
                }`}>
                  <span className="text-xl">📊</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">No-show Rate (Week)</p>
                  <h3 className={`text-2xl font-bold ${
                    noShowRate.noShowRatePercent > 20
                      ? "text-red-500"
                      : "text-gray-800 dark:text-white"
                  }`}>
                    {noShowRate.noShowRatePercent}%
                  </h3>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">No-shows</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">{noShowRate.noShowCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Total this week</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">{noShowRate.totalWeekAppointments} appts</span>
              </div>
              {/* Progress bar */}
              <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-700">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    noShowRate.noShowRatePercent > 20 ? "bg-red-500" : noShowRate.noShowRatePercent > 10 ? "bg-orange-400" : "bg-green-500"
                  }`}
                  style={{ width: `${Math.min(noShowRate.noShowRatePercent, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* ===== Card 6: Rating ===== */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-50 dark:bg-yellow-500/15">
                  <span className="text-xl">⭐</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Rating</p>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                    {rating.averageRating > 0 ? Number(rating.averageRating).toFixed(1) : "—"}
                    <span className="text-base font-normal text-gray-400">/5</span>
                  </h3>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              {/* Star display */}
              <div className="flex items-center gap-0.5 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(rating.averageRating)
                        ? "text-yellow-400"
                        : "text-gray-200 dark:text-gray-600"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Total reviews</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">{rating.totalReviews}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">This month</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">{rating.recentReviewsCount}</span>
              </div>
            </div>
          </div>

        </div>

        {/* ==================== SECOND ROW: Next Patient + Notifications + Quick Actions ==================== */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 md:gap-5">

          {/* ===== Next Patient Panel ===== */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-500/15">
                <span className="text-xl">👤</span>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Next Patient</p>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                  {nextPatient ? nextPatient.patientName || "Unknown" : "No one in queue"}
                </h3>
              </div>
            </div>
            {nextPatient ? (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {nextPatient.age != null && (
                    <Badge color="light" size="sm">{nextPatient.age} yrs</Badge>
                  )}
                  {nextPatient.gender && (
                    <Badge color="light" size="sm">{nextPatient.gender}</Badge>
                  )}
                  {nextPatient.queueNumber != null && (
                    <Badge color="info" size="sm">Queue #{nextPatient.queueNumber}</Badge>
                  )}
                  <Badge color="warning" size="sm">{nextPatient.status}</Badge>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Appointment</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300 font-mono text-xs">
                      {nextPatient.appointmentCode || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Time</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {fmtTime(nextPatient.startTime)} – {fmtTime(nextPatient.endTime)}
                    </span>
                  </div>
                  {nextPatient.reasonForVisit && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Reason</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300 text-right max-w-[60%] truncate">
                        {nextPatient.reasonForVisit}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500">
                No checked-in patients waiting in queue.
              </p>
            )}
          </div>

          {/* ===== Notifications Panel (Last 5) ===== */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/15">
                  <span className="text-xl">🔔</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Notifications</p>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                    {notifications?.length || 0} recent
                  </h3>
                </div>
              </div>
              {unreadNotificationCount > 0 && (
                <span className="flex items-center justify-center min-w-[24px] h-6 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full">
                  {unreadNotificationCount}
                </span>
              )}
            </div>
            {notifications && notifications.length > 0 ? (
              <div className="space-y-2.5 max-h-[240px] overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl transition-colors ${
                      n.isRead
                        ? "bg-gray-50/50 dark:bg-white/[0.02]"
                        : "bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/10"
                    }`}
                  >
                    <span className="text-base mt-0.5 shrink-0">{notifIcon(n.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm truncate ${
                          n.isRead
                            ? "text-gray-600 dark:text-gray-400"
                            : "font-semibold text-gray-800 dark:text-white"
                        }`}>
                          {n.title}
                        </p>
                        {!n.isRead && (
                          <span className="shrink-0 h-2 w-2 rounded-full bg-indigo-500" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{n.message}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500">No recent notifications.</p>
            )}
          </div>

          {/* ===== Quick Actions ===== */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-500/15">
                <span className="text-xl">⚡</span>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Quick Actions</p>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Shortcuts</h3>
              </div>
            </div>
            <div className="space-y-2.5">
              <button className="w-full flex items-center justify-between p-3 rounded-xl bg-brand-50 dark:bg-brand-500/10 border border-brand-100 dark:border-brand-500/20 hover:bg-brand-100 dark:hover:bg-brand-500/20 transition-colors group">
                <div className="flex items-center gap-3">
                  <span className="text-lg">📋</span>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">View Today's Schedule</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{quickActions.todayTotal} appointments</p>
                  </div>
                </div>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-brand-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button className="w-full flex items-center justify-between p-3 rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-colors group">
                <div className="flex items-center gap-3">
                  <span className="text-lg">✅</span>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Pending Confirmations</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{quickActions.pendingConfirmations} awaiting</p>
                  </div>
                </div>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-orange-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button className="w-full flex items-center justify-between p-3 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 hover:bg-green-100 dark:hover:bg-green-500/20 transition-colors group">
                <div className="flex items-center gap-3">
                  <span className="text-lg">🏥</span>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Patient Queue</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{quickActions.checkedInCount} checked in</p>
                  </div>
                </div>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-green-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

        </div>

        {/* ==================== Footer: Generated at ==================== */}
        <p className="text-xs text-gray-400 dark:text-gray-500 text-right">
          Updated at: {data.generatedAt ? new Date(data.generatedAt).toLocaleTimeString("en-US") : "—"}
          {" · "}Auto-refresh every 60 seconds
        </p>
      </div>
    </>
  );
}
