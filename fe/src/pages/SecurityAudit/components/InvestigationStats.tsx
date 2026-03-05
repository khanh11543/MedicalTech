import {
  InvestigationStatsDTO,
  INVESTIGATION_STATUS_COLORS,
} from "../../../services/securityService";

interface Props {
  stats?: InvestigationStatsDTO;
  isLoading: boolean;
}

export default function InvestigationStats({ stats, isLoading }: Props) {
  const cards = [
    {
      label: "Total",
      value: stats?.totalInvestigations ?? 0,
      icon: "Total",
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      label: "Open",
      value: stats?.openCount ?? 0,
      icon: "Open",
      color: INVESTIGATION_STATUS_COLORS.OPEN.text,
      bg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      label: "In Progress",
      value: stats?.inProgressCount ?? 0,
      icon: "WIP",
      color: INVESTIGATION_STATUS_COLORS.IN_PROGRESS.text,
      bg: "bg-yellow-50 dark:bg-yellow-900/20",
    },
    {
      label: "Overdue",
      value: stats?.overdueCount ?? 0,
      icon: "Due",
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-900/20",
    },
    {
      label: "Resolved (Month)",
      value: stats?.resolvedThisMonth ?? 0,
      icon: "Done",
      color: INVESTIGATION_STATUS_COLORS.RESOLVED.text,
      bg: "bg-green-50 dark:bg-green-900/20",
    },
    {
      label: "Avg Resolution",
      value: stats?.avgResolutionDays != null ? `${stats.avgResolutionDays.toFixed(1)}d` : "—",
      icon: "Avg",
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-900/20",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[1, 2, 3, 4, 5, 6].map((k) => (
          <div key={k} className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 animate-pulse">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2" />
            <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-10" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((c) => (
        <div key={c.label} className={`rounded-xl border border-gray-200 dark:border-gray-700 p-3 ${c.bg}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">{c.label}</span>
            <span className="text-base">{c.icon}</span>
          </div>
          <p className={`text-xl font-bold ${c.color}`}>
            {typeof c.value === "number" ? c.value.toLocaleString() : c.value}
          </p>
        </div>
      ))}
    </div>
  );
}
