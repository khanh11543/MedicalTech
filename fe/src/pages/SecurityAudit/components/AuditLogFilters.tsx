import { useState } from "react";
import dayjs from "dayjs";
import {
  AuditLogFilter,
  AuditActionType,
  AuditEntityType,
  ALL_AUDIT_ACTION_TYPES,
  ALL_AUDIT_ENTITY_TYPES,
  AUDIT_ACTION_LABELS,
  AUDIT_ACTION_COLORS,
  AUDIT_ENTITY_LABELS,
} from "../../../services/securityService";

interface Props {
  filter: AuditLogFilter;
  onFilterChange: (filter: AuditLogFilter) => void;
}

type QuickRange = "today" | "week" | "month" | "custom";

export default function AuditLogFilters({ filter, onFilterChange }: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [quickRange, setQuickRange] = useState<QuickRange | null>(null);

  const set = <K extends keyof AuditLogFilter>(key: K, value: AuditLogFilter[K]) =>
    onFilterChange({ ...filter, [key]: value, pageNumber: 0 });

  const toggleActionType = (t: AuditActionType) => {
    const current = filter.actionTypes || [];
    const next = current.includes(t)
      ? current.filter((x) => x !== t)
      : [...current, t];
    set("actionTypes", next.length ? next : undefined);
  };

  const toggleEntityType = (t: AuditEntityType) => {
    const current = (filter.entityTypes || []) as AuditEntityType[];
    const next = current.includes(t)
      ? current.filter((x) => x !== t)
      : [...current, t];
    set("entityTypes", next.length ? next : undefined);
  };

  const applyQuickRange = (range: QuickRange) => {
    setQuickRange(range);
    const now = dayjs();
    let from = "";
    if (range === "today") from = now.startOf("day").format("YYYY-MM-DDTHH:mm");
    else if (range === "week") from = now.subtract(7, "day").startOf("day").format("YYYY-MM-DDTHH:mm");
    else if (range === "month") from = now.subtract(30, "day").startOf("day").format("YYYY-MM-DDTHH:mm");
    else return;
    onFilterChange({ ...filter, from, to: undefined, pageNumber: 0 });
  };

  const resetFilters = () => {
    setQuickRange(null);
    onFilterChange({
      pageNumber: 0,
      pageSize: filter.pageSize || 20,
      sortBy: "createdAt",
      sortDir: "DESC",
    });
  };

  const hasActiveFilters = !!(
    filter.search ||
    filter.actionTypes?.length ||
    filter.entityTypes?.length ||
    filter.userId ||
    filter.entityId ||
    filter.ipAddress ||
    filter.from ||
    filter.to
  );

  return (
    <div className="space-y-3">
      {/* Row 1: Search + Quick Range + Toggle */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={filter.search || ""}
            onChange={(e) => set("search", e.target.value || undefined)}
            placeholder="Search by user, entity ID, or changes..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>

        {/* Quick Range */}
        <div className="flex rounded-lg border border-gray-300 dark:border-gray-600">
          {(["today", "week", "month", "custom"] as QuickRange[]).map((r) => (
            <button
              key={r}
              onClick={() => {
                if (r === "custom") {
                  setQuickRange("custom");
                  setShowAdvanced(true);
                } else {
                  applyQuickRange(r);
                }
              }}
              className={`px-3 py-1.5 text-xs font-medium first:rounded-l-lg last:rounded-r-lg ${
                quickRange === r
                  ? "bg-blue-500 text-white"
                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              {r === "today"
                ? "Today"
                : r === "week"
                ? "This Week"
                : r === "month"
                ? "This Month"
                : "Custom"}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium ${
            showAdvanced
              ? "border-blue-300 bg-blue-50 text-blue-600 dark:border-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
              : "border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          }`}
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          Advanced
          {hasActiveFilters && (
            <span className="ml-1 rounded-full bg-blue-500 px-1.5 py-0.5 text-[10px] text-white">!</span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Reset
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Action Types */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-gray-600 dark:text-gray-400">
                Action Types
              </label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_AUDIT_ACTION_TYPES.map((t) => {
                  const c = AUDIT_ACTION_COLORS[t];
                  const selected = filter.actionTypes?.includes(t);
                  return (
                    <button
                      key={t}
                      onClick={() => toggleActionType(t)}
                      className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-all ${
                        selected
                          ? `${c.bg} ${c.text} ring-1 ring-current`
                          : "bg-white text-gray-500 ring-1 ring-gray-200 hover:ring-gray-300 dark:bg-gray-700 dark:text-gray-400 dark:ring-gray-600"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${selected ? c.dot : "bg-gray-300 dark:bg-gray-500"}`} />
                      {AUDIT_ACTION_LABELS[t]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Entity Types */}
            <div className="lg:col-span-2">
              <label className="mb-2 block text-xs font-semibold text-gray-600 dark:text-gray-400">
                Entity Types
              </label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_AUDIT_ENTITY_TYPES.map((t) => {
                  const selected = filter.entityTypes?.includes(t);
                  return (
                    <button
                      key={t}
                      onClick={() => toggleEntityType(t)}
                      className={`rounded-md px-2 py-1 text-[11px] font-medium transition-all ${
                        selected
                          ? "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-400 dark:ring-indigo-600"
                          : "bg-white text-gray-500 ring-1 ring-gray-200 hover:ring-gray-300 dark:bg-gray-700 dark:text-gray-400 dark:ring-gray-600"
                      }`}
                    >
                      {AUDIT_ENTITY_LABELS[t as AuditEntityType] || t}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* User ID */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-400">
                User ID
              </label>
              <input
                type="number"
                value={filter.userId || ""}
                onChange={(e) =>
                  set("userId", e.target.value ? Number(e.target.value) : undefined)
                }
                placeholder="Filter by user ID"
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>

            {/* Entity ID */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-400">
                Entity ID
              </label>
              <input
                type="number"
                value={filter.entityId || ""}
                onChange={(e) =>
                  set("entityId", e.target.value ? Number(e.target.value) : undefined)
                }
                placeholder="Filter by entity ID"
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>

            {/* IP Address */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-400">
                IP Address
              </label>
              <input
                type="text"
                value={filter.ipAddress || ""}
                onChange={(e) => set("ipAddress", e.target.value || undefined)}
                placeholder="e.g., 192.168.1.1"
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-mono dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>

            {/* Date Range */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-400">
                From
              </label>
              <input
                type="datetime-local"
                value={filter.from || ""}
                onChange={(e) => set("from", e.target.value || undefined)}
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-400">
                To
              </label>
              <input
                type="datetime-local"
                value={filter.to || ""}
                onChange={(e) => set("to", e.target.value || undefined)}
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
