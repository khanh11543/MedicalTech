import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ComponentCard from "../../../components/common/ComponentCard";
import IpManagementStats from "./IpManagementStats";
import BlockedIpsTable from "./BlockedIpsTable";
import IpRulesTable from "./IpRulesTable";
import BlockIpModal from "./BlockIpModal";
import WhitelistIpModal from "./WhitelistIpModal";
import {
  BlockedIpFilter,
  IpRuleFilter,
  BlockIpRequest,
  CreateIpRuleDTO,
  UpdateIpRuleDTO,
  IpRuleDTO,
  getBlockedIps,
  unblockIp,
  blockIp,
  getIpManagementStats,
  getIpRules,
  createIpRule,
  updateIpRule,
  deleteIpRule,
} from "../../../services/securityService";

type IpTab = "blocked" | "whitelisted" | "flagged";

const TABS: { key: IpTab; label: string; icon: string; color: string }[] = [
  { key: "blocked", label: "Blocked IPs", icon: "", color: "red" },
  { key: "whitelisted", label: "Whitelisted IPs", icon: "", color: "green" },
  { key: "flagged", label: "Flagged IPs", icon: "", color: "yellow" },
];

export default function IpManagement() {
  const queryClient = useQueryClient();

  // State
  const [activeTab, setActiveTab] = useState<IpTab>("blocked");
  const [showBlockIpModal, setShowBlockIpModal] = useState(false);
  const [showWhitelistModal, setShowWhitelistModal] = useState(false);
  const [editingRule, setEditingRule] = useState<IpRuleDTO | null>(null);
  const [blockedFilter, setBlockedFilter] = useState<BlockedIpFilter>({
    pageNumber: 0,
    pageSize: 20,
    sortBy: "blockedAt",
    sortDir: "DESC",
  });
  const [whitelistFilter, setWhitelistFilter] = useState<IpRuleFilter>({
    status: "WHITELISTED",
    pageNumber: 0,
    pageSize: 20,
    sortBy: "createdAt",
    sortDir: "DESC",
  });
  const [flaggedFilter, setFlaggedFilter] = useState<IpRuleFilter>({
    status: "FLAGGED",
    pageNumber: 0,
    pageSize: 20,
    sortBy: "createdAt",
    sortDir: "DESC",
  });

  // Queries
  const { data: ipStats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["ip-management-stats"],
    queryFn: getIpManagementStats,
  });

  const { data: blockedData, isLoading: isBlockedLoading } = useQuery({
    queryKey: ["blocked-ips", blockedFilter],
    queryFn: () => getBlockedIps(blockedFilter),
    enabled: activeTab === "blocked",
  });

  const { data: whitelistData, isLoading: isWhitelistLoading } = useQuery({
    queryKey: ["ip-rules-whitelist", whitelistFilter],
    queryFn: () => getIpRules(whitelistFilter),
    enabled: activeTab === "whitelisted",
  });

  const { data: flaggedData, isLoading: isFlaggedLoading } = useQuery({
    queryKey: ["ip-rules-flagged", flaggedFilter],
    queryFn: () => getIpRules(flaggedFilter),
    enabled: activeTab === "flagged",
  });

  // Mutations
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["ip-management-stats"] });
    queryClient.invalidateQueries({ queryKey: ["blocked-ips"] });
    queryClient.invalidateQueries({ queryKey: ["ip-rules-whitelist"] });
    queryClient.invalidateQueries({ queryKey: ["ip-rules-flagged"] });
    queryClient.invalidateQueries({ queryKey: ["security-dashboard"] });
  };

  const blockIpMutation = useMutation({
    mutationFn: (data: BlockIpRequest) => blockIp(data),
    onSuccess: () => {
      setShowBlockIpModal(false);
      invalidateAll();
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || "Failed to block IP");
    },
  });

  const unblockMutation = useMutation({
    mutationFn: (id: number) => unblockIp(id),
    onSuccess: () => invalidateAll(),
    onError: (error: any) => {
      alert(error?.response?.data?.message || "Failed to unblock IP");
    },
  });

  const createRuleMutation = useMutation({
    mutationFn: (data: CreateIpRuleDTO) => createIpRule(data),
    onSuccess: () => {
      setShowWhitelistModal(false);
      invalidateAll();
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || "Failed to create IP rule");
    },
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateIpRuleDTO }) =>
      updateIpRule(id, data),
    onSuccess: () => {
      setEditingRule(null);
      invalidateAll();
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || "Failed to update IP rule");
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (id: number) => deleteIpRule(id),
    onSuccess: () => invalidateAll(),
    onError: (error: any) => {
      alert(error?.response?.data?.message || "Failed to delete IP rule");
    },
  });

  // Handlers
  const handleUnblock = useCallback(
    (id: number) => {
      if (confirm("Are you sure you want to unblock this IP?")) {
        unblockMutation.mutate(id);
      }
    },
    [unblockMutation]
  );

  const handleMakePermanent = useCallback(
    (id: number) => {
      if (confirm("Make this block permanent? This IP will remain blocked indefinitely.")) {
        // Unblock and re-block as permanent (BE doesn't have a direct "make permanent" endpoint)
        // For now we just alert — or we can call a custom endpoint if available
        alert("Feature coming soon: Make permanent via dedicated endpoint");
      }
    },
    []
  );

  const handleToggleActive = useCallback(
    (rule: IpRuleDTO) => {
      updateRuleMutation.mutate({
        id: rule.id,
        data: { isActive: !rule.isActive },
      });
    },
    [updateRuleMutation]
  );

  const handleDeleteRule = useCallback(
    (id: number) => {
      if (confirm("Are you sure you want to delete this IP rule?")) {
        deleteRuleMutation.mutate(id);
      }
    },
    [deleteRuleMutation]
  );

  const handleEditRule = useCallback((rule: IpRuleDTO) => {
    setEditingRule(rule);
    // For now, open whitelist modal with pre-filled data for editing
    // A more complete implementation would have a dedicated edit modal
    setShowWhitelistModal(true);
  }, []);

  return (
    <div className="space-y-6">
      {/* IP Management Stats */}
      {ipStats && (
        <IpManagementStats stats={ipStats} isLoading={isStatsLoading} />
      )}

      {/* IP Management Card */}
      <ComponentCard
        title="IP Address Management"
        desc="Manage blocked, whitelisted, and flagged IP addresses"
      >
        {/* Action Buttons */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {ipStats && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {ipStats.totalBlockedIps} blocked · {ipStats.whitelistedCount}{" "}
                whitelisted · {ipStats.flaggedCount} flagged
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditingRule(null);
                setShowWhitelistModal(true);
              }}
              className="flex items-center gap-1.5 rounded-lg bg-green-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              Whitelist IP
            </button>
            <button
              onClick={() => setShowBlockIpModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
              Block IP
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-4 flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-white text-gray-800 shadow-sm dark:bg-gray-700 dark:text-white"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
              {/* Badge counts */}
              {ipStats && (
                <span
                  className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    activeTab === tab.key
                      ? tab.key === "blocked"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : tab.key === "whitelisted"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                      : "bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300"
                  }`}
                >
                  {tab.key === "blocked"
                    ? ipStats.activeBlockedIps
                    : tab.key === "whitelisted"
                    ? ipStats.whitelistedCount
                    : ipStats.flaggedCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "blocked" && (
          <BlockedIpsTable
            data={blockedData}
            isLoading={isBlockedLoading}
            filter={blockedFilter}
            onFilterChange={setBlockedFilter}
            onUnblock={handleUnblock}
            onMakePermanent={handleMakePermanent}
            onViewEvents={(ip) => {
              // Could navigate to events filtered by IP
              alert(`View events for IP: ${ip}`);
            }}
          />
        )}

        {activeTab === "whitelisted" && (
          <IpRulesTable
            data={whitelistData}
            isLoading={isWhitelistLoading}
            filter={whitelistFilter}
            filterStatus="WHITELISTED"
            onFilterChange={setWhitelistFilter}
            onEdit={handleEditRule}
            onDelete={handleDeleteRule}
            onToggleActive={handleToggleActive}
          />
        )}

        {activeTab === "flagged" && (
          <IpRulesTable
            data={flaggedData}
            isLoading={isFlaggedLoading}
            filter={flaggedFilter}
            filterStatus="FLAGGED"
            onFilterChange={setFlaggedFilter}
            onEdit={handleEditRule}
            onDelete={handleDeleteRule}
            onToggleActive={handleToggleActive}
          />
        )}
      </ComponentCard>

      {/* Modals */}
      <BlockIpModal
        isOpen={showBlockIpModal}
        onClose={() => setShowBlockIpModal(false)}
        onSubmit={(data) => blockIpMutation.mutate(data)}
        isPending={blockIpMutation.isPending}
      />

      <WhitelistIpModal
        isOpen={showWhitelistModal}
        onClose={() => {
          setShowWhitelistModal(false);
          setEditingRule(null);
        }}
        onSubmit={(data) => {
          if (editingRule) {
            updateRuleMutation.mutate({
              id: editingRule.id,
              data: {
                scope: data.scope,
                reason: data.reason,
                description: data.description,
              },
            });
          } else {
            createRuleMutation.mutate(data);
          }
        }}
        isPending={createRuleMutation.isPending || updateRuleMutation.isPending}
      />
    </div>
  );
}
