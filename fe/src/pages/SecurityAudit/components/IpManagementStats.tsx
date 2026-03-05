import { IpManagementStatsDTO } from "../../../services/securityService";

interface Props {
  stats: IpManagementStatsDTO | undefined;
  isLoading: boolean;
}

export default function IpManagementStats({ stats, isLoading }: Props) {
  const cards = [
    {
      label: "Total Blocked",
      value: stats?.activeBlockedIps ?? 0,
      sub: `${stats?.totalBlockedIps ?? 0} all time`,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      ),
      color: "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400",
    },
    {
      label: "Auto-Blocked",
      value: stats?.autoBlockedCount ?? 0,
      sub: "system-detected threats",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      color: "text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400",
    },
    {
      label: "Manually Blocked",
      value: stats?.manuallyBlockedCount ?? 0,
      sub: "admin-initiated blocks",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400",
    },
    {
      label: "Temporary Blocks",
      value: stats?.temporaryBlocksCount ?? 0,
      sub: `${stats?.permanentBlocksCount ?? 0} permanent`,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-white/[0.03]"
        >
          <div className="flex items-center gap-3">
            <div className={`rounded-xl p-2.5 ${card.color}`}>
              {card.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {card.label}
              </p>
              {isLoading ? (
                <div className="mt-1 h-7 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              ) : (
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {card.value.toLocaleString()}
                </p>
              )}
              <p className="mt-0.5 text-xs text-gray-400">{card.sub}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
