import { useState } from "react";
import {
  AuditLogStatsDTO,
  AUDIT_ACTION_COLORS,
  AUDIT_ACTION_LABELS,
  AuditActionType,
  AUDIT_ENTITY_LABELS,
  AuditEntityType,
} from "../../../services/securityService";

interface Props {
  stats?: AuditLogStatsDTO;
  isLoading: boolean;
  period: string;
  onPeriodChange: (period: string) => void;
}

export default function AuditStats({
  stats,
  isLoading,
  period,
  onPeriodChange,
}: Props) {
  const [activeSection, setActiveSection] = useState<
    "overview" | "actions" | "entities" | "users" | "heatmap"
  >("overview");

  if (isLoading || !stats) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
        <div className="h-60 rounded-xl bg-gray-100 dark:bg-gray-800" />
      </div>
    );
  }

  const sections = [
    { key: "overview" as const, label: "Overview", icon: "" },
    { key: "actions" as const, label: "By Action", icon: "" },
    { key: "entities" as const, label: "By Entity", icon: "" },
    { key: "users" as const, label: "Top Users", icon: "" },
    { key: "heatmap" as const, label: "Heatmap", icon: "" },
  ];

  return (
    <div className="space-y-4">
      {/* Period Selector + Section Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
          {sections.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activeSection === s.key
                  ? "bg-white text-gray-800 shadow-sm dark:bg-gray-700 dark:text-white"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        <div className="flex rounded-lg border border-gray-300 dark:border-gray-600">
          {["24h", "7d", "30d", "90d"].map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              className={`px-3 py-1 text-xs font-medium first:rounded-l-lg last:rounded-r-lg ${
                period === p
                  ? "bg-blue-500 text-white"
                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Overview */}
      {activeSection === "overview" && (
        <div className="space-y-4">
          {/* Stat Cards */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              label="Total Audit Logs"
              value={stats.totalLogs}
              icon=""
              color="blue"
            />
            <StatCard
              label="Sensitive Access"
              value={stats.sensitiveAccessCount}
              icon=""
              color="orange"
            />
            <StatCard
              label="Delete Actions"
              value={stats.deleteCount}
              icon=""
              color="red"
            />
          </div>

          {/* Activity Over Time (simple bar chart) */}
          {stats.byDate.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/50">
              <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white">
                Activity Over Time
              </h4>
              <div className="flex items-end gap-1" style={{ height: "120px" }}>
                {(() => {
                  const max = Math.max(...stats.byDate.map((d) => d.count), 1);
                  return stats.byDate.map((d, i) => (
                    <div key={i} className="group relative flex-1" title={`${d.date}: ${d.count}`}>
                      <div
                        className="w-full rounded-t bg-blue-400 transition-all hover:bg-blue-500 dark:bg-blue-500"
                        style={{ height: `${(d.count / max) * 100}%`, minHeight: "2px" }}
                      />
                      <div className="absolute bottom-full left-1/2 mb-1 hidden -translate-x-1/2 rounded bg-gray-800 px-1.5 py-0.5 text-[10px] text-white group-hover:block">
                        {d.count}
                      </div>
                      {i % Math.max(1, Math.floor(stats.byDate.length / 7)) === 0 && (
                        <p className="mt-1 text-center text-[9px] text-gray-400">
                          {d.date.slice(5)}
                        </p>
                      )}
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions Distribution */}
      {activeSection === "actions" && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white">
            Actions Distribution
          </h4>
          <div className="space-y-2.5">
            {stats.byActionType.map((item) => {
              const pct =
                stats.totalLogs > 0
                  ? ((item.count / stats.totalLogs) * 100).toFixed(1)
                  : "0";
              const c =
                AUDIT_ACTION_COLORS[item.actionType as AuditActionType] ||
                AUDIT_ACTION_COLORS.UPDATE;
              return (
                <div key={item.actionType}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className={`flex items-center gap-1.5 text-xs font-medium ${c.text}`}>
                      <span className={`h-2 w-2 rounded-full ${c.dot}`} />
                      {AUDIT_ACTION_LABELS[item.actionType as AuditActionType] ||
                        item.actionType}
                    </span>
                    <span className="text-xs text-gray-500">
                      {item.count.toLocaleString()} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                    <div
                      className={`h-full rounded-full ${c.dot}`}
                      style={{
                        width: `${stats.totalLogs > 0 ? (item.count / stats.totalLogs) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Entity Distribution */}
      {activeSection === "entities" && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white">
            Most Modified Entities
          </h4>
          <div className="space-y-2.5">
            {stats.byEntityType.map((item, i) => {
              const max = stats.byEntityType[0]?.count || 1;
              return (
                <div key={item.entityType}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                      <span className="w-5 text-right text-[10px] text-gray-400">
                        #{i + 1}
                      </span>
                      {AUDIT_ENTITY_LABELS[item.entityType as AuditEntityType] ||
                        item.entityType}
                    </span>
                    <span className="text-xs text-gray-500">
                      {item.count.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                    <div
                      className="h-full rounded-full bg-indigo-400 dark:bg-indigo-500"
                      style={{ width: `${(item.count / max) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Users */}
      {activeSection === "users" && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white">
            Most Active Users
          </h4>
          <div className="overflow-hidden rounded-lg border border-gray-100 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">#</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">User</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Actions</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {stats.mostActiveUsers.map((u, i) => (
                  <tr key={u.userId} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                    <td className="px-3 py-2 text-xs text-gray-400">{i + 1}</td>
                    <td className="px-3 py-2">
                      <p className="text-xs font-medium text-gray-800 dark:text-white">
                        {u.fullName}
                      </p>
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-xs font-semibold text-gray-800 dark:text-white">
                      {u.actionCount.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right text-xs text-gray-400">
                      {stats.totalLogs > 0
                        ? ((u.actionCount / stats.totalLogs) * 100).toFixed(1)
                        : 0}
                      %
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Activity Heatmap */}
      {activeSection === "heatmap" && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white">
            Activity Heatmap (Day × Hour)
          </h4>
          <ActivityHeatmap data={stats.heatmap} />
        </div>
      )}
    </div>
  );
}

/* ==================== Sub-Components ==================== */

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: string;
  color: "blue" | "orange" | "red";
}) {
  const colorMap = {
    blue: "border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/10",
    orange: "border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-900/10",
    red: "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/10",
  };
  const valueColor = {
    blue: "text-blue-600 dark:text-blue-400",
    orange: "text-orange-600 dark:text-orange-400",
    red: "text-red-600 dark:text-red-400",
  };

  return (
    <div className={`rounded-xl border p-4 ${colorMap[color]}`}>
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {label}
        </span>
      </div>
      <p className={`mt-2 text-2xl font-bold ${valueColor[color]}`}>
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function ActivityHeatmap({
  data,
}: {
  data: { dayOfWeek: number; hour: number; count: number }[];
}) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Build matrix
  const matrix: Record<string, number> = {};
  let maxCount = 1;
  data.forEach((entry) => {
    const key = `${entry.dayOfWeek}-${entry.hour}`;
    matrix[key] = entry.count;
    if (entry.count > maxCount) maxCount = entry.count;
  });

  const getColor = (count: number) => {
    if (count === 0) return "bg-gray-100 dark:bg-gray-700/30";
    const intensity = count / maxCount;
    if (intensity < 0.25) return "bg-green-200 dark:bg-green-900/40";
    if (intensity < 0.5) return "bg-green-300 dark:bg-green-800/50";
    if (intensity < 0.75) return "bg-green-400 dark:bg-green-700/60";
    return "bg-green-600 dark:bg-green-500";
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            <th className="w-10" />
            {hours.map((h) => (
              <th
                key={h}
                className="px-0 py-1 text-center text-[9px] text-gray-400"
              >
                {h % 3 === 0 ? `${h}h` : ""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map((day, dayIdx) => (
            <tr key={day}>
              <td className="pr-2 text-right text-[10px] font-medium text-gray-400">
                {day}
              </td>
              {hours.map((hour) => {
                const key = `${dayIdx + 1}-${hour}`;
                const count = matrix[key] || 0;
                return (
                  <td key={hour} className="p-[1px]">
                    <div
                      className={`h-4 w-full rounded-[2px] ${getColor(count)}`}
                      title={`${day} ${hour}:00 — ${count} actions`}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {/* Legend */}
      <div className="mt-2 flex items-center justify-end gap-1 text-[9px] text-gray-400">
        <span>Less</span>
        <div className="h-3 w-3 rounded-[2px] bg-gray-100 dark:bg-gray-700/30" />
        <div className="h-3 w-3 rounded-[2px] bg-green-200 dark:bg-green-900/40" />
        <div className="h-3 w-3 rounded-[2px] bg-green-300 dark:bg-green-800/50" />
        <div className="h-3 w-3 rounded-[2px] bg-green-400 dark:bg-green-700/60" />
        <div className="h-3 w-3 rounded-[2px] bg-green-600 dark:bg-green-500" />
        <span>More</span>
      </div>
    </div>
  );
}
