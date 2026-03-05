import { useState, useEffect } from "react";
import userSettingsService from "../../../services/userSettingsService";
import type { PrivacySettings, ActivityLogEntry } from "../../../services/userSettingsService";

export default function DataPrivacyTab() {
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({ sessionTimeoutMinutes: "30" });
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [logPage, setLogPage] = useState(0);
  const [logTotalPages, setLogTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    loadActivityLog(logPage);
  }, [logPage]);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [privacy, log] = await Promise.all([
        userSettingsService.getPrivacySettings(),
        userSettingsService.getActivityLog(0, 10),
      ]);
      setPrivacySettings(privacy);
      setActivityLog(log.content);
      setLogTotalPages(log.totalPages);
    } catch {
      // Use defaults
    } finally {
      setLoading(false);
    }
  };

  const loadActivityLog = async (page: number) => {
    try {
      const log = await userSettingsService.getActivityLog(page, 10);
      setActivityLog(log.content);
      setLogTotalPages(log.totalPages);
    } catch {
      // Ignore
    }
  };

  const handleSavePrivacy = async () => {
    try {
      setSaving(true);
      const data = await userSettingsService.updatePrivacySettings(privacySettings);
      setPrivacySettings(data);
      setMessage({ type: "success", text: "Privacy settings saved" });
      loadActivityLog(0);
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to save" });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleClearCache = async () => {
    try {
      setClearing("cache");
      await userSettingsService.clearCache();
      // Clear browser storage
      const keysToKeep = ["token", "refreshToken", "user"];
      const allKeys = Object.keys(localStorage);
      allKeys.forEach((key) => {
        if (!keysToKeep.some((k) => key.toLowerCase().includes(k))) {
          localStorage.removeItem(key);
        }
      });
      sessionStorage.clear();
      setMessage({ type: "success", text: "Cache cleared successfully" });
      loadActivityLog(0);
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to clear cache" });
    } finally {
      setClearing(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleClearSearchHistory = async () => {
    try {
      setClearing("search");
      await userSettingsService.clearSearchHistory();
      // Clear local search-related items
      const searchKeys = Object.keys(localStorage).filter(
        (k) => k.toLowerCase().includes("search") || k.toLowerCase().includes("recent") || k.toLowerCase().includes("history")
      );
      searchKeys.forEach((k) => localStorage.removeItem(k));
      setMessage({ type: "success", text: "Search history cleared" });
      loadActivityLog(0);
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to clear search history" });
    } finally {
      setClearing(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString("vi-VN");
    } catch {
      return dateStr;
    }
  };

  const getActivityIcon = (type: string) => {
    const icons: Record<string, string> = {
      LOGIN: "Login",
      LOGOUT: "Logout",
      PASSWORD_CHANGE: "Password",
      PROFILE_UPDATE: "Profile",
      SETTING_CHANGE: "Settings",
      APPOINTMENT_CREATE: "Appt",
      PAYMENT: "Payment",
    };
    return icons[type] || "Activity";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`rounded-lg p-3 text-sm ${message.type === "success" ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"}`}>
          {message.text}
        </div>
      )}

      {/* Session Timeout */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="mb-2 text-base font-medium text-gray-800 dark:text-white/90">Session Timeout</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Automatically log out after a period of inactivity. "Never" is not allowed for security compliance.
        </p>
        <div className="flex gap-3">
          {["15", "30", "60"].map((val) => (
            <button
              key={val}
              onClick={() => setPrivacySettings({ ...privacySettings, sessionTimeoutMinutes: val })}
              className={`rounded-lg border px-5 py-2.5 text-sm font-medium transition ${
                privacySettings.sessionTimeoutMinutes === val
                  ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400 dark:border-brand-400"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
              }`}
            >
              {val} min
            </button>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSavePrivacy}
            disabled={saving}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Clear Data */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="mb-4 text-base font-medium text-gray-800 dark:text-white/90">Clear Data</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Clear Cache</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Remove cached data to free up space and fix display issues</p>
            </div>
            <button
              onClick={handleClearCache}
              disabled={clearing === "cache"}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {clearing === "cache" ? "Clearing..." : "Clear Cache"}
            </button>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Clear Search History</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Remove all saved search queries and recent searches</p>
            </div>
            <button
              onClick={handleClearSearchHistory}
              disabled={clearing === "search"}
              className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              {clearing === "search" ? "Clearing..." : "Clear History"}
            </button>
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="mb-4 text-base font-medium text-gray-800 dark:text-white/90">My Activity Log</h3>

        {activityLog.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">No activity records found</p>
        ) : (
          <>
            <div className="space-y-2">
              {activityLog.map((log) => (
                <div key={log.id} className="flex items-start gap-3 rounded-lg border border-gray-100 p-3 dark:border-gray-800">
                  <span className="mt-0.5 text-lg">{getActivityIcon(log.activityType)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{log.activityType}</span>
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                        {log.resourceType}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 truncate">{log.description}</p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                      <span>{formatDate(log.createdAt)}</span>
                      {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                      {log.geoCity && <span>{log.geoCity}{log.geoCountry ? `, ${log.geoCountry}` : ""}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {logTotalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  onClick={() => setLogPage(Math.max(0, logPage - 1))}
                  disabled={logPage === 0}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600 dark:text-gray-400"
                >
                  Previous
                </button>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Page {logPage + 1} of {logTotalPages}
                </span>
                <button
                  onClick={() => setLogPage(Math.min(logTotalPages - 1, logPage + 1))}
                  disabled={logPage >= logTotalPages - 1}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600 dark:text-gray-400"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
