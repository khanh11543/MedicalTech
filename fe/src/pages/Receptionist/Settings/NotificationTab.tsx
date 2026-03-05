import { useState, useEffect } from "react";
import userSettingsService from "../../../services/userSettingsService";
import type { NotificationPreferences } from "../../../services/userSettingsService";

const defaultPrefs: NotificationPreferences = {
  // Receptionist-specific event toggles
  patientCheckIn: true,
  paymentReceived: true,
  longWaitingAlert: true,
  longWaitingMinutes: 30,
  newOnlineBooking: true,
  pendingPaymentReminder: true,
  appointmentCancelled: true,
  // Channels
  desktopEnabled: true,
  soundEnabled: true,
  // Do Not Disturb
  dndEnabled: false,
  dndStartTime: null,
  dndEndTime: null,
  urgentOnly: false,
};

function Toggle({ checked, onChange, label, description }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors ${checked ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-600"}`}
      >
        <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

export default function NotificationTab() {
  const [prefs, setPrefs] = useState<NotificationPreferences>(defaultPrefs);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadPrefs();
  }, []);

  const loadPrefs = async () => {
    try {
      setLoading(true);
      const data = await userSettingsService.getNotificationPreferences();
      setPrefs(data);
    } catch {
      // Use defaults
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const data = await userSettingsService.updateNotificationPreferences(prefs);
      setPrefs(data);
      setMessage({ type: "success", text: "Notification preferences saved" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to save" });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const update = (field: keyof NotificationPreferences, value: any) => {
    setPrefs({ ...prefs, [field]: value });
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

      {/* Operation Notifications */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-2">
          <h3 className="text-base font-medium text-gray-800 dark:text-white/90">Operation Notifications</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Choose which operational events you want to be notified about.</p>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          <Toggle checked={prefs.patientCheckIn} onChange={(v) => update("patientCheckIn", v)} label="Patient Check-in" description="When a patient checks in at the front desk" />
          <Toggle checked={prefs.paymentReceived} onChange={(v) => update("paymentReceived", v)} label="Payment Received" description="When a payment is successfully completed (cash or MoMo)" />
          <Toggle checked={prefs.newOnlineBooking} onChange={(v) => update("newOnlineBooking", v)} label="New Online Booking" description="When a patient books an appointment online" />
          <Toggle checked={prefs.pendingPaymentReminder} onChange={(v) => update("pendingPaymentReminder", v)} label="Pending Payment Reminder" description="Reminder for unpaid appointments after consultation" />
          <Toggle checked={prefs.appointmentCancelled} onChange={(v) => update("appointmentCancelled", v)} label="Appointment Cancelled" description="When a patient cancels their appointment" />

          {/* Long waiting alert with configurable threshold */}
          <div className="py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Long Waiting Alert</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Alert when a patient waits longer than the threshold</p>
              </div>
              <button
                onClick={() => update("longWaitingAlert", !prefs.longWaitingAlert)}
                className={`relative h-6 w-11 rounded-full transition-colors ${prefs.longWaitingAlert ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-600"}`}
              >
                <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${prefs.longWaitingAlert ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
            {prefs.longWaitingAlert && (
              <div className="mt-3 pl-1">
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Waiting threshold</label>
                <div className="flex gap-2">
                  {[15, 20, 30, 45, 60].map((m) => (
                    <button
                      key={m}
                      onClick={() => update("longWaitingMinutes", m)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                        prefs.longWaitingMinutes === m
                          ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400"
                      }`}
                    >
                      {m} min
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Channel Preferences */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="mb-2 text-base font-medium text-gray-800 dark:text-white/90">Alert Style</h3>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          <Toggle checked={prefs.desktopEnabled} onChange={(v) => update("desktopEnabled", v)} label="Desktop Notifications" description="Show browser push notifications on your screen" />
          <Toggle checked={prefs.soundEnabled} onChange={(v) => update("soundEnabled", v)} label="Sound" description="Play sound for new notifications" />
        </div>
      </div>

      {/* Do Not Disturb */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="mb-2 text-base font-medium text-gray-800 dark:text-white/90">Do Not Disturb</h3>
        <div className="space-y-4">
          <Toggle checked={prefs.dndEnabled} onChange={(v) => update("dndEnabled", v)} label="Enable Do Not Disturb" description="Silence non-urgent notifications during scheduled hours" />

          {prefs.dndEnabled && (
            <div className="grid grid-cols-2 gap-4 pl-1">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Start Time</label>
                <input
                  type="time"
                  value={prefs.dndStartTime || "22:00"}
                  onChange={(e) => update("dndStartTime", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">End Time</label>
                <input
                  type="time"
                  value={prefs.dndEndTime || "07:00"}
                  onChange={(e) => update("dndEndTime", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                />
              </div>
            </div>
          )}

          <Toggle checked={prefs.urgentOnly} onChange={(v) => update("urgentOnly", v)} label="Urgent Alerts Only" description="Only receive critical/urgent notifications" />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Notification Preferences"}
        </button>
      </div>
    </div>
  );
}
