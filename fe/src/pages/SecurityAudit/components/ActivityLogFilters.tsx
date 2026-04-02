import { useState, useMemo } from "react";
import {
  ActivityLogFilter,
  ActivityType,
  ACTIVITY_TYPE_LABELS,
  ACTIVITY_TYPE_COLORS,
  ACTIVITY_CATEGORIES,
  ROLE_OPTIONS,
} from "../../../services/securityService";
import dayjs from "dayjs";

interface Props {
  filter: ActivityLogFilter;
  onFilterChange: (filter: ActivityLogFilter) => void;
}

type QuickRange = "today" | "week" | "month" | "custom";

export default function ActivityLogFilters({ filter, onFilterChange }: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [quickRange, setQuickRange] = useState<QuickRange>("custom");

  const APPOINTMENT_ACTIVITY_TYPES: ActivityType[] = [
    "CREATED_APPOINTMENT",
    "CONFIRMED_APPOINTMENT",
    "CHECKED_IN_PATIENT",
    "CANCELLED_APPOINTMENT",
    "RESCHEDULED_APPOINTMENT",
  ];

  const isAppointmentsPresetActive =
    filter.resourceType === "APPOINTMENT" &&
    (filter.activityTypes?.length || 0) === APPOINTMENT_ACTIVITY_TYPES.length &&
    APPOINTMENT_ACTIVITY_TYPES.every((t) => filter.activityTypes?.includes(t));

  const toggleAppointmentsPreset = () => {
    if (isAppointmentsPresetActive) {
      onFilterChange({ ...filter, resourceType: undefined, activityTypes: undefined, pageNumber: 0 });
      return;
    }
    onFilterChange({
      ...filter,
      resourceType: "APPOINTMENT",
      activityTypes: APPOINTMENT_ACTIVITY_TYPES,
      pageNumber: 0,
    });
  };

  const handleQuickRange = (range: QuickRange) => {
    setQuickRange(range);
    const now = dayjs();
    let from: string | undefined;
    let to: string | undefined;
    switch (range) {
      case "today":
        from = now.startOf("day").format("YYYY-MM-DDTHH:mm");
        to = now.endOf("day").format("YYYY-MM-DDTHH:mm");
        break;
      case "week":
        from = now.subtract(7, "day").startOf("day").format("YYYY-MM-DDTHH:mm");
        to = now.endOf("day").format("YYYY-MM-DDTHH:mm");
        break;
      case "month":
        from = now.subtract(30, "day").startOf("day").format("YYYY-MM-DDTHH:mm");
        to = now.endOf("day").format("YYYY-MM-DDTHH:mm");
        break;
      case "custom":
        break;
    }
    if (range !== "custom") {
      onFilterChange({ ...filter, from, to, pageNumber: 0 });
    }
  };

  const toggleActivityType = (type: ActivityType) => {
    const current = filter.activityTypes || [];
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    onFilterChange({ ...filter, activityTypes: updated.length ? updated : undefined, pageNumber: 0 });
  };

  const hasFilters = useMemo(() => {
    return !!(
      filter.search ||
      filter.activityTypes?.length ||
      filter.userId ||
      filter.roleName ||
      filter.ipAddress ||
      filter.resourceType ||
      filter.from ||
      filter.to
    );
  }, [filter]);

  const advFilterCount = useMemo(() => {
    let c = 0;
    if (filter.activityTypes?.length) c++;
    if (filter.userId) c++;
    if (filter.roleName) c++;
    if (filter.ipAddress) c++;
    if (filter.resourceType) c++;
    return c;
  }, [filter]);

  const handleReset = () => {
    onFilterChange({ pageNumber: 0, pageSize: filter.pageSize, sortBy: filter.sortBy, sortDir: filter.sortDir });
    setQuickRange("custom");
  };

  return (
    <div className="space-y-3">
      {/* Row 1: Search + Quick Range + Actions */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={filter.search || ""}
            onChange={(e) => onFilterChange({ ...filter, search: e.target.value || undefined, pageNumber: 0 })}
            placeholder="Search user name, activity description..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>

        {/* Quick Range */}
        <div className="flex rounded-lg border border-gray-300 dark:border-gray-600">
          {(["today", "week", "month", "custom"] as QuickRange[]).map((r) => (
            <button
              key={r}
              onClick={() => handleQuickRange(r)}
              className={`px-3 py-2 text-xs font-medium first:rounded-l-lg last:rounded-r-lg transition-colors ${
                quickRange === r
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              {r === "today" ? "Today" : r === "week" ? "This Week" : r === "month" ? "This Month" : "Custom"}
            </button>
          ))}
        </div>

        {/* Toggle Advanced */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
            showAdvanced
              ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
              : "border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
          }`}
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
          {advFilterCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">
              {advFilterCount}
            </span>
          )}
        </button>

        {/* Reset */}
        {hasFilters && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1 rounded-lg border border-red-300 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset
          </button>
        )}
      </div>

      {/* Quick chips */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={toggleAppointmentsPreset}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            isAppointmentsPresetActive
              ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
              : "border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          }`}
        >
          Appointments
        </button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <div className="space-y-4">
            {/* Activity Types — by category */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Activity Types
              </label>
              <div className="space-y-2">
                {ACTIVITY_CATEGORIES.map((cat) => (
                  <div key={cat.label}>
                    <p className="mb-1 text-[11px] font-medium text-gray-400 uppercase tracking-wide">
                      {cat.label}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {cat.types.map((type) => {
                        const active = filter.activityTypes?.includes(type);
                        const colors = ACTIVITY_TYPE_COLORS[type];
                        return (
                          <button
                            key={type}
                            onClick={() => toggleActivityType(type)}
                            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all ${
                              active
                                ? `${colors.bg} ${colors.text} ring-1 ring-current`
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${active ? colors.dot : "bg-gray-400"}`} />
                            {ACTIVITY_TYPE_LABELS[type]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Row: Role, User ID, IP, Resource Type */}
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-500 dark:text-gray-400">
                  Role
                </label>
                <select
                  value={filter.roleName || ""}
                  onChange={(e) =>
                    onFilterChange({ ...filter, roleName: e.target.value || undefined, pageNumber: 0 })
                  }
                  className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Roles</option>
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-500 dark:text-gray-400">
                  User ID
                </label>
                <input
                  type="number"
                  value={filter.userId || ""}
                  onChange={(e) =>
                    onFilterChange({ ...filter, userId: e.target.value ? Number(e.target.value) : undefined, pageNumber: 0 })
                  }
                  placeholder="User ID"
                  className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-500 dark:text-gray-400">
                  IP Address
                </label>
                <input
                  type="text"
                  value={filter.ipAddress || ""}
                  onChange={(e) =>
                    onFilterChange({ ...filter, ipAddress: e.target.value || undefined, pageNumber: 0 })
                  }
                  placeholder="e.g. 192.168.1.1"
                  className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-mono dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-500 dark:text-gray-400">
                  Resource Type
                </label>
                <input
                  type="text"
                  value={filter.resourceType || ""}
                  onChange={(e) =>
                    onFilterChange({ ...filter, resourceType: e.target.value || undefined, pageNumber: 0 })
                  }
                  placeholder="e.g. User, Appointment"
                  className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-500 dark:text-gray-400">
                  From
                </label>
                <input
                  type="datetime-local"
                  value={filter.from || ""}
                  onChange={(e) => {
                    onFilterChange({ ...filter, from: e.target.value || undefined, pageNumber: 0 });
                    setQuickRange("custom");
                  }}
                  className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-500 dark:text-gray-400">
                  To
                </label>
                <input
                  type="datetime-local"
                  value={filter.to || ""}
                  onChange={(e) => {
                    onFilterChange({ ...filter, to: e.target.value || undefined, pageNumber: 0 });
                    setQuickRange("custom");
                  }}
                  className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
