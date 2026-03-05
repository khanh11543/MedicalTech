import {
  ActivityLogDTO,
  ActivityLogFilter,
  PageResponse,
  ACTIVITY_TYPE_LABELS,
  ACTIVITY_TYPE_COLORS,
  ACTIVITY_TYPE_ICONS,
} from "../../../services/securityService";
import dayjs from "dayjs";

interface Props {
  data?: PageResponse<ActivityLogDTO>;
  isLoading: boolean;
  filter: ActivityLogFilter;
  onFilterChange: (f: ActivityLogFilter) => void;
  onViewDetail: (log: ActivityLogDTO) => void;
  onFilterByUser: (userId: number) => void;
  onFilterByIp: (ip: string) => void;
}

const ROLE_BADGE: Record<string, { bg: string; text: string }> = {
  ADMIN: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400" },
  DOCTOR: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400" },
  RECEPTIONIST: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-400" },
  PATIENT: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400" },
};

export default function ActivityLogTable({
  data,
  isLoading,
  filter,
  onFilterChange,
  onViewDetail,
  onFilterByUser,
  onFilterByIp,
}: Props) {
  const handleSort = (field: string) => {
    const newDir =
      filter.sortBy === field && filter.sortDir === "ASC" ? "DESC" : "ASC";
    onFilterChange({ ...filter, sortBy: field, sortDir: newDir, pageNumber: 0 });
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (filter.sortBy !== field) {
      return (
        <svg className="ml-1 inline h-3 w-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return filter.sortDir === "ASC" ? (
      <svg className="ml-1 inline h-3 w-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="ml-1 inline h-3 w-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  // Skeleton loading
  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800">
              {["ID", "User", "Activity", "Description", "Resource", "Date", "IP", ""].map((h) => (
                <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="border-t border-gray-100 dark:border-gray-700">
                {Array.from({ length: 8 }).map((_, j) => (
                  <td key={j} className="px-3 py-3">
                    <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!data?.content?.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 py-16 dark:border-gray-700">
        <svg className="mb-3 h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No activity logs found</p>
        <p className="text-xs text-gray-400">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800">
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 w-14">
                ID
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                User
              </th>
              <th
                className="cursor-pointer px-3 py-3 text-left text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400"
                onClick={() => handleSort("activityType")}
              >
                Activity Type <SortIcon field="activityType" />
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                Description
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                Resource
              </th>
              <th
                className="cursor-pointer px-3 py-3 text-left text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400"
                onClick={() => handleSort("createdAt")}
              >
                Date & Time <SortIcon field="createdAt" />
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                IP Address
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 w-20">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {data.content.map((log) => {
              const colors = ACTIVITY_TYPE_COLORS[log.activityType] || { bg: "bg-gray-100 dark:bg-gray-700/50", text: "text-gray-600 dark:text-gray-300", dot: "bg-gray-500" };
              const icon = ACTIVITY_TYPE_ICONS[log.activityType] || "?";
              return (
                <tr
                  key={log.id}
                  className="border-t border-gray-100 transition-colors hover:bg-gray-50/50 dark:border-gray-700 dark:hover:bg-gray-800/50"
                >
                  {/* ID */}
                  <td className="px-3 py-2.5">
                    <span className="font-mono text-xs text-gray-400">#{log.id}</span>
                  </td>

                  {/* User */}
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                        {log.user.avatarUrl ? (
                          <img src={log.user.avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
                        ) : (
                          <span className="text-[10px] font-bold text-gray-500">
                            {log.user.fullName?.charAt(0) || "?"}
                          </span>
                        )}
                      </div>
                      <div>
                        <button
                          onClick={() => onFilterByUser(log.user.id)}
                          className="text-xs font-medium text-gray-800 hover:text-blue-600 hover:underline dark:text-white"
                        >
                          {log.user.fullName}
                        </button>
                        <p className="text-[10px] text-gray-400">{log.user.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Activity Type */}
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${colors.bg} ${colors.text}`}
                    >
                      <span>{icon}</span>
                      {ACTIVITY_TYPE_LABELS[log.activityType]}
                    </span>
                  </td>

                  {/* Description */}
                  <td className="max-w-[250px] px-3 py-2.5">
                    <p className="truncate text-xs text-gray-700 dark:text-gray-300" title={log.description}>
                      {log.description}
                    </p>
                  </td>

                  {/* Resource */}
                  <td className="px-3 py-2.5">
                    {log.resourceType ? (
                      <div className="text-xs">
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                          {log.resourceType}
                        </span>
                        {log.resourceId && (
                          <span className="ml-1 font-mono text-gray-400">#{log.resourceId}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>

                  {/* Date & Time */}
                  <td className="px-3 py-2.5">
                    <p className="text-xs text-gray-700 dark:text-gray-300">
                      {dayjs(log.createdAt).format("DD/MM/YYYY")}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {dayjs(log.createdAt).format("HH:mm:ss")}
                    </p>
                  </td>

                  {/* IP Address */}
                  <td className="px-3 py-2.5">
                    {log.ipAddress ? (
                      <button
                        onClick={() => onFilterByIp(log.ipAddress!)}
                        className="font-mono text-xs text-gray-600 hover:text-blue-600 hover:underline dark:text-gray-400"
                      >
                        {log.ipAddress}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-2.5 text-center">
                    <button
                      onClick={() => onViewDetail(log)}
                      className="rounded-lg border border-gray-300 px-2.5 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Showing {data.number * data.size + 1}–{Math.min((data.number + 1) * data.size, data.totalElements)} of{" "}
          {data.totalElements.toLocaleString()}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => onFilterChange({ ...filter, pageNumber: (filter.pageNumber || 0) - 1 })}
            disabled={data.first}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            ← Previous
          </button>
          <span className="flex items-center px-2 text-xs text-gray-500 dark:text-gray-400">
            Page {data.number + 1} of {data.totalPages}
          </span>
          <button
            onClick={() => onFilterChange({ ...filter, pageNumber: (filter.pageNumber || 0) + 1 })}
            disabled={data.last}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
