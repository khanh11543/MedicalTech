import { useState } from "react";
import {
  SecurityEventType,
  SecuritySeverity,
  SecurityEventStatus,
  SecurityEventFilter,
  ALL_EVENT_TYPES,
  EVENT_TYPE_LABELS,
} from "../../../services/securityService";

interface Props {
  filter: SecurityEventFilter;
  onFilterChange: (filter: SecurityEventFilter) => void;
}

const QUICK_RANGES = [
  { label: "Last Hour", hours: 1 },
  { label: "Last 24h", hours: 24 },
  { label: "Last 7 Days", hours: 168 },
  { label: "Last 30 Days", hours: 720 },
];

export default function SecurityEventFilters({ filter, onFilterChange }: Props) {
  const [expanded, setExpanded] = useState(false);

  const setField = <K extends keyof SecurityEventFilter>(
    key: K,
    value: SecurityEventFilter[K]
  ) => {
    onFilterChange({ ...filter, [key]: value, pageNumber: 0 });
  };

  const toggleEventType = (type: SecurityEventType) => {
    const current = filter.eventTypes || [];
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    setField("eventTypes", updated.length > 0 ? updated : undefined);
  };

  const toggleSeverity = (sev: SecuritySeverity) => {
    const current = filter.severities || [];
    const updated = current.includes(sev)
      ? current.filter((s) => s !== sev)
      : [...current, sev];
    setField("severities", updated.length > 0 ? updated : undefined);
  };

  const setQuickRange = (hours: number) => {
    const to = new Date();
    const from = new Date(to.getTime() - hours * 3600 * 1000);
    onFilterChange({
      ...filter,
      from: from.toISOString().slice(0, 19),
      to: to.toISOString().slice(0, 19),
      pageNumber: 0,
    });
  };

  const resetAll = () => {
    onFilterChange({
      sortBy: "createdAt",
      sortDir: "DESC",
      pageNumber: 0,
      pageSize: 20,
    });
  };

  const hasFilters =
    filter.search ||
    filter.eventTypes?.length ||
    filter.severities?.length ||
    filter.status ||
    filter.from ||
    filter.to ||
    filter.ipAddress;

  return (
    <div className="space-y-3">
      {/* Search + toggle row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by user, IP, event details..."
            value={filter.search || ""}
            onChange={(e) => setField("search", e.target.value || undefined)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          />
        </div>

        {/* Status quick filter */}
        <div className="flex gap-1">
          {(["NEW", "REVIEWED", "RESOLVED"] as SecurityEventStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setField("status", filter.status === s ? undefined : s)}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                filter.status === s
                  ? s === "NEW"
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    : s === "REVIEWED"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Toggle & Reset */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
          {hasFilters && (
            <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[10px] text-white">
              !
            </span>
          )}
        </button>

        {hasFilters && (
          <button
            onClick={resetAll}
            className="rounded-lg px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            Reset
          </button>
        )}
      </div>

      {/* Expanded filters panel */}
      {expanded && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Event Types */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-gray-500 uppercase dark:text-gray-400">
                Event Type
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                {ALL_EVENT_TYPES.map((type) => (
                  <label
                    key={type}
                    className={`flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors ${
                      filter.eventTypes?.includes(type)
                        ? "bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400"
                        : "bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={filter.eventTypes?.includes(type) || false}
                      onChange={() => toggleEventType(type)}
                      className="sr-only"
                    />
                    {EVENT_TYPE_LABELS[type]}
                  </label>
                ))}
              </div>
            </div>

            {/* Severity */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-gray-500 uppercase dark:text-gray-400">
                Severity
              </label>
              <div className="flex flex-wrap gap-2">
                {(["HIGH", "MEDIUM", "LOW"] as SecuritySeverity[]).map((sev) => (
                  <label
                    key={sev}
                    className={`flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                      filter.severities?.includes(sev)
                        ? sev === "HIGH"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : sev === "MEDIUM"
                          ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        : "bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={filter.severities?.includes(sev) || false}
                      onChange={() => toggleSeverity(sev)}
                      className="sr-only"
                    />
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        sev === "HIGH"
                          ? "bg-red-500"
                          : sev === "MEDIUM"
                          ? "bg-orange-500"
                          : "bg-yellow-500"
                      }`}
                    />
                    {sev}
                  </label>
                ))}
              </div>

              {/* IP Address */}
              <label className="mt-4 mb-2 block text-xs font-semibold text-gray-500 uppercase dark:text-gray-400">
                IP Address
              </label>
              <input
                type="text"
                placeholder="e.g. 192.168.1.1"
                value={filter.ipAddress || ""}
                onChange={(e) => setField("ipAddress", e.target.value || undefined)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
              />
            </div>

            {/* Date Range */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-gray-500 uppercase dark:text-gray-400">
                Date Range
              </label>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {QUICK_RANGES.map((qr) => (
                  <button
                    key={qr.label}
                    onClick={() => setQuickRange(qr.hours)}
                    className="rounded-md bg-white px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    {qr.label}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <input
                  type="datetime-local"
                  value={filter.from || ""}
                  onChange={(e) => setField("from", e.target.value || undefined)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                />
                <input
                  type="datetime-local"
                  value={filter.to || ""}
                  onChange={(e) => setField("to", e.target.value || undefined)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
