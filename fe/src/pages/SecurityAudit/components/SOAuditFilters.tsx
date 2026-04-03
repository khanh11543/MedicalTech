import { useState } from "react";
import dayjs from "dayjs";
import { ServiceOrderAuditFilter } from "../../../services/securityService";

interface Props {
  filter: ServiceOrderAuditFilter;
  onFilterChange: (f: ServiceOrderAuditFilter) => void;
  eventTypes: string[];
}

const ROLE_OPTIONS = ["DOCTOR", "RECEPTIONIST", "ADMIN", "PATIENT"];

export default function SOAuditFilters({ filter, onFilterChange, eventTypes }: Props) {
  const [search, setSearch] = useState(filter.search || "");

  const handleSearch = () => {
    onFilterChange({ ...filter, search, pageNumber: 0 });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleEventTypeToggle = (et: string) => {
    const current = filter.eventTypes || [];
    const next = current.includes(et) ? current.filter((x) => x !== et) : [...current, et];
    onFilterChange({ ...filter, eventTypes: next.length ? next : undefined, pageNumber: 0 });
  };

  const handleRoleToggle = (role: string) => {
    const current = filter.roles || [];
    const next = current.includes(role) ? current.filter((x) => x !== role) : [...current, role];
    onFilterChange({ ...filter, roles: next.length ? next : undefined, pageNumber: 0 });
  };

  const clearFilters = () => {
    setSearch("");
    onFilterChange({ pageNumber: 0, pageSize: 20, sortBy: "createdAt", sortDir: "DESC" });
  };

  const hasFilters = !!(filter.search || filter.eventTypes?.length || filter.roles?.length || filter.from || filter.to);

  return (
    <div className="space-y-3">
      {/* Search & date range */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
            Keyword
          </label>
          <div className="flex gap-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search summary, actor, patient..."
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            />
            <button
              onClick={handleSearch}
              className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600"
            >
              Search
            </button>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">From</label>
          <input
            type="datetime-local"
            value={filter.from || ""}
            onChange={(e) => onFilterChange({ ...filter, from: e.target.value ? dayjs(e.target.value).toISOString() : undefined, pageNumber: 0 })}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">To</label>
          <input
            type="datetime-local"
            value={filter.to || ""}
            onChange={(e) => onFilterChange({ ...filter, to: e.target.value ? dayjs(e.target.value).toISOString() : undefined, pageNumber: 0 })}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          />
        </div>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Clear
          </button>
        )}
      </div>

      {/* Event type chips */}
      <div>
        <span className="mr-2 text-xs font-medium text-gray-500 dark:text-gray-400">Event Type:</span>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {eventTypes.map((et) => {
            const active = filter.eventTypes?.includes(et);
            return (
              <button
                key={et}
                onClick={() => handleEventTypeToggle(et)}
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition ${
                  active
                    ? "bg-brand-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                {et.replace(/_/g, " ")}
              </button>
            );
          })}
        </div>
      </div>

      {/* Role chips */}
      <div>
        <span className="mr-2 text-xs font-medium text-gray-500 dark:text-gray-400">Role:</span>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {ROLE_OPTIONS.map((role) => {
            const active = filter.roles?.includes(role);
            return (
              <button
                key={role}
                onClick={() => handleRoleToggle(role)}
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition ${
                  active
                    ? "bg-brand-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                {role}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
