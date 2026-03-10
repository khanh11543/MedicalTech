import { SecurityDashboardDTO } from "../../../services/securityService";

interface Props {
  dashboard: SecurityDashboardDTO | undefined;
  isLoading: boolean;
  period: string;
  onPeriodChange: (p: string) => void;
}

const periods = [
  { value: "24h", label: "Last 24h" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

export default function SecurityStatsCards({
  dashboard,
  isLoading,
  period,
  onPeriodChange,
}: Props) {
  const cards = [
    {
      title: "Failed Logins",
      value: dashboard?.failedLoginAttempts ?? 0,
      sub: `${dashboard?.totalSecurityEvents ?? 0} total events`,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      color: "bg-red-500",
    },
    {
      title: "High Severity",
      value: dashboard?.highSeverityEvents ?? 0,
      sub: `${dashboard?.unresolvedEvents ?? 0} unresolved`,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
      color: "bg-orange-500",
    },
    {
      title: "Blocked IPs",
      value: dashboard?.activeBlockedIps ?? 0,
      sub: `${dashboard?.totalIpRules ?? 0} IP rules`,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      ),
      color: "bg-purple-500",
    },
    {
      title: "Active Sessions",
      value: dashboard?.activeSessions ?? 0,
      sub: `${dashboard?.idleSessions ?? 0} idle sessions`,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "bg-blue-500",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div className="flex items-center justify-end gap-2">
        {periods.map((p) => (
          <button
            key={p.value}
            onClick={() => onPeriodChange(p.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              period === p.value
                ? "bg-brand-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
          >
            {isLoading ? (
              <div className="flex h-16 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-brand-500" />
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {card.title}
                  </p>
                  <h3 className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">
                    {card.value.toLocaleString()}
                  </h3>
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    {card.sub}
                  </p>
                </div>
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.color} text-white`}
                >
                  {card.icon}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
