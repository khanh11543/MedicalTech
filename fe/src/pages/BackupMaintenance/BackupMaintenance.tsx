import { useCallback, useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import adminService from "../../services/adminService";

interface BackupRecord {
  id: string;
  name: string;
  type: "FULL" | "INCREMENTAL" | "DIFFERENTIAL";
  status: "COMPLETED" | "IN_PROGRESS" | "FAILED" | "SCHEDULED";
  size: string;
  createdAt: string;
  duration: string;
}

interface SystemInfo {
  dbSize: string;
  totalUsers: number;
  totalRecords: number;
  lastBackup: string;
  serverUptime: string;
  diskUsage: number;
  memoryUsage: number;
  cpuUsage: number;
}

const INITIAL_BACKUPS: BackupRecord[] = [
  { id: "1", name: "Full Backup - Feb 22, 2026", type: "FULL", status: "COMPLETED", size: "2.3 GB", createdAt: "2026-02-22T03:00:00", duration: "12m 34s" },
  { id: "2", name: "Incremental Backup - Feb 21, 2026", type: "INCREMENTAL", status: "COMPLETED", size: "156 MB", createdAt: "2026-02-21T03:00:00", duration: "2m 15s" },
  { id: "3", name: "Full Backup - Feb 15, 2026", type: "FULL", status: "COMPLETED", size: "2.1 GB", createdAt: "2026-02-15T03:00:00", duration: "11m 48s" },
  { id: "4", name: "Differential Backup - Feb 18, 2026", type: "DIFFERENTIAL", status: "COMPLETED", size: "540 MB", createdAt: "2026-02-18T03:00:00", duration: "5m 22s" },
  { id: "5", name: "Scheduled Backup - Feb 23, 2026", type: "FULL", status: "SCHEDULED", size: "-", createdAt: "2026-02-23T03:00:00", duration: "-" },
];

export default function BackupMaintenance() {
  const [activeTab, setActiveTab] = useState<"overview" | "backups" | "maintenance" | "logs">("overview");
  const [backups, setBackups] = useState<BackupRecord[]>(INITIAL_BACKUPS);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [maintenanceInProgress, setMaintenanceInProgress] = useState(false);
  const [maintenanceLogs, setMaintenanceLogs] = useState<string[]>([]);

  const typeColors: Record<string, string> = {
    FULL: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    INCREMENTAL: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
    DIFFERENTIAL: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  };

  const statusColors: Record<string, string> = {
    COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    IN_PROGRESS: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    FAILED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    SCHEDULED: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  };

  const fetchSystemInfo = useCallback(async () => {
    try {
      setLoading(true);
      const stats = await adminService.getDashboardStatistics();
      setSystemInfo({
        dbSize: "1.8 GB",
        totalUsers: stats.totalUsers,
        totalRecords: stats.totalAppointments + stats.totalUsers,
        lastBackup: "2026-02-22 03:00 AM",
        serverUptime: "15d 7h 23m",
        diskUsage: 42,
        memoryUsage: 63,
        cpuUsage: 18,
      });
    } catch {
      setSystemInfo({
        dbSize: "N/A", totalUsers: 0, totalRecords: 0, lastBackup: "N/A",
        serverUptime: "N/A", diskUsage: 0, memoryUsage: 0, cpuUsage: 0,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSystemInfo(); }, [fetchSystemInfo]);

  const handleStartBackup = async (type: "FULL" | "INCREMENTAL" | "DIFFERENTIAL") => {
    setBackupInProgress(true);
    setMaintenanceLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Starting ${type} backup...`]);
    await new Promise((r) => setTimeout(r, 3000));
    const newBackup: BackupRecord = {
      id: Date.now().toString(),
      name: `${type.charAt(0) + type.slice(1).toLowerCase()} Backup - ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
      type, status: "COMPLETED",
      size: type === "FULL" ? "2.4 GB" : type === "INCREMENTAL" ? "180 MB" : "620 MB",
      createdAt: new Date().toISOString(),
      duration: type === "FULL" ? "13m 12s" : type === "INCREMENTAL" ? "2m 45s" : "5m 50s",
    };
    setBackups((prev) => [newBackup, ...prev]);
    setMaintenanceLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${type} backup completed successfully.`]);
    setBackupInProgress(false);
  };

  const handleMaintenance = async (task: string) => {
    setMaintenanceInProgress(true);
    setMaintenanceLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Running: ${task}...`]);
    await new Promise((r) => setTimeout(r, 2000));
    setMaintenanceLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Done: ${task}.`]);
    setMaintenanceInProgress(false);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const tabs = [
    { key: "overview" as const, label: "Overview" },
    { key: "backups" as const, label: "Backups" },
    { key: "maintenance" as const, label: "Maintenance" },
    { key: "logs" as const, label: "Activity Logs" },
  ];

  const ProgressBar = ({ value, color }: { value: number; color: string }) => (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
      <div className={`h-3 rounded-full ${color}`} style={{ width: `${value}%` }} />
    </div>
  );

  return (
    <>
      <PageMeta title="Backup & Maintenance | MediTech Admin" description="Manage system backups and maintenance" />
      <PageBreadcrumb pageTitle="Backup & Maintenance" />

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex gap-4">
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${activeTab === tab.key
                ? "border-teal-500 text-teal-600 dark:text-teal-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"}`}
            >{tab.label}</button>
          ))}
        </nav>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-teal-500 border-t-transparent" />
        </div>
      ) : (
        <>
          {/* ====== OVERVIEW ====== */}
          {activeTab === "overview" && systemInfo && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: "Database Size", value: systemInfo.dbSize, icon: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4", color: "blue" },
                  { label: "Last Backup", value: systemInfo.lastBackup, icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", color: "green" },
                  { label: "Server Uptime", value: systemInfo.serverUptime, icon: "M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2", color: "purple" },
                  { label: "Total Records", value: systemInfo.totalRecords.toLocaleString(), icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10", color: "yellow" },
                ].map((card) => (
                  <div key={card.label} className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 bg-${card.color}-100 dark:bg-${card.color}-900/30 rounded-lg`}>
                        <svg className={`w-5 h-5 text-${card.color}-600 dark:text-${card.color}-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
                  </div>
                ))}
              </div>

              {/* System Resources */}
              <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">System Resources</h3>
                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Disk Usage</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{systemInfo.diskUsage}%</span>
                    </div>
                    <ProgressBar value={systemInfo.diskUsage} color="bg-blue-500" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Memory Usage</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{systemInfo.memoryUsage}%</span>
                    </div>
                    <ProgressBar value={systemInfo.memoryUsage} color="bg-yellow-500" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">CPU Usage</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{systemInfo.cpuUsage}%</span>
                    </div>
                    <ProgressBar value={systemInfo.cpuUsage} color="bg-green-500" />
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: "Full Backup", onClick: () => { setActiveTab("backups"); handleStartBackup("FULL"); }, icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4", color: "text-blue-500" },
                    { label: "Optimize DB", onClick: () => handleMaintenance("Database optimization"), icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z", color: "text-teal-500" },
                    { label: "Clear Cache", onClick: () => handleMaintenance("Clear application cache"), icon: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16", color: "text-orange-500" },
                    { label: "Health Check", onClick: () => handleMaintenance("System health check"), icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-green-500" },
                  ].map((action) => (
                    <button key={action.label} onClick={action.onClick} disabled={backupInProgress || maintenanceInProgress}
                      className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50">
                      <svg className={`w-5 h-5 ${action.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
                      </svg>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ====== BACKUPS ====== */}
          {activeTab === "backups" && (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-3">
                {(["FULL", "INCREMENTAL", "DIFFERENTIAL"] as const).map((type) => {
                  const colors = { FULL: "bg-blue-600 hover:bg-blue-700", INCREMENTAL: "bg-teal-600 hover:bg-teal-700", DIFFERENTIAL: "bg-purple-600 hover:bg-purple-700" };
                  return (
                    <button key={type} onClick={() => handleStartBackup(type)} disabled={backupInProgress}
                      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 transition-colors ${colors[type]}`}>
                      {backupInProgress && <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                      {type.charAt(0) + type.slice(1).toLowerCase()} Backup
                    </button>
                  );
                })}
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full table-auto">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                        {["Backup Name", "Type", "Status", "Size", "Duration", "Date", "Actions"].map((h) => (
                          <th key={h} className="px-5 py-3.5 text-left text-sm font-medium text-gray-700 dark:text-gray-300">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {backups.map((backup) => (
                        <tr key={backup.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/30">
                          <td className="px-5 py-4 text-sm font-medium text-gray-900 dark:text-white">{backup.name}</td>
                          <td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${typeColors[backup.type]}`}>{backup.type}</span></td>
                          <td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[backup.status]}`}>{backup.status.replace("_", " ")}</span></td>
                          <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">{backup.size}</td>
                          <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">{backup.duration}</td>
                          <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">{formatDate(backup.createdAt)}</td>
                          <td className="px-5 py-4">
                            {backup.status === "COMPLETED" && (
                              <div className="flex gap-2">
                                <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm font-medium"
                                  onClick={() => setMaintenanceLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Download started: ${backup.name}`])}>
                                  Download
                                </button>
                                <button className="text-red-600 hover:text-red-800 dark:text-red-400 text-sm font-medium"
                                  onClick={() => setBackups((prev) => prev.filter((b) => b.id !== backup.id))}>
                                  Delete
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Backup Schedule */}
              <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Backup Schedule</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {[
                    { label: "Full Backup", schedule: "Every Sunday at 3:00 AM" },
                    { label: "Incremental Backup", schedule: "Daily at 3:00 AM" },
                    { label: "Differential Backup", schedule: "Wednesday & Saturday at 3:00 AM" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">{item.label}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{item.schedule}</p>
                      <span className="mt-2 inline-flex rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-xs font-medium text-green-800 dark:text-green-400">Active</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ====== MAINTENANCE ====== */}
          {activeTab === "maintenance" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {[
                  {
                    title: "Database Maintenance",
                    items: [
                      { label: "Optimize Tables", desc: "Reclaim unused space and defragment data", task: "Optimize database tables" },
                      { label: "Analyze Tables", desc: "Update index statistics for better query performance", task: "Analyze database tables" },
                      { label: "Repair Tables", desc: "Check and repair corrupted tables", task: "Repair database tables" },
                      { label: "Flush Query Cache", desc: "Clear the database query cache", task: "Flush query cache" },
                    ],
                  },
                  {
                    title: "System Maintenance",
                    items: [
                      { label: "Clear Application Cache", desc: "Remove cached data to free memory", task: "Clear application cache" },
                      { label: "Clear Expired Sessions", desc: "Remove expired user sessions", task: "Clear expired sessions" },
                      { label: "Clean Temp Files", desc: "Delete temporary files from the server", task: "Clean temporary files" },
                      { label: "Rebuild Search Indexes", desc: "Regenerate search indexes for faster queries", task: "Rebuild search indexes" },
                    ],
                  },
                ].map((section) => (
                  <div key={section.title} className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{section.title}</h3>
                    <div className="space-y-3">
                      {section.items.map((item) => (
                        <div key={item.label} className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                          </div>
                          <button onClick={() => handleMaintenance(item.task)} disabled={maintenanceInProgress}
                            className="rounded bg-teal-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-600 disabled:opacity-50 transition-colors">
                            Run
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Scheduled Maintenance Table */}
              <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Scheduled Maintenance Windows</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        {["Task", "Schedule", "Last Run", "Status"].map((h) => (
                          <th key={h} className="py-3 px-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { task: "Database Optimization", schedule: "Weekly (Sunday 2:00 AM)", lastRun: "Feb 16, 2026" },
                        { task: "Log Rotation", schedule: "Daily (1:00 AM)", lastRun: "Feb 22, 2026" },
                        { task: "Session Cleanup", schedule: "Every 6 hours", lastRun: "Feb 22, 2026 12:00 PM" },
                        { task: "Index Rebuild", schedule: "Monthly (1st, 3:00 AM)", lastRun: "Feb 1, 2026" },
                      ].map((item) => (
                        <tr key={item.task} className="border-b border-gray-200 dark:border-gray-700">
                          <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{item.task}</td>
                          <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{item.schedule}</td>
                          <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{item.lastRun}</td>
                          <td className="py-3 px-4">
                            <span className="inline-flex rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-400">Completed</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ====== ACTIVITY LOGS ====== */}
          {activeTab === "logs" && (
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Activity Logs</h3>
                <button onClick={() => setMaintenanceLogs([])} className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 font-medium">Clear Logs</button>
              </div>
              {maintenanceLogs.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>No activity logs yet. Run a backup or maintenance task to see logs here.</p>
                </div>
              ) : (
                <div className="bg-gray-900 dark:bg-black rounded-lg p-4 font-mono text-sm max-h-96 overflow-y-auto">
                  {maintenanceLogs.map((log, index) => (
                    <div key={index} className={`py-0.5 ${log.includes("Done") ? "text-green-400" : log.includes("Starting") || log.includes("Running") ? "text-yellow-400" : "text-gray-300"}`}>
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}
