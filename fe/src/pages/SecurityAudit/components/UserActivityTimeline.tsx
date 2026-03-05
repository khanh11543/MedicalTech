import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ActivityLogDTO,
  getActivityLogs,
  ACTIVITY_TYPE_LABELS,
  ACTIVITY_TYPE_COLORS,
  ACTIVITY_TYPE_ICONS,
} from "../../../services/securityService";
import dayjs from "dayjs";

interface Props {
  onViewDetail: (log: ActivityLogDTO) => void;
  onClose: () => void;
}

export default function UserActivityTimeline({ onViewDetail, onClose }: Props) {
  const [userInput, setUserInput] = useState("");
  const [userId, setUserId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["user-activity-timeline", userId],
    queryFn: () =>
      getActivityLogs({
        userId: userId!,
        pageSize: 100,
        sortBy: "createdAt",
        sortDir: "DESC",
      }),
    enabled: !!userId,
  });

  const handleSearch = () => {
    const id = parseInt(userInput, 10);
    if (!isNaN(id) && id > 0) {
      setUserId(id);
    }
  };

  // Group logs by date
  const groupedLogs = useMemo(() => {
    if (!data?.content) return [];
    const groups: { date: string; logs: ActivityLogDTO[] }[] = [];
    data.content.forEach((log) => {
      const date = dayjs(log.createdAt).format("YYYY-MM-DD");
      const existing = groups.find((g) => g.date === date);
      if (existing) {
        existing.logs.push(log);
      } else {
        groups.push({ date, logs: [log] });
      }
    });
    return groups;
  }, [data]);

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-800 dark:text-white">
          User Activity Timeline
        </h4>
        <button
          onClick={onClose}
          className="rounded p-1 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Enter User ID or Email..."
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
        <button
          onClick={handleSearch}
          disabled={!userInput.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Search
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      )}

      {/* No user selected */}
      {!userId && !isLoading && (
        <div className="flex flex-col items-center justify-center py-10">
          <svg className="mb-2 h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <p className="text-sm text-gray-400">Enter a User ID to view their activity timeline</p>
        </div>
      )}

      {/* Empty */}
      {userId && !isLoading && !data?.content?.length && (
        <div className="flex flex-col items-center justify-center py-10">
          <svg className="mb-2 h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-gray-400">No activities found for this user</p>
        </div>
      )}

      {/* Timeline */}
      {groupedLogs.length > 0 && (
        <div className="space-y-6">
          {/* User Header */}
          {data?.content?.[0] && (
            <div className="flex items-center gap-3 rounded-lg bg-white p-3 dark:bg-gray-800">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                {data.content[0].user.avatarUrl ? (
                  <img src={data.content[0].user.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-gray-500">
                    {data.content[0].user.fullName?.charAt(0) || "?"}
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-white">
                  {data.content[0].user.fullName}
                </p>
                <p className="text-xs text-gray-400">{data.content[0].user.email}</p>
              </div>
              <div className="ml-auto">
                <p className="text-right text-xs text-gray-400">Total Activities</p>
                <p className="text-right text-lg font-bold text-blue-600">
                  {data.totalElements}
                </p>
              </div>
            </div>
          )}

          {/* Date Groups */}
          {groupedLogs.map((group) => (
            <div key={group.date}>
              {/* Date Header */}
              <div className="mb-2 flex items-center gap-2">
                <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                  {dayjs(group.date).format("dddd, DD MMMM YYYY")}
                </span>
                <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
              </div>

              {/* Timeline Items */}
              <div className="relative ml-4 border-l-2 border-gray-200 pl-6 dark:border-gray-700">
                {group.logs.map((log) => {
                  const colors = ACTIVITY_TYPE_COLORS[log.activityType];
                  const icon = ACTIVITY_TYPE_ICONS[log.activityType];
                  return (
                    <div key={log.id} className="relative mb-4 last:mb-0">
                      {/* Dot on timeline */}
                      <div
                        className={`absolute -left-[31px] top-1 h-4 w-4 rounded-full border-2 border-white ${colors.dot} dark:border-gray-800`}
                      />

                      {/* Card */}
                      <div className="rounded-lg border border-gray-200 bg-white p-3 transition-shadow hover:shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${colors.bg} ${colors.text}`}
                            >
                              <span>{icon}</span>
                              {ACTIVITY_TYPE_LABELS[log.activityType]}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {dayjs(log.createdAt).format("HH:mm:ss")}
                            </span>
                          </div>
                          <button
                            onClick={() => onViewDetail(log)}
                            className="text-[10px] text-blue-500 hover:underline"
                          >
                            Details →
                          </button>
                        </div>
                        <p className="mt-1 text-xs text-gray-700 dark:text-gray-300">
                          {log.description}
                        </p>
                        {log.resourceType && (
                          <div className="mt-1 flex items-center gap-1">
                            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                              {log.resourceType}
                            </span>
                            {log.resourceId && (
                              <span className="font-mono text-[10px] text-gray-400">
                                #{log.resourceId}
                              </span>
                            )}
                          </div>
                        )}
                        {log.ipAddress && (
                          <p className="mt-1 font-mono text-[10px] text-gray-400">
                            IP: {log.ipAddress}
                            {(log.geoCity || log.geoCountry) && (
                              <span className="ml-1">
                                ({log.geoCity}{log.geoCity && log.geoCountry ? ", " : ""}{log.geoCountry})
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Load more hint */}
          {data && data.totalElements > data.content.length && (
            <p className="text-center text-xs text-gray-400">
              Showing {data.content.length} of {data.totalElements} activities.
              Use table view for full pagination.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
