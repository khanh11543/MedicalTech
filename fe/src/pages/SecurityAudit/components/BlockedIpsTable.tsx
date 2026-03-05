import Badge from "../../../components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import {
  BlockedIpDTO,
  BlockedIpFilter,
  PageResponse,
  BLOCK_TYPE_LABELS,
  BLOCK_SCOPE_LABELS,
} from "../../../services/securityService";

interface Props {
  data: PageResponse<BlockedIpDTO> | undefined;
  isLoading: boolean;
  filter: BlockedIpFilter;
  onFilterChange: (f: BlockedIpFilter) => void;
  onUnblock: (id: number) => void;
  onMakePermanent: (ip: BlockedIpDTO) => void;
  onViewEvents: (ip: string) => void;
}

export default function BlockedIpsTable({
  data,
  isLoading,
  filter,
  onFilterChange,
  onUnblock,
  onMakePermanent,
  onViewEvents,
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Filters bar */}
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
        <select
          value={filter.blockType || ""}
          onChange={(e) =>
            onFilterChange({
              ...filter,
              blockType: (e.target.value || undefined) as any,
              pageNumber: 0,
            })
          }
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          <option value="">All Types</option>
          <option value="TEMPORARY">Temporary</option>
          <option value="PERMANENT">Permanent</option>
        </select>
        <select
          value={
            filter.isAutoBlocked === undefined
              ? ""
              : filter.isAutoBlocked
              ? "true"
              : "false"
          }
          onChange={(e) =>
            onFilterChange({
              ...filter,
              isAutoBlocked:
                e.target.value === "" ? undefined : e.target.value === "true",
              pageNumber: 0,
            })
          }
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          <option value="">All Sources</option>
          <option value="true">Auto-blocked</option>
          <option value="false">Manual</option>
        </select>
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
                  Geolocation
                </TableCell>
                <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Reason
                </TableCell>
                <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Blocked Date
                </TableCell>
                <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Blocked By
                </TableCell>
                <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Type / Scope
                </TableCell>
                <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Expires
                </TableCell>
                <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">
                  Events
                </TableCell>
                <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    No blocked IPs found
                  </td>
                </tr>
              ) : (
                items.map((ip) => (
                  <TableRow key={ip.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                    <TableCell className="px-4 py-3">
                      <span className="font-mono text-sm font-medium text-gray-800 dark:text-white">
                        {ip.ipAddress}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {ip.geoCountry || "Unknown"}
                      </p>
                      {ip.geoCity && (
                        <p className="text-xs text-gray-400">{ip.geoCity}</p>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <p className="max-w-[200px] truncate text-sm text-gray-600 dark:text-gray-400" title={ip.reason}>
                        {ip.reason}
                      </p>
                    </TableCell>
                    <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(ip.blockedAt)}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {ip.isAutoBlocked ? (
                        <Badge variant="light" size="sm" color="info">
                          Auto
                        </Badge>
                      ) : ip.blockedBy ? (
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {ip.blockedBy.fullName}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">Admin</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <Badge
                          variant="light"
                          size="sm"
                          color={ip.blockType === "PERMANENT" ? "error" : "warning"}
                        >
                          {BLOCK_TYPE_LABELS[ip.blockType]}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          {BLOCK_SCOPE_LABELS[ip.blockScope]}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {ip.blockType === "PERMANENT"
                        ? "Never"
                        : ip.expiresAt
                        ? formatDate(ip.expiresAt)
                        : "—"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      <button
                        onClick={() => onViewEvents(ip.ipAddress)}
                        className="text-sm font-medium text-brand-500 hover:underline"
                      >
                        {ip.eventCount}
                      </button>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onViewEvents(ip.ipAddress)}
                          className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-blue-500 dark:hover:bg-gray-700"
                          title="View Events"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onUnblock(ip.id)}
                          className="rounded p-1 text-gray-500 hover:bg-green-50 hover:text-green-500 dark:hover:bg-green-900/20"
                          title="Unblock"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                          </svg>
                        </button>
                        {ip.blockType === "TEMPORARY" && (
                          <button
                            onClick={() => onMakePermanent(ip)}
                            className="rounded p-1 text-gray-500 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                            title="Make Permanent"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </button>
                        )}
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
