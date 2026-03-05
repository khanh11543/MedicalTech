import { useState } from "react";
import {
  SessionFilter,
  SessionStatus,
  SESSION_STATUS_LABELS,
  SESSION_STATUS_COLORS,
  ROLE_OPTIONS,
} from "../../../services/securityService";

interface Props {
  filter: SessionFilter;
  onChange: (filter: SessionFilter) => void;
}

export default function SessionFilters({ filter, onChange }: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const set = (partial: Partial<SessionFilter>) =>
    onChange({ ...filter, ...partial, pageNumber: 0 });

  const activeCount = [
    filter.status,
    filter.userId,
    filter.ipAddress,
    filter.deviceType,
    filter.browserName,
    filter.from,
    filter.to,
  ].filter(Boolean).length;

  const handleReset = () =>
    onChange({
      sortBy: "lastSeenAt",
      sortDir: "DESC",
      pageNumber: 0,
      pageSize: 20,
    });

  return (
    <div className="space-y-3">
      {/* Row 1: Search + Quick status + Advanced toggle */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
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
            placeholder="Search user, email, IP..."
            value={filter.search || ""}
            onChange={(e) => set({ search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-white/[0.03] text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Quick Status Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => set({ status: undefined })}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
              !filter.status
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            All
          </button>
          {(["ACTIVE", "IDLE", "EXPIRED", "REVOKED"] as SessionStatus[]).map((s) => {
            const c = SESSION_STATUS_COLORS[s];
            const active = filter.status === s;
            return (
              <button
                key={s}
                onClick={() => set({ status: active ? undefined : s })}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition flex items-center gap-1.5 ${
                  active
                    ? `${c.bg} ${c.text} ring-2 ring-current/20`
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                {SESSION_STATUS_LABELS[s]}
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

        {/* Reset */}
        {(filter.search || activeCount > 0) && (
          <button
            onClick={handleReset}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition"
          >
            Reset
          </button>
        )}
      </div>

      {/* Row 2: Advanced filters */}
      {showAdvanced && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/[0.02]">
          {/* Role */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Device Type
            </label>
            <select
              value={filter.deviceType || ""}
              onChange={(e) => set({ deviceType: e.target.value || undefined })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-white/[0.03] text-gray-700 dark:text-gray-300"
            >
              <option value="">All Devices</option>
              <option value="Desktop">Desktop</option>
              <option value="Mobile">Mobile</option>
              <option value="Tablet">Tablet</option>
            </select>
          </div>

          {/* Browser */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Browser
            </label>
            <input
              type="text"
              placeholder="e.g. Chrome, Firefox"
              value={filter.browserName || ""}
              onChange={(e) => set({ browserName: e.target.value || undefined })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-white/[0.03] text-gray-700 dark:text-gray-300"
            />
          </div>

          {/* User ID */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              User ID
            </label>
            <input
              type="number"
              placeholder="Filter by user ID"
              value={filter.userId ?? ""}
              onChange={(e) => set({ userId: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-white/[0.03] text-gray-700 dark:text-gray-300"
            />
          </div>

          {/* IP */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              IP Address
            </label>
            <input
              type="text"
              placeholder="e.g. 192.168.1.1"
              value={filter.ipAddress || ""}
              onChange={(e) => set({ ipAddress: e.target.value || undefined })}
              className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-white/[0.03] text-gray-700 dark:text-gray-300"
            />
          </div>

          {/* Date range */}
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
      )}
    </div>
  );
}
