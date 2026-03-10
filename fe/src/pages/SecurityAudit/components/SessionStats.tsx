import { SessionStatsDTO } from "../../../services/securityService";

interface Props {
  stats?: SessionStatsDTO;
  isLoading: boolean;
}

export default function SessionStats({ stats, isLoading }: Props) {
  const cards = [
    {
      label: "Active Sessions",
      value: stats?.totalActiveSessions ?? 0,
      icon: "Active",
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-900/20",
    },
    {
      label: "Idle Sessions",
      value: stats?.idleSessions ?? 0,
      icon: "Idle",
      color: "text-yellow-600 dark:text-yellow-400",
      bg: "bg-yellow-50 dark:bg-yellow-900/20",
    },
    {
      label: "Revoked Today",
      value: stats?.revokedToday ?? 0,
      icon: "Revoked",
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-900/20",
    },
    {
      label: "Device Types",
      value: stats?.byDeviceType?.length ?? 0,
      icon: "Devices",
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-900/20",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((k) => (
          <div key={k} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-3" />
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.label} className={`rounded-xl border border-gray-200 dark:border-gray-700 p-4 ${c.bg}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">{c.label}</span>
            <span className="text-xl">{c.icon}</span>
          </div>
          <p className={`text-2xl font-bold ${c.color}`}>{c.value.toLocaleString()}</p>
        </div>
      ))}

      {/* Breakdown rows */}
      {stats && (stats.byDeviceType?.length > 0 || stats.byBrowser?.length > 0 || stats.byCountry?.length > 0) && (
        <div className="col-span-full grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
          {/* By Device Type */}
          {stats.byDeviceType?.length > 0 && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-white/[0.03]">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">By Device</h4>
              <div className="space-y-2">
                {stats.byDeviceType.map((d) => (
                  <div key={d.deviceType} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{d.deviceType || "Unknown"}</span>
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* By Browser */}
          {stats.byBrowser?.length > 0 && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-white/[0.03]">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">By Browser</h4>
              <div className="space-y-2">
                {stats.byBrowser.map((b) => (
                  <div key={b.browserName} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{b.browserName || "Unknown"}</span>
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{b.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* By Country */}
          {stats.byCountry?.length > 0 && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-white/[0.03]">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">By Country</h4>
              <div className="space-y-2">
                {stats.byCountry.map((c) => (
                  <div key={c.country} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{c.country || "Unknown"}</span>
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{c.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
