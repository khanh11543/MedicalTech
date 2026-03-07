import { useEffect, useState, useCallback, useRef } from "react";
import PageMeta from "../../components/common/PageMeta";
import { DashboardSkeleton } from "../../components/ui/skeleton/Skeleton";
import receptionistService from "../../services/receptionistService";
import type {
  ReceptionistDashboardStatsDTO,
  DoctorQueueStatusDTO,
  UpcomingAppointmentDTO,
  PendingActionsDTO,
  DashboardPreferencesDTO,
} from "../../services/receptionistService";
import StatisticsCards from "./Dashboard/StatisticsCards";
import QueueStatusSection from "./Dashboard/QueueStatusSection";
import QuickActionsPanel from "./Dashboard/QuickActionsPanel";
import UpcomingAppointments from "./Dashboard/UpcomingAppointments";
import PendingActionsSection from "./Dashboard/PendingActionsSection";
import RecentNotifications from "./Dashboard/RecentNotifications";
import DashboardSettings from "./Dashboard/DashboardSettings";

const DEFAULT_PREFS: DashboardPreferencesDTO = {
  showAppointmentStats: true,
  showQueueStatus: true,
  showPaymentSummary: true,
  showUpcomingAppointments: true,
  showPendingActions: true,
  showNoShowAlerts: true,
  upcomingAppointmentsLimit: 5,
  refreshIntervalSeconds: 30,
  defaultDateRange: "TODAY",
};

const EMPTY_STATS: ReceptionistDashboardStatsDTO = {
  todayTotalAppointments: 0,
  pendingAppointments: 0,
  confirmedAppointments: 0,
  completedAppointments: 0,
  cancelledAppointments: 0,
  checkedInCount: 0,
  awaitingCheckIn: 0,
  inProgressCount: 0,
  totalInQueue: 0,
  activeDoctors: 0,
  avgWaitTimeMinutes: 0,
  noShowCount: 0,
  overdueCount: 0,
  todayRevenue: 0,
  pendingPayments: 0,
  pendingPaymentAmount: 0,
  completedPayments: 0,
};

const EMPTY_PENDING: PendingActionsDTO = {
  needConfirmation: 0,
  awaitingCheckIn: 0,
  overdueAppointments: 0,
  pendingPayments: 0,
  inQueueCount: 0,
  noShowCandidates: 0,
};

export default function ReceptionistDashboard() {
  const [stats, setStats] = useState<ReceptionistDashboardStatsDTO>(EMPTY_STATS);
  const [queueData, setQueueData] = useState<DoctorQueueStatusDTO[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingAppointmentDTO[]>([]);
  const [pendingActions, setPendingActions] = useState<PendingActionsDTO>(EMPTY_PENDING);
  const [preferences, setPreferences] = useState<DashboardPreferencesDTO>(DEFAULT_PREFS);

  const [loading, setLoading] = useState(true);
  const [upcomingLoading, setUpcomingLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [showSettings, setShowSettings] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const [statsData, queueDataRes, upcomingData, pendingData] = await Promise.all([
        receptionistService.getDashboardStatsV2().catch(() => EMPTY_STATS),
        receptionistService.getQueueStatus().catch(() => [] as DoctorQueueStatusDTO[]),
        receptionistService.getTodayUpcoming(preferences.upcomingAppointmentsLimit).catch(() => [] as UpcomingAppointmentDTO[]),
        receptionistService.getPendingActions().catch(() => EMPTY_PENDING),
      ]);

      setStats(statsData);
      setQueueData(queueDataRes);
      setUpcoming(upcomingData);
      setPendingActions(pendingData);
      setLastRefresh(new Date());
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
      setUpcomingLoading(false);
    }
  }, [preferences.upcomingAppointmentsLimit]);

  // Load preferences then data
  useEffect(() => {
    const init = async () => {
      try {
        const prefs = await receptionistService.getPreferences();
        setPreferences(prefs);
      } catch {
        // Use defaults
      }
      fetchDashboardData(true);
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh polling
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      fetchDashboardData(false);
    }, preferences.refreshIntervalSeconds * 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [preferences.refreshIntervalSeconds, fetchDashboardData]);

  const handlePreferencesSave = (newPrefs: DashboardPreferencesDTO) => {
    setPreferences(newPrefs);
    fetchDashboardData(false);
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <>
      <PageMeta
        title="Receptionist Dashboard | MediTech"
        description="Receptionist dashboard - Activity overview"
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Receptionist Dashboard
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Last refresh indicator */}
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Updated {lastRefresh.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </span>

            {/* Settings toggle */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>

            {/* Refresh button */}
            <button
              onClick={() => fetchDashboardData(false)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Settings panel (collapsible) */}
        {showSettings && (
          <DashboardSettings
            preferences={preferences}
            onSave={handlePreferencesSave}
          />
        )}

        {/* 1. Statistics Cards */}
        {preferences.showAppointmentStats && (
          <StatisticsCards stats={stats} />
        )}

        {/* 2. Current Queue Status */}
        {preferences.showQueueStatus && (
          <QueueStatusSection
            queueData={queueData}
            onRefresh={() => fetchDashboardData(false)}
          />
        )}

        {/* 3. Quick Actions */}
        <QuickActionsPanel />

        {/* Two-column layout for Upcoming + Pending */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* 4. Today's Upcoming */}
          {preferences.showUpcomingAppointments && (
            <UpcomingAppointments
              appointments={upcoming}
              loading={upcomingLoading}
            />
          )}

          {/* 5. Pending Actions */}
          {preferences.showPendingActions && (
            <PendingActionsSection actions={pendingActions} />
          )}
        </div>

        {/* 6. Recent Notifications */}
        <RecentNotifications />
      </div>
    </>
  );
}
