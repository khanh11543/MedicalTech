import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ComponentCard from "../../../components/common/ComponentCard";
import SessionStats from "./SessionStats";
import SessionFilters from "./SessionFilters";
import SessionTable from "./SessionTable";
import SessionDetailModal from "./SessionDetailModal";
import ForceLogoutActions from "./ForceLogoutActions";
import {
  UserSessionDTO,
  SessionFilter,
  ForceLogoutDTO,
  getSessions,
  getSessionStats,
  forceLogout,
} from "../../../services/securityService";

export default function SessionManagement() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<SessionFilter>({
    sortBy: "lastSeenAt",
    sortDir: "DESC",
    pageNumber: 0,
    pageSize: 20,
  });
  const [selectedSession, setSelectedSession] = useState<UserSessionDTO | null>(null);
  const [killTarget, setKillTarget] = useState<UserSessionDTO | null>(null);
  const [showStats, setShowStats] = useState(true);

  // Queries
  const sessionsQuery = useQuery({
    queryKey: ["admin-sessions", filter],
    queryFn: () => getSessions(filter),
  });

  const statsQuery = useQuery({
    queryKey: ["admin-session-stats"],
    queryFn: getSessionStats,
  });

  // Force logout mutation
  const forceLogoutMutation = useMutation({
    mutationFn: (dto: ForceLogoutDTO) => forceLogout(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-session-stats"] });
      setKillTarget(null);
      setSelectedSession(null);
    },
  });

  // Handlers
  const handleFilterChange = useCallback((f: SessionFilter) => setFilter(f), []);

  const handleViewDetail = useCallback((session: UserSessionDTO) => {
    setSelectedSession(session);
  }, []);

  const handleKillSession = useCallback((session: UserSessionDTO) => {
    setKillTarget(session);
  }, []);

  const handleFilterByUser = useCallback(
    (userId: number) => {
      setFilter((prev) => ({ ...prev, userId, pageNumber: 0 }));
    },
    []
  );

  const handleFilterByIp = useCallback(
    (ip: string) => {
      setFilter((prev) => ({ ...prev, ipAddress: ip, pageNumber: 0 }));
    },
    []
  );

  const totalActive = statsQuery.data?.totalActiveSessions ?? 0;
  const totalIdle = statsQuery.data?.idleSessions ?? 0;

  return (
    <ComponentCard title="Session Management & Force Logout">
      <div className="space-y-5">
        {/* Header bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">
              Active Sessions
            </h3>
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
              {totalActive} active
            </span>
            {totalIdle > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                {totalIdle} idle
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowStats(!showStats)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                showStats
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Stats
            </button>
            <button
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["admin-sessions"] });
                queryClient.invalidateQueries({ queryKey: ["admin-session-stats"] });
              }}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        {showStats && (
          <SessionStats stats={statsQuery.data} isLoading={statsQuery.isLoading} />
        )}

        {/* Force Logout Actions */}
        <ForceLogoutActions
          selectedSession={killTarget}
          onForceLogout={(dto) => forceLogoutMutation.mutate(dto)}
          isLoading={forceLogoutMutation.isPending}
        />

        {/* Filters */}
        <SessionFilters filter={filter} onChange={handleFilterChange} />

        {/* Table */}
        <SessionTable
          data={sessionsQuery.data}
          filter={filter}
          isLoading={sessionsQuery.isLoading}
          onFilterChange={handleFilterChange}
          onViewDetail={handleViewDetail}
          onKillSession={handleKillSession}
        />

        {/* Detail Modal */}
        {selectedSession && (
          <SessionDetailModal
            session={selectedSession}
            isOpen={!!selectedSession}
            onClose={() => setSelectedSession(null)}
            onKillSession={(s) => {
              setSelectedSession(null);
              setKillTarget(s);
            }}
            onFilterByUser={handleFilterByUser}
            onFilterByIp={handleFilterByIp}
          />
        )}
      </div>
    </ComponentCard>
  );
}
