import { useCallback, useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import adminService, { SystemSettingItem } from "../../services/adminService";

interface SettingsSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const SECTIONS: SettingsSection[] = [
  {
    id: "general",
    title: "General Settings",
    description: "Application name, timezone, locale settings",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: "security",
    title: "Security Settings",
    description: "Authentication, password policy, account lock settings",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  {
    id: "email",
    title: "Email Configuration",
    description: "SMTP settings, email templates, sender info",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: "payment",
    title: "Payment Settings",
    description: "MoMo integration, QR expiry, currency settings",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    id: "notification",
    title: "Notification Settings",
    description: "SMS provider, push notification, alert preferences",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    id: "appointment",
    title: "Appointment Settings",
    description: "Scheduling rules, time slots, booking limits",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
];

export default function SystemSettings() {
  const [activeSection, setActiveSection] = useState("general");
  const [grouped, setGrouped] = useState<Record<string, SystemSettingItem[]>>({});
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // ---------- FETCH ----------
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getSettingsGrouped();
      setGrouped(data);
      // Initialize edit values from fetched data
      const vals: Record<string, string> = {};
      Object.values(data)
        .flat()
        .forEach((s) => {
          vals[s.settingKey] = s.settingValue;
        });
      setEditValues(vals);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load settings";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // ---------- CHANGE ----------
  const handleChange = (key: string, value: string) => {
    setEditValues((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const toggleBoolean = (key: string) => {
    setEditValues((prev) => ({
      ...prev,
      [key]: prev[key] === "true" ? "false" : "true",
    }));
    setSaved(false);
  };

  // ---------- SAVE ----------
  const handleSave = async () => {
    try {
      setSaving(true);
      const updates = Object.entries(editValues).map(([settingKey, settingValue]) => ({
        settingKey,
        settingValue,
      }));
      await adminService.bulkUpdateSettings(updates);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      fetchSettings(); // refresh
    } catch {
      alert("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ---------- RENDER HELPERS ----------
  const inputClass =
    "w-full rounded border border-gray-300 dark:border-white/[0.1] bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus-visible:outline-none";

  const renderToggle = (key: string) => (
    <label className="relative inline-flex cursor-pointer items-center">
      <input
        type="checkbox"
        checked={editValues[key] === "true"}
        onChange={() => toggleBoolean(key)}
        title={`Toggle ${key}`}
        className="peer sr-only"
      />
      <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-teal-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:bg-gray-700"></div>
    </label>
  );

  const renderSettingInput = (item: SystemSettingItem) => {
    const val = editValues[item.settingKey] ?? item.settingValue;

    if (item.valueType === "BOOLEAN") {
      return (
        <div className="flex items-center gap-3" key={item.id}>
          {renderToggle(item.settingKey)}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {item.displayName}
            </p>
            {item.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400">{item.description}</p>
            )}
          </div>
        </div>
      );
    }

    return (
      <div key={item.id}>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {item.displayName}
        </label>
        {item.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{item.description}</p>
        )}
        <input
          type={item.valueType === "NUMBER" ? "number" : "text"}
          value={val}
          onChange={(e) => handleChange(item.settingKey, e.target.value)}
          title={item.displayName}
          placeholder={item.displayName}
          className={`${inputClass} max-w-md`}
        />
      </div>
    );
  };

  const currentGroupSettings = grouped[activeSection] ?? [];

  // ---------- RENDER ----------
  return (
    <>
      <PageMeta
        title="System Settings | MediTech Admin"
        description="Configure system settings in the MediTech system"
      />
      <PageBreadcrumb pageTitle="System Settings" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="rounded-lg border border-gray-200 dark:border-white/[0.05] bg-white dark:bg-white/[0.03] shadow-sm overflow-hidden">
            <nav className="flex flex-col">
              {SECTIONS.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center gap-3 px-4 py-3.5 text-left transition-colors border-l-4 ${
                    activeSection === section.id
                      ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400"
                      : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-900/30 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <span
                    className={activeSection === section.id ? "text-teal-500" : "text-gray-400 dark:text-gray-500"}
                  >
                    {section.icon}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{section.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 hidden xl:block">
                      {section.description}
                    </p>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="rounded-lg border border-gray-200 dark:border-white/[0.05] bg-white dark:bg-white/[0.03] px-6 pt-6 pb-6 shadow-sm">
            {/* Section Header */}
            <div className="mb-6 pb-4 border-b border-gray-200 dark:border-white/[0.05]">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {SECTIONS.find((s) => s.id === activeSection)?.title}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {SECTIONS.find((s) => s.id === activeSection)?.description}
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400">
                {error}
                <button onClick={fetchSettings} className="ml-2 underline">
                  Retry
                </button>
              </div>
            )}

            {/* Loading */}
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
              </div>
            ) : (
              <>
                {/* Dynamic Section Content */}
                <div className="space-y-6">
                  {currentGroupSettings.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No settings found for this group.
                    </p>
                  ) : (
                    currentGroupSettings.map((item) => renderSettingInput(item))
                  )}
                </div>

                {/* Save Button */}
                <div className="mt-8 pt-4 border-t border-gray-200 dark:border-white/[0.05] flex items-center gap-4">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded bg-teal-500 px-6 py-2.5 font-medium text-white hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? "Saving..." : "Save Settings"}
                  </button>
                  {saved && (
                    <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Settings saved successfully
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
