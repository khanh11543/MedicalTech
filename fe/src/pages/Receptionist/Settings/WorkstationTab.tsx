import { useState, useEffect } from "react";
import userSettingsService from "../../../services/userSettingsService";
import type { WorkstationSettings } from "../../../services/userSettingsService";

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

const defaultSettings: WorkstationSettings = {
  hidePhoneNumber: false,
  hideEmail: false,
  hidePatientNameWhenIdle: false,
  largeQueueDisplay: false,
  autoLockEnabled: false,
  autoLockMinutes: 5,
  hasPinSet: false,
};

export default function WorkstationTab() {
  const [settings, setSettings] = useState<WorkstationSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // PIN form
  const [showPinForm, setShowPinForm] = useState(false);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [settingPin, setSettingPin] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await userSettingsService.getWorkstationSettings();
      setSettings(data);
    } catch {
      // Use defaults
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // Don't send hasPinSet (read-only)
      const { hasPinSet, ...toSave } = settings;
      const data = await userSettingsService.updateWorkstationSettings(toSave);
      setSettings(data);
      setMessage({ type: "success", text: "Workstation settings saved" });
      // Notify other components (WorkstationContext) to reload settings
      window.dispatchEvent(new Event("workstation-settings-updated"));
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to save" });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleSetPin = async () => {
    if (pin.length < 4 || pin.length > 6 || !/^\d+$/.test(pin)) {
      setMessage({ type: "error", text: "PIN must be 4-6 digits" });
      return;
    }
    if (pin !== confirmPin) {
      setMessage({ type: "error", text: "PINs do not match" });
      return;
    }
    try {
      setSettingPin(true);
      await userSettingsService.setPin({ pin, confirmPin, currentPassword });
      setSettings({ ...settings, hasPinSet: true });
      setMessage({ type: "success", text: "PIN set successfully" });
      setShowPinForm(false);
      setPin("");
      setConfirmPin("");
      setCurrentPassword("");
      // Notify useAutoLock and WorkstationContext that settings changed
      window.dispatchEvent(new Event("workstation-settings-updated"));
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to set PIN" });
    } finally {
      setSettingPin(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const update = (field: keyof WorkstationSettings, value: any) => {
    setSettings({ ...settings, [field]: value });
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

      {/* Privacy Settings */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="mb-2 text-base font-medium text-gray-800 dark:text-white/90">Privacy Settings</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Control how sensitive patient data is displayed on your workstation.
        </p>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          <Toggle checked={settings.hidePhoneNumber} onChange={(v) => update("hidePhoneNumber", v)} label="Hide Full Phone Number" description="Display phone as 090***567" />
          <Toggle checked={settings.hideEmail} onChange={(v) => update("hideEmail", v)} label="Hide Email Address" description="Mask email on queue screen (ngu***@gmail.com)" />
          <Toggle checked={settings.hidePatientNameWhenIdle} onChange={(v) => update("hidePatientNameWhenIdle", v)} label="Hide Patient Name When Idle" description="Blur patient names after idle timeout" />
        </div>
      </div>

      {/* Auto Lock */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="mb-2 text-base font-medium text-gray-800 dark:text-white/90">Auto Lock</h3>
        <div className="space-y-4">
          <Toggle checked={settings.autoLockEnabled} onChange={(v) => update("autoLockEnabled", v)} label="Auto Lock Screen" description="Lock after idle period, unlock with PIN" />

          {settings.autoLockEnabled && (
            <div className="space-y-4 pl-1">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Lock After (minutes)
                </label>
                <div className="flex gap-2">
                  {[2, 5, 10].map((m) => (
                    <button
                      key={m}
                      onClick={() => update("autoLockMinutes", m)}
                      className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                        settings.autoLockMinutes === m
                          ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400"
                      }`}
                    >
                      {m} min
                    </button>
                  ))}
                </div>
              </div>

              {/* PIN Setup */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Unlock PIN</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {settings.hasPinSet ? "PIN is set" : "No PIN set — required for auto-lock"}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPinForm(!showPinForm)}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    {settings.hasPinSet ? "Change PIN" : "Set PIN"}
                  </button>
                </div>

                {showPinForm && (
                  <div className="mt-4 space-y-3 max-w-xs">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Current Password (for verification)</label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">New PIN (4-6 digits)</label>
                      <input
                        type="password"
                        maxLength={6}
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                        placeholder="••••"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm tracking-widest dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Confirm PIN</label>
                      <input
                        type="password"
                        maxLength={6}
                        value={confirmPin}
                        onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                        placeholder="••••"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm tracking-widest dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                      />
                      {confirmPin && pin !== confirmPin && (
                        <p className="text-xs text-red-500 mt-1">PINs do not match</p>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">PIN must be different from your main password</p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSetPin}
                        disabled={settingPin || !pin || !confirmPin || !currentPassword}
                        className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                      >
                        {settingPin ? "Setting..." : "Set PIN"}
                      </button>
                      <button
                        onClick={() => { setShowPinForm(false); setPin(""); setConfirmPin(""); setCurrentPassword(""); }}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Workstation Settings"}
        </button>
      </div>
    </div>
  );
}
