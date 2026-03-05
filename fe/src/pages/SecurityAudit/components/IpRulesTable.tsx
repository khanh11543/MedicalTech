import Badge from "../../../components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import {
  IpRuleDTO,
  IpRuleFilter,
  IpStatus,
  PageResponse,
  IP_STATUS_LABELS,
  IP_STATUS_COLORS,
  BLOCK_SCOPE_LABELS,
} from "../../../services/securityService";

interface Props {
  data: PageResponse<IpRuleDTO> | undefined;
  isLoading: boolean;
  filter: IpRuleFilter;
  filterStatus: IpStatus;
  onFilterChange: (f: IpRuleFilter) => void;
  onEdit: (rule: IpRuleDTO) => void;
  onDelete: (id: number) => void;
  onToggleActive: (rule: IpRuleDTO) => void;
}

export default function IpRulesTable({
  data,
  isLoading,
  filter,
  filterStatus,
  onFilterChange,
  onEdit,
  onDelete,
  onToggleActive,
}: Props) {
  const items = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;
  const currentPage = data?.number ?? 0;
  const pageSize = filter.pageSize ?? 20;

  const formatDate = (d: string | null) =>
    d
      ? new Date(d).toLocaleString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  const statusLabel = filterStatus === "WHITELISTED" ? "whitelisted" : "flagged";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search IP address..."
          value={filter.search || ""}
          onChange={(e) =>
            onFilterChange({ ...filter, search: e.target.value, pageNumber: 0 })
          }
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  IP Address
                </TableCell>
                <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Status
                </TableCell>
                <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Scope
                </TableCell>
                <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Reason / Description
                </TableCell>
                <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Created By
                </TableCell>
                <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Created At
                </TableCell>
                <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">
                  Active
                </TableCell>
                <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    No {statusLabel} IPs found
                  </td>
                </tr>
              ) : (
                items.map((rule) => (
                  <TableRow key={rule.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                    <TableCell className="px-4 py-3">
                      <span className="font-mono text-sm font-medium text-gray-800 dark:text-white">
                        {rule.ipAddress}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge
                        variant="light"
                        size="sm"
                        color={IP_STATUS_COLORS[rule.status] as "error" | "success" | "warning"}
                      >
                        {IP_STATUS_LABELS[rule.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {BLOCK_SCOPE_LABELS[rule.scope]}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <p className="max-w-[200px] truncate text-sm text-gray-600 dark:text-gray-400" title={rule.reason || ""}>
                        {rule.reason || "—"}
                      </p>
                      {rule.description && (
                        <p className="max-w-[200px] truncate text-xs text-gray-400" title={rule.description}>
                          {rule.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {rule.createdBy?.fullName ?? "System"}
                    </TableCell>
                    <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(rule.createdAt)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      <button
                        onClick={() => onToggleActive(rule)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          rule.isActive
                            ? "bg-green-500"
                            : "bg-gray-300 dark:bg-gray-600"
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            rule.isActive ? "translate-x-4.5" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onEdit(rule)}
                          className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-blue-500 dark:hover:bg-gray-700"
                          title="Edit"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onDelete(rule.id)}
                          className="rounded p-1 text-gray-500 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                          title="Delete"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {totalElements > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {currentPage * pageSize + 1} to{" "}
            {Math.min((currentPage + 1) * pageSize, totalElements)} of{" "}
            {totalElements}
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 0}
              onClick={() =>
                onFilterChange({ ...filter, pageNumber: currentPage - 1 })
              }
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {currentPage + 1} of {totalPages || 1}
            </span>
            <button
              disabled={currentPage >= totalPages - 1}
              onClick={() =>
                onFilterChange({ ...filter, pageNumber: currentPage + 1 })
              }
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
