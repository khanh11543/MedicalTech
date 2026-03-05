import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import duration from "dayjs/plugin/duration";
import {
  UserSessionDTO,
  SessionFilter,
  SESSION_STATUS_LABELS,
  SESSION_STATUS_COLORS,
  DEVICE_TYPE_ICONS,
  PageResponse,
} from "../../../services/securityService";

dayjs.extend(relativeTime);
dayjs.extend(duration);

interface Props {
  data?: PageResponse<UserSessionDTO>;
  filter: SessionFilter;
  isLoading: boolean;
  onFilterChange: (f: SessionFilter) => void;
  onViewDetail: (session: UserSessionDTO) => void;
  onKillSession: (session: UserSessionDTO) => void;
}

function formatDuration(start: string, end?: string): string {
  const ms = dayjs(end || undefined).diff(dayjs(start));
  const d = dayjs.duration(ms);
  if (d.asHours() >= 24) return `${Math.floor(d.asDays())}d ${d.hours()}h`;
  if (d.asMinutes() >= 60) return `${d.hours()}h ${d.minutes()}m`;
  return `${d.minutes()}m ${d.seconds()}s`;
}

export default function SessionTable({
  data,
  filter,
  isLoading,
  onFilterChange,
  onViewDetail,
  onKillSession,
}: Props) {
  const sessions = data?.content || [];

  const handleSort = (field: string) => {
    const newDir =
      filter.sortBy === field && filter.sortDir === "ASC" ? "DESC" : "ASC";
    onFilterChange({ ...filter, sortBy: field, sortDir: newDir });
  };

  const SortIcon = ({ field }: { field: string }) => (
    <span className="ml-1 text-[10px] text-gray-400">
      {filter.sortBy === field ? (filter.sortDir === "ASC" ? "▲" : "▼") : "⇅"}
    </span>
  );

  const page = data?.number ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;

  if (isLoading) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              {["User", "Status", "Login Time", "Last Activity", "Duration", "IP / Location", "Device", "Actions"].map(
                (h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="border-b border-gray-100 dark:border-gray-800 animate-pulse">
                {Array.from({ length: 8 }).map((_, j) => (
                  <td key={j} className="px-4 py-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="text-4xl mb-3 block"></span>
        <p className="text-gray-500 dark:text-gray-400">No sessions found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                User
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Status
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                onClick={() => handleSort("createdAt")}
              >
                Login Time <SortIcon field="createdAt" />
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                onClick={() => handleSort("lastSeenAt")}
              >
                Last Activity <SortIcon field="lastSeenAt" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Duration
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                IP / Location
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Device
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => {
              const statusColor = SESSION_STATUS_COLORS[s.status] || { bg: "bg-gray-100 dark:bg-gray-700/50", text: "text-gray-600 dark:text-gray-300", dot: "bg-gray-400" };
              const deviceIcon = DEVICE_TYPE_ICONS[s.deviceType || "Unknown"] || "?";
              return (
                <tr
                  key={s.id}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition"
                >
                  {/* User */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xs font-bold text-blue-700 dark:text-blue-400">
                        {s.user?.fullName?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-200 text-sm leading-tight">
                          {s.user?.fullName || "Unknown"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {s.user?.email || "—"}
                        </p>
                        {s.user?.roleName && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[10px] font-medium rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                            {s.user.roleName}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full ${statusColor.bg} ${statusColor.text}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${statusColor.dot}`} />
                      {SESSION_STATUS_LABELS[s.status]}
                    </span>
                  </td>

                  {/* Login Time */}
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      {dayjs(s.createdAt).format("DD/MM/YYYY")}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {dayjs(s.createdAt).format("HH:mm:ss")}
                    </div>
                  </td>

                  {/* Last Activity */}
                  <td className="px-4 py-3">
                    {s.lastSeenAt ? (
                      <>
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          {dayjs(s.lastSeenAt).fromNow()}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[140px]" title={s.lastActivityDescription || ""}>
                          {s.lastActivityDescription || dayjs(s.lastSeenAt).format("HH:mm:ss")}
                        </div>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>

                  {/* Duration */}
                  <td className="px-4 py-3">
                    <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                      {formatDuration(s.createdAt, s.revokedAt || s.lastSeenAt)}
                    </span>
                  </td>

                  {/* IP / Location */}
                  <td className="px-4 py-3">
                    {s.ipAddress ? (
                      <button
                        onClick={() =>
                          onFilterChange({ ...filter, ipAddress: s.ipAddress, pageNumber: 0 })
                        }
                        className="text-sm font-mono text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {s.ipAddress}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                    {(s.geoCity || s.geoCountry) && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {[s.geoCity, s.geoCountry].filter(Boolean).join(", ")}
                      </div>
                    )}
                  </td>

                  {/* Device */}
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      {deviceIcon} {s.deviceType || "Unknown"}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {[s.browserName, s.browserVersion].filter(Boolean).join(" ")}
                    </div>
                    {s.osName && (
                      <div className="text-xs text-gray-400">{s.osName}</div>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onViewDetail(s)}
                        className="px-2 py-1 text-xs font-medium rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition"
                      >
                        View
                      </button>
                      {(s.status === "ACTIVE" || s.status === "IDLE") && (
                        <button
                          onClick={() => onKillSession(s)}
                          className="px-2 py-1 text-xs font-medium rounded bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition"
                        >
                          Kill
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Showing {page * (filter.pageSize || 20) + 1}–
          {Math.min((page + 1) * (filter.pageSize || 20), totalElements)} of{" "}
          {totalElements}
        </p>
        <div className="flex items-center gap-2">
          <button
            disabled={page === 0}
            onClick={() => onFilterChange({ ...filter, pageNumber: page - 1 })}
            className="px-3 py-1 text-xs font-medium rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            Previous
          </button>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {page + 1} / {totalPages}
          </span>
          <button
            disabled={page + 1 >= totalPages}
            onClick={() => onFilterChange({ ...filter, pageNumber: page + 1 })}
            className="px-3 py-1 text-xs font-medium rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
