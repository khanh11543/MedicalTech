import dayjs from "dayjs";
import {
  ServiceOrderAuditLogDTO,
  ServiceOrderAuditFilter,
  PageResponse,
  SO_AUDIT_EVENT_LABELS,
  SO_AUDIT_EVENT_COLORS,
} from "../../../services/securityService";

interface Props {
  data?: PageResponse<ServiceOrderAuditLogDTO>;
  isLoading: boolean;
  filter: ServiceOrderAuditFilter;
  onFilterChange: (f: ServiceOrderAuditFilter) => void;
  onViewDetail: (log: ServiceOrderAuditLogDTO) => void;
  onViewTimeline: (appointmentId: number) => void;
}

export default function SOAuditTable({
  data,
  isLoading,
  filter,
  onFilterChange,
  onViewDetail,
  onViewTimeline,
}: Props) {
  const handleSort = (field: string) => {
    const same = filter.sortBy === field;
    onFilterChange({
      ...filter,
      sortBy: field,
      sortDir: same && filter.sortDir === "DESC" ? "ASC" : "DESC",
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
          <div key={i} className="h-10 rounded bg-gray-100 dark:bg-gray-800" />
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
        <p className="text-sm font-medium">No service order audit logs found</p>
        <p className="text-xs">Try adjusting your filters</p>
      </div>
    );
  }

  const totalPages = data.totalPages || 1;
  const currentPage = (filter.pageNumber ?? 0) + 1;

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
              <th
                className="cursor-pointer whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400"
                onClick={() => handleSort("createdAt")}
              >
                Time <SortIcon field="createdAt" />
              </th>
              <th className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                Event Type
              </th>
              <th className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                Actor
              </th>
              <th className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                Role
              </th>
              <th className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                Patient
              </th>
              <th className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                Appointment
              </th>
              <th className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                Service Order
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                Summary
              </th>
              <th className="whitespace-nowrap px-3 py-2.5 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.content.map((log) => {
              const eventLabel = SO_AUDIT_EVENT_LABELS[log.eventType] || log.eventType.replace(/_/g, " ");
              const colorClass = SO_AUDIT_EVENT_COLORS[log.eventType] || "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";

              return (
                <tr
                  key={log.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition"
                >
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-600 dark:text-gray-300">
                    {dayjs(log.createdAt).format("YYYY-MM-DD HH:mm:ss")}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}>
                      {eventLabel}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-700 dark:text-gray-300">
                    {log.actorName || "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                    {log.actorRole || "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-700 dark:text-gray-300">
                    {log.patientName || "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs">
                    {log.appointmentId ? (
                      <button
                        onClick={() => onViewTimeline(log.appointmentId!)}
                        className="text-blue-600 hover:underline dark:text-blue-400"
                        title="View appointment timeline"
                      >
                        #{log.appointmentId}
                      </button>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                    {log.serviceOrderId ? `#${log.serviceOrderId}` : "—"}
                  </td>
                  <td className="max-w-[300px] truncate px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                    {log.summary || "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-center">
                    <button
                      onClick={() => onViewDetail(log)}
                      className="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40"
                    >
                      Detail
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
          Page {currentPage} of {totalPages} ({data.totalElements} total)
        </p>
        <div className="flex gap-1">
          <button
            disabled={currentPage <= 1}
            onClick={() => onFilterChange({ ...filter, pageNumber: (filter.pageNumber ?? 0) - 1 })}
            className="rounded border border-gray-300 px-2.5 py-1 text-xs disabled:opacity-50 dark:border-gray-600 dark:text-gray-300"
          >
            Prev
          </button>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => onFilterChange({ ...filter, pageNumber: (filter.pageNumber ?? 0) + 1 })}
            className="rounded border border-gray-300 px-2.5 py-1 text-xs disabled:opacity-50 dark:border-gray-600 dark:text-gray-300"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
