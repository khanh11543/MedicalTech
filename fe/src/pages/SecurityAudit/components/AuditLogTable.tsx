import dayjs from "dayjs";
import {
  AuditLogDTO,
  AuditLogFilter,
  PageResponse,
  AUDIT_ACTION_COLORS,
  AUDIT_ACTION_LABELS,
  AUDIT_ENTITY_LABELS,
  AuditEntityType,
} from "../../../services/securityService";

interface Props {
  data?: PageResponse<AuditLogDTO>;
  isLoading: boolean;
  filter: AuditLogFilter;
  onFilterChange: (filter: AuditLogFilter) => void;
  onViewDetail: (log: AuditLogDTO) => void;
  onFilterByIp: (ip: string) => void;
  onFilterByUser: (userId: number) => void;
  onFilterByEntity: (entityType: string, entityId: number) => void;
}

export default function AuditLogTable({
  data,
  isLoading,
  filter,
  onFilterChange,
  onViewDetail,
  onFilterByIp,
  onFilterByUser,
  onFilterByEntity,
}: Props) {
  const handleSort = (field: string) => {
    const isSameField = filter.sortBy === field;
    onFilterChange({
      ...filter,
      sortBy: field,
      sortDir: isSameField && filter.sortDir === "DESC" ? "ASC" : "DESC",
    });
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (filter.sortBy !== field)
      return <span className="ml-1 text-gray-300 dark:text-gray-600">↕</span>;
    return (
      <span className="ml-1 text-blue-500">
        {filter.sortDir === "ASC" ? "↑" : "↓"}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-12 rounded bg-gray-100 dark:bg-gray-800" />
        ))}
      </div>
    );
  }

  if (!data?.content?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <svg className="mb-3 h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-sm font-medium">No audit logs found</p>
        <p className="text-xs">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                ID
              </th>
              <th
                className="cursor-pointer px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400"
                onClick={() => handleSort("createdAt")}
              >
                Timestamp <SortIcon field="createdAt" />
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                User
              </th>
              <th
                className="cursor-pointer px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400"
                onClick={() => handleSort("actionType")}
              >
                Action <SortIcon field="actionType" />
              </th>
              <th
                className="cursor-pointer px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400"
                onClick={() => handleSort("entityType")}
              >
                Entity Type <SortIcon field="entityType" />
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                Entity ID
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                IP Address
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                Location
              </th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {data.content.map((log) => {
              const colors = AUDIT_ACTION_COLORS[log.actionType] || AUDIT_ACTION_COLORS.UPDATE;
              return (
                <tr
                  key={log.id}
                  className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/30"
                >
                  {/* ID */}
                  <td className="px-3 py-2.5 font-mono text-xs text-gray-400">
                    #{log.id}
                  </td>

                  {/* Timestamp */}
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <p className="text-xs font-medium text-gray-800 dark:text-white">
                      {dayjs(log.createdAt).format("DD/MM/YYYY")}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {dayjs(log.createdAt).format("HH:mm:ss")}
                    </p>
                  </td>

                  {/* User */}
                  <td className="px-3 py-2.5">
                    {log.user ? (
                      <button
                        onClick={() => onFilterByUser(log.user!.id)}
                        className="text-left hover:underline"
                      >
                        <p className="text-xs font-medium text-gray-800 dark:text-white">
                          {log.user.fullName}
                        </p>
                        <p className="text-[11px] text-gray-400">{log.user.email}</p>
                      </button>
                    ) : (
                      <span className="text-xs italic text-gray-400">System</span>
                    )}
                  </td>

                  {/* Action Type */}
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${colors.bg} ${colors.text}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
                      {AUDIT_ACTION_LABELS[log.actionType] || log.actionType}
                    </span>
                  </td>

                  {/* Entity Type */}
                  <td className="px-3 py-2.5">
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                      {AUDIT_ENTITY_LABELS[log.entityType as AuditEntityType] || log.entityType}
                    </span>
                  </td>

                  {/* Entity ID */}
                  <td className="px-3 py-2.5">
                    {log.entityId ? (
                      <button
                        onClick={() => onFilterByEntity(log.entityType, log.entityId!)}
                        className="rounded bg-indigo-50 px-1.5 py-0.5 font-mono text-xs text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/40"
                      >
                        #{log.entityId}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>

                  {/* IP Address */}
                  <td className="px-3 py-2.5">
                    {log.ipAddress ? (
                      <button
                        onClick={() => onFilterByIp(log.ipAddress!)}
                        className="font-mono text-xs text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {log.ipAddress}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>

                  {/* Location */}
                  <td className="px-3 py-2.5">
                    {log.geoCountry ? (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {log.geoCity ? `${log.geoCity}, ` : ""}
                        {log.geoCountry}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>

                  {/* View Detail */}
                  <td className="px-3 py-2.5 text-center">
                    <button
                      onClick={() => onViewDetail(log)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                      title="View details"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
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
          Showing {data.number * data.size + 1}–
          {Math.min((data.number + 1) * data.size, data.totalElements)} of{" "}
          {data.totalElements} entries
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() =>
              onFilterChange({
                ...filter,
                pageNumber: Math.max(0, (filter.pageNumber || 0) - 1),
              })
            }
            disabled={data.first}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Previous
          </button>
          <span className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
            {data.number + 1} / {data.totalPages || 1}
          </span>
          <button
            onClick={() =>
              onFilterChange({
                ...filter,
                pageNumber: (filter.pageNumber || 0) + 1,
              })
            }
            disabled={data.last}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
