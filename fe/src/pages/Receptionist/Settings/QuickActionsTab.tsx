import { useState, useEffect, useCallback } from "react";
import userSettingsService from "../../../services/userSettingsService";
import type { QuickAction } from "../../../services/userSettingsService";

const IconCalendarPlus = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-3.75h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
  </svg>
);
const IconUserCheck = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const IconCreditCard = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
  </svg>
);
const IconUserPlus = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
  </svg>
);
const IconListOrdered = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>
);

const iconComponentMap: Record<string, React.FC> = {
  "calendar-plus": IconCalendarPlus,
  "user-check": IconUserCheck,
  "credit-card": IconCreditCard,
  "user-plus": IconUserPlus,
  "list-ordered": IconListOrdered,
};

const IconDefault = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
);

export default function QuickActionsTab() {
  const [actions, setActions] = useState<QuickAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    loadActions();
  }, []);

  const loadActions = async () => {
    try {
      setLoading(true);
      const data = await userSettingsService.getQuickActions();
      setActions(data);
    } catch {
      // Use empty
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const data = await userSettingsService.updateQuickActions({ actions });
      setActions(data);
      setMessage({ type: "success", text: "Quick actions saved" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to save" });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const toggleAction = (index: number) => {
    const updated = [...actions];
    updated[index] = { ...updated[index], enabled: !updated[index].enabled };
    setActions(updated);
  };

  // Drag and drop
  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const updated = [...actions];
    const item = updated.splice(dragIndex, 1)[0];
    updated.splice(index, 0, item);
    // Update sort orders
    updated.forEach((a, i) => (a.sortOrder = i));
    setActions(updated);
    setDragIndex(index);
  }, [dragIndex, actions]);

  const handleDragEnd = () => {
    setDragIndex(null);
  };

  // Move up/down (mobile-friendly)
  const moveItem = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= actions.length) return;
    const updated = [...actions];
    [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
    updated.forEach((a, i) => (a.sortOrder = i));
    setActions(updated);
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

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-4">
          <h3 className="text-base font-medium text-gray-800 dark:text-white/90">Dashboard Quick Actions</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Drag & drop to reorder. Toggle to enable/disable buttons on your dashboard.
          </p>
        </div>

        <div className="space-y-2">
          {actions.map((action, index) => (
            <div
              key={action.actionKey}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 rounded-xl border p-3 transition cursor-grab active:cursor-grabbing ${
                dragIndex === index
                  ? "border-brand-400 bg-brand-50 dark:bg-brand-900/20 shadow-md"
                  : action.enabled
                  ? "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                  : "border-gray-100 bg-gray-50 opacity-60 dark:border-gray-800 dark:bg-gray-900"
              }`}
            >
              {/* Drag Handle */}
              <div className="flex flex-col text-gray-400 select-none">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
                </svg>
              </div>

              {/* Icon */}
              <span className="text-gray-700 dark:text-gray-200">
                {(() => { const C = iconComponentMap[action.icon] || IconDefault; return <C />; })()}
              </span>

              {/* Label */}
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{action.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{action.actionKey}</p>
              </div>

              {/* Move Up/Down (always visible for accessibility) */}
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => moveItem(index, "up")}
                  disabled={index === 0}
                  className="rounded p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 dark:hover:text-gray-300"
                  title="Move up"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => moveItem(index, "down")}
                  disabled={index === actions.length - 1}
                  className="rounded p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 dark:hover:text-gray-300"
                  title="Move down"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Toggle */}
              <button
                onClick={() => toggleAction(index)}
                className={`relative h-6 w-11 rounded-full transition-colors ${action.enabled ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-600"}`}
              >
                <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${action.enabled ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Quick Actions"}
          </button>
        </div>
      </div>
    </div>
  );
}
