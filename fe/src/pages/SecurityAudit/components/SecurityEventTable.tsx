import Badge from "../../../components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import {
  SecurityEventDTO,
  SecurityEventFilter,
  EVENT_TYPE_LABELS,
  SEVERITY_COLORS,
  STATUS_COLORS,
  PageResponse,
} from "../../../services/securityService";

interface Props {
  data: PageResponse<SecurityEventDTO> | undefined;
  isLoading: boolean;
  filter: SecurityEventFilter;
  onFilterChange: (filter: SecurityEventFilter) => void;
  onViewDetail: (event: SecurityEventDTO) => void;
  onBlockIp: (ip: string) => void;
  selectedIds: number[];
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
}

export default function SecurityEventTable({
  data,
  isLoading,
  filter,
  onFilterChange,
  onViewDetail,
  onBlockIp,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
}: Props) {
  const events = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const currentPage = filter.pageNumber ?? 0;
  const pageSize = filter.pageSize ?? 20;
  const totalElements = data?.totalElements || 0;

  const handleSort = (column: string) => {
    const newDir =
      filter.sortBy === column && filter.sortDir === "ASC" ? "DESC" : "ASC";
    onFilterChange({ ...filter, sortBy: column, sortDir: newDir });
  };

  const SortIcon = ({ column }: { column: string }) => (
    <span className="ml-1 inline-block text-gray-400">
      {filter.sortBy === column ? (filter.sortDir === "ASC" ? "↑" : "↓") : "↕"}
    </span>
  );

  const getEventIcon = (eventType: string) => {
    const icons: Record<string, string> = {
      FAILED_LOGIN: "Login",
      ACCOUNT_LOCKOUT: "Lock",
      SUSPICIOUS_LOGIN_LOCATION: "Geo",
      MULTIPLE_FAILED_2FA: "2FA",
      PASSWORD_BRUTE_FORCE: "Brute",
      SQL_INJECTION_ATTEMPT: "SQL",
      XSS_ATTEMPT: "XSS",
      UNUSUAL_DATA_ACCESS: "Data",
      RAPID_API_CALLS: "API",
      FILE_UPLOAD_VIOLATION: "File",
      PASSWORD_CHANGED: "Pass",
      TWO_FA_ENABLED: "+2FA",
      TWO_FA_DISABLED: "-2FA",
      ROLE_CHANGED: "Role",
      ACCOUNT_UNLOCKED: "Unlock",
    };
    return icons[eventType] || "Alert";
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-brand-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell
                  isHeader
                  className="w-10 px-3 py-3 text-center"
                >
                  <input
                    type="checkbox"
                    checked={
                      events.length > 0 &&
                      events.every((e) => selectedIds.includes(e.id))
                    }
                    onChange={onToggleSelectAll}
                    className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                </TableCell>
                <th
                  className="cursor-pointer px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  onClick={() => handleSort("id")}
                >
                  ID <SortIcon column="id" />
                </th>
                <th
                  className="cursor-pointer px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  onClick={() => handleSort("eventType")}
                >
                  Event Type <SortIcon column="eventType" />
                </th>
                <TableCell
                  isHeader
                  className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Severity
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  User
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  IP Address
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Details
                </TableCell>
                <th
                  className="cursor-pointer px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  onClick={() => handleSort("createdAt")}
                >
                  Date & Time <SortIcon column="createdAt" />
                </th>
                <TableCell
                  isHeader
                  className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Status
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {events.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-gray-500 dark:text-gray-400" colSpan={10}>
                    No security events found
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr
                    key={event.id}
                    className="hover:bg-gray-50 dark:hover:bg-white/[0.02] cursor-pointer"
                    onClick={() => onViewDetail(event)}
                  >
                    <TableCell className="w-10 px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(event.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          onToggleSelect(event.id);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                      />
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-300">
                      #{event.id}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span>{getEventIcon(event.eventType)}</span>
                        <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {EVENT_TYPE_LABELS[event.eventType] || event.eventType}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge
                        variant="light"
                        size="sm"
                        color={SEVERITY_COLORS[event.severity] as "error" | "warning" | "info"}
                      >
                        {event.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {event.user ? (
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                            {event.user.fullName?.charAt(0) || "?"}
                          </div>
                          <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[120px]">
                            {event.user.fullName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Unknown</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onBlockIp(event.ipAddress);
                        }}
                        className="font-mono text-sm text-brand-500 hover:underline"
                        title="Block this IP"
                      >
                        {event.ipAddress}
                      </button>
                      {event.geoCountry && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {event.geoCity ? `${event.geoCity}, ` : ""}
                          {event.geoCountry}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[200px]">
                        {event.description || "—"}
                      </p>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {formatDate(event.createdAt)}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge
                        variant="light"
                        size="sm"
                        color={STATUS_COLORS[event.status] as "warning" | "info" | "success"}
                      >
                        {event.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewDetail(event);
                          }}
                          className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-brand-500 dark:hover:bg-gray-700"
                          title="View details"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onBlockIp(event.ipAddress);
                          }}
                          className="rounded p-1 text-gray-500 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                          title="Block IP"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                        </button>
                      </div>
                    </TableCell>
                  </tr>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Showing {currentPage * pageSize + 1} to{" "}
          {Math.min((currentPage + 1) * pageSize, totalElements)} of{" "}
          {totalElements} events
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
    </div>
  );
}
