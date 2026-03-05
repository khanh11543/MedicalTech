import { useState } from "react";
import {
  InvestigationFilter,
  InvestigationStatus,
  InvestigationType,
  SecuritySeverity,
  INVESTIGATION_STATUS_LABELS,
  INVESTIGATION_STATUS_COLORS,
  INVESTIGATION_TYPE_LABELS,
  INVESTIGATION_TYPE_ICONS,
  ALL_INVESTIGATION_STATUSES,
  ALL_INVESTIGATION_TYPES,
} from "../../../services/securityService";

interface Props {
  filter: InvestigationFilter;
  onChange: (filter: InvestigationFilter) => void;
}

export default function InvestigationFilters({ filter, onChange }: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const set = (partial: Partial<InvestigationFilter>) =>
    onChange({ ...filter, ...partial, pageNumber: 0 });

  const toggleStatus = (s: InvestigationStatus) => {
    const list = filter.statuses || [];
    set({
      statuses: list.includes(s) ? list.filter((x) => x !== s) : [...list, s],
    });
  };

  const toggleType = (t: InvestigationType) => {
    const list = filter.types || [];
    set({ types: list.includes(t) ? list.filter((x) => x !== t) : [...list, t] });
  };

  const toggleSeverity = (s: SecuritySeverity) => {
    const list = filter.severities || [];
    set({
      severities: list.includes(s) ? list.filter((x) => x !== s) : [...list, s],
    });
  };

  const activeCount = [
    (filter.statuses?.length || 0) > 0,
    (filter.types?.length || 0) > 0,
    (filter.severities?.length || 0) > 0,
    filter.assignedToId,
    filter.overdue !== undefined,
    filter.from,
    filter.to,
  ].filter(Boolean).length;

  const handleReset = () =>
    onChange({ sortBy: "createdAt", sortDir: "DESC", pageNumber: 0, pageSize: 20 });

  return (
    <div className="space-y-3">
      {/* Row 1: Search + Quick status + Advanced */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search investigations..."
            value={filter.search || ""}
            onChange={(e) => set({ search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-white/[0.03] text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Quick status chips */}
        <div className="flex items-center gap-1">
          {ALL_INVESTIGATION_STATUSES.map((s) => {
            const c = INVESTIGATION_STATUS_COLORS[s];
            const active = filter.statuses?.includes(s);
            return (
              <button
                key={s}
                onClick={() => toggleStatus(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition flex items-center gap-1.5 ${
                  active
                    ? `${c.bg} ${c.text} ring-2 ring-current/20`
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                {INVESTIGATION_STATUS_LABELS[s]}
              </button>
            );
          })}
        </div>

        {/* Advanced toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          Filters
          {activeCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white text-[10px] rounded-full leading-none">
              {activeCount}
            </span>
          )}
        </button>

        {(filter.search || activeCount > 0) && (
          <button
            onClick={handleReset}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition"
          >
            Reset
          </button>
        )}
      </div>

      {/* Row 2: Advanced panel */}
      {showAdvanced && (
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/[0.02] space-y-4">
          {/* Type chips */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              Investigation Type
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_INVESTIGATION_TYPES.map((t) => {
                const active = filter.types?.includes(t);
                return (
                  <button
                    key={t}
                    onClick={() => toggleType(t)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition flex items-center gap-1.5 ${
                      active
                        ? "bg-blue-600 text-white"
                        : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <span>{INVESTIGATION_TYPE_ICONS[t]}</span>
                    {INVESTIGATION_TYPE_LABELS[t]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Severity chips */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              Severity
            </label>
            <div className="flex gap-2">
              {(["HIGH", "MEDIUM", "LOW"] as SecuritySeverity[]).map((s) => {
                const active = filter.severities?.includes(s);
                const colorMap: Record<SecuritySeverity, string> = {
                  HIGH: active ? "bg-red-600 text-white" : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800",
                  MEDIUM: active ? "bg-yellow-600 text-white" : "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800",
                  LOW: active ? "bg-green-600 text-white" : "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800",
                };
                return (
                  <button
                    key={s}
                    onClick={() => toggleSeverity(s)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${colorMap[s]}`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Other filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Overdue
              </label>
              <select
                value={filter.overdue === undefined ? "" : String(filter.overdue)}
                onChange={(e) =>
                  set({
                    overdue: e.target.value === "" ? undefined : e.target.value === "true",
                  })
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-white/[0.03] text-gray-700 dark:text-gray-300"
              >
                <option value="">All</option>
                <option value="true">Overdue Only</option>
                <option value="false">Not Overdue</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Assigned To (User ID)
              </label>
              <input
                type="number"
                placeholder="User ID"
                value={filter.assignedToId ?? ""}
                onChange={(e) =>
                  set({ assignedToId: e.target.value ? Number(e.target.value) : undefined })
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-white/[0.03] text-gray-700 dark:text-gray-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                From
              </label>
              <input
                type="datetime-local"
                value={filter.from || ""}
                onChange={(e) => set({ from: e.target.value || undefined })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-white/[0.03] text-gray-700 dark:text-gray-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                To
              </label>
              <input
                type="datetime-local"
                value={filter.to || ""}
                onChange={(e) => set({ to: e.target.value || undefined })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-white/[0.03] text-gray-700 dark:text-gray-300"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
