import { useState, useEffect } from "react";
import receptionistService from "../../../services/receptionistService";
import type { DashboardPreferencesDTO } from "../../../services/receptionistService";

interface Props {
  preferences: DashboardPreferencesDTO;
  onSave: (prefs: DashboardPreferencesDTO) => void;
}

export default function DashboardSettings({ preferences, onSave }: Props) {
  const [prefs, setPrefs] = useState<DashboardPreferencesDTO>(preferences);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPrefs(preferences);
  }, [preferences]);

  const handleToggle = (key: keyof DashboardPreferencesDTO) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChange = (key: keyof DashboardPreferencesDTO, value: number | string) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await receptionistService.updatePreferences(prefs);
      onSave(result);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Failed to save preferences:", err);
    } finally {
      setSaving(false);
    }
  };

  const toggleSettings: { key: keyof DashboardPreferencesDTO; label: string }[] = [
    { key: "showAppointmentStats", label: "Appointment Statistics" },
    { key: "showQueueStatus", label: "Queue Status" },
    { key: "showPaymentSummary", label: "Payment Summary" },
    { key: "showUpcomingAppointments", label: "Upcoming Appointments" },
    { key: "showPendingActions", label: "Pending Actions" },
    { key: "showNoShowAlerts", label: "No-show Alerts" },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Dashboard Settings
        </h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
        >
          {saving ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving…
            </>
          ) : saved ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Saved
            </>
          ) : (
            "Save Settings"
          )}
        </button>
      </div>

      <div className="space-y-5">
        {/* Widget visibility toggles */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Widget Visibility
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {toggleSettings.map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
              >
                <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={!!prefs[key]}
                  onClick={() => handleToggle(key)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    prefs[key] ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      prefs[key] ? "translate-x-4.5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </label>
            ))}
          </div>
        </div>

        {/* Number settings */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Refresh Interval (seconds)
            </label>
            <select
              value={prefs.refreshIntervalSeconds}
              onChange={(e) => handleChange("refreshIntervalSeconds", Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              <option value={15}>15s</option>
              <option value={30}>30s</option>
              <option value={60}>60s</option>
              <option value={120}>2 min</option>
              <option value={300}>5 min</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Upcoming Appointments Limit
            </label>
            <select
              value={prefs.upcomingAppointmentsLimit}
              onChange={(e) => handleChange("upcomingAppointmentsLimit", Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              <option value={3}>3</option>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Default Date Range
            </label>
            <select
              value={prefs.defaultDateRange}
              onChange={(e) => handleChange("defaultDateRange", e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              <option value="TODAY">Today</option>
              <option value="WEEK">This Week</option>
              <option value="MONTH">This Month</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
