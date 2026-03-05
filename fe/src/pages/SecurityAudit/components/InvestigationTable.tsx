import dayjs from "dayjs";
import {
  InvestigationSummaryDTO,
  InvestigationFilter,
  INVESTIGATION_STATUS_LABELS,
  INVESTIGATION_STATUS_COLORS,
  INVESTIGATION_TYPE_LABELS,
  INVESTIGATION_TYPE_ICONS,
  INVESTIGATION_TYPE_COLORS,
} from "../../../services/securityService";

interface Props {
  data: InvestigationSummaryDTO[];
  total: number;
  filter: InvestigationFilter;
  onFilterChange: (f: InvestigationFilter) => void;
  onView: (item: InvestigationSummaryDTO) => void;
  loading?: boolean;
}

const severityColor: Record<string, string> = {
  HIGH: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  MEDIUM: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
  LOW: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
};

const SORTABLE: Record<string, string> = {
  id: "ID",
  title: "Title",
  severity: "Severity",
  status: "Status",
  createdAt: "Created",
  dueDate: "Due Date",
};

export default function InvestigationTable({
  data,
  total,
  filter,
  onFilterChange,
  onView,
  loading,
}: Props) {
  const page = filter.pageNumber ?? 0;
  const size = filter.pageSize ?? 20;
  const totalPages = Math.ceil(total / size);

  const handleSort = (col: string) => {
    const same = filter.sortBy === col;
    onFilterChange({
      ...filter,
      sortBy: col,
      sortDir: same && filter.sortDir === "ASC" ? "DESC" : "ASC",
    });
  };

  const sortIcon = (col: string) => {
    if (filter.sortBy !== col) return "↕";
    return filter.sortDir === "ASC" ? "↑" : "↓";
  };

  if (loading) {
    return (
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-white/[0.03]">
              {Array.from({ length: 7 }).map((_, i) => (
                <th key={i} className="px-4 py-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, r) => (
              <tr key={r} className="border-t border-gray-200 dark:border-gray-700">
                {Array.from({ length: 7 }).map((_, c) => (
                  <td key={c} className="px-4 py-3">
                    <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-white/[0.03] text-left">
              {Object.entries(SORTABLE).map(([key, label]) => (
                <th
                  key={key}
                  onClick={() => handleSort(key)}
                  className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 cursor-pointer select-none hover:text-gray-900 dark:hover:text-gray-200 whitespace-nowrap"
                >
                  {label}{" "}
                  <span className="text-xs text-gray-400">{sortIcon(key)}</span>
                </th>
              ))}
              <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Type</th>
              <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Assigned</th>
              <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 text-center">Info</th>
              <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="px-4 py-12 text-center text-gray-400 dark:text-gray-500"
                >
                  No investigations found
                </td>
              </tr>
            ) : (
              data.map((inv) => {
                const sc = INVESTIGATION_STATUS_COLORS[inv.status];
                const tc = INVESTIGATION_TYPE_COLORS[inv.type];
                return (
                  <tr
                    key={inv.id}
                    onClick={() => onView(inv)}
                    className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/[0.02] cursor-pointer transition"
                  >
                    {/* ID */}
                    <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">
                      #{inv.id}
                    </td>
                    {/* Title */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800 dark:text-gray-200 truncate max-w-[250px]">
                          {inv.title}
                        </span>
                        {inv.overdue && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded">
                            OVERDUE
                          </span>
                        )}
                      </div>
                    </td>
                    {/* Severity */}
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${severityColor[inv.severity] || ""}`}>
                        {inv.severity}
                      </span>
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${sc.bg} ${sc.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                        {INVESTIGATION_STATUS_LABELS[inv.status]}
                      </span>
                    </td>
                    {/* Created */}
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {dayjs(inv.createdAt).format("DD/MM/YYYY HH:mm")}
                    </td>
                    {/* Due */}
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {inv.dueDate ? dayjs(inv.dueDate).format("DD/MM/YYYY") : "—"}
                    </td>
                    {/* Type */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${tc.bg} ${tc.text}`}>
                        {INVESTIGATION_TYPE_ICONS[inv.type]} {INVESTIGATION_TYPE_LABELS[inv.type]}
                      </span>
                    </td>
                    {/* Assigned */}
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {inv.assignedTo ? inv.assignedTo.fullName : (
                        <span className="text-gray-400 italic">Unassigned</span>
                      )}
                    </td>
                    {/* Info counts */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span title="Notes">Notes: {inv.notesCount}</span>
                        <span title="Evidence">Evidence: {inv.evidenceCount}</span>
                        <span title="Related users">Users: {inv.relatedUsersCount}</span>
                      </div>
                    </td>
                    {/* Action */}
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); onView(inv); }}
                        className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Showing {page * size + 1}–{Math.min((page + 1) * size, total)} of {total}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={page === 0}
              onClick={() => onFilterChange({ ...filter, pageNumber: page - 1 })}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let p: number;
              if (totalPages <= 7) p = i;
              else if (page < 4) p = i;
              else if (page >= totalPages - 4) p = totalPages - 7 + i;
              else p = page - 3 + i;
              return (
                <button
                  key={p}
                  onClick={() => onFilterChange({ ...filter, pageNumber: p })}
                  className={`w-8 h-8 text-xs font-medium rounded-lg transition ${
                    p === page
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {p + 1}
                </button>
              );
            })}
            <button
              disabled={page >= totalPages - 1}
              onClick={() => onFilterChange({ ...filter, pageNumber: page + 1 })}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
