import { useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import duration from "dayjs/plugin/duration";
import {
  UserSessionDTO,
  SESSION_STATUS_LABELS,
  SESSION_STATUS_COLORS,
  DEVICE_TYPE_ICONS,
} from "../../../services/securityService";

dayjs.extend(relativeTime);
dayjs.extend(duration);

interface Props {
  session: UserSessionDTO;
  isOpen: boolean;
  onClose: () => void;
  onKillSession: (session: UserSessionDTO) => void;
  onFilterByUser: (userId: number) => void;
  onFilterByIp: (ip: string) => void;
}

type Tab = "session" | "connection" | "activity";

function InfoRow({ label, value, mono }: { label: string; value?: string | number | null; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[120px]">{label}</span>
      <span
        className={`text-sm text-right ${mono ? "font-mono" : ""} text-gray-800 dark:text-gray-200`}
      >
        {value ?? "—"}
      </span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
        {title}
      </h4>
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">{children}</div>
    </div>
  );
}

function formatDur(start: string, end?: string): string {
  const ms = dayjs(end || undefined).diff(dayjs(start));
  const d = dayjs.duration(ms);
  const parts: string[] = [];
  if (d.days() > 0) parts.push(`${d.days()}d`);
  if (d.hours() > 0) parts.push(`${d.hours()}h`);
  parts.push(`${d.minutes()}m`);
  return parts.join(" ");
}

export default function SessionDetailModal({
  session,
  isOpen,
  onClose,
  onKillSession,
  onFilterByUser,
  onFilterByIp,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("session");

  if (!isOpen) return null;

  const s = session;
  const statusColor = SESSION_STATUS_COLORS[s.status];
  const deviceIcon = DEVICE_TYPE_ICONS[s.deviceType || "Unknown"] || "?";
  const isLive = s.status === "ACTIVE" || s.status === "IDLE";

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "session", label: "Session", icon: "" },
    { key: "connection", label: "Connection", icon: "" },
    { key: "activity", label: "Activity", icon: "" },
  ];

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${statusColor.bg} ${statusColor.text}`}
            >
              <span className={`w-2 h-2 rounded-full ${statusColor.dot} ${isLive ? "animate-pulse" : ""}`} />
              {SESSION_STATUS_LABELS[s.status]}
            </span>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Session #{s.id}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Created {dayjs(s.createdAt).format("DD/MM/YYYY HH:mm:ss")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === tab.key
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Tab: Session */}
          {activeTab === "session" && (
            <>
              <Section title="Session Information">
                <InfoRow label="Session ID" value={`#${s.id}`} mono />
                <InfoRow
                  label="Status"
                  value={SESSION_STATUS_LABELS[s.status]}
                />
                <InfoRow label="Expires At" value={dayjs(s.expiresAt).format("DD/MM/YYYY HH:mm:ss")} />
                {s.revokedAt && (
                  <>
                    <InfoRow label="Revoked At" value={dayjs(s.revokedAt).format("DD/MM/YYYY HH:mm:ss")} />
                    <InfoRow label="Revoke Reason" value={s.revokeReason} />
                  </>
                )}
              </Section>

              <Section title="User Information">
                <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-sm font-bold text-blue-700 dark:text-blue-400">
                    {s.user?.fullName?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-200">
                      {s.user?.fullName || "Unknown"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {s.user?.email || "—"}
                    </p>
                  </div>
                  {s.user?.roleName && (
                    <span className="ml-auto px-2 py-0.5 text-xs font-medium rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                      {s.user.roleName}
                    </span>
                  )}
                </div>
                <InfoRow label="User ID" value={s.user?.id} mono />
              </Section>

              <Section title="Session Timeline">
                <div className="relative pl-6 space-y-4">
                  <div className="absolute left-2 top-1 bottom-1 w-0.5 bg-gray-200 dark:bg-gray-700" />

                  {/* Login */}
                  <div className="relative">
                    <div className="absolute -left-4 top-0.5 w-3 h-3 rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-900" />
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Login</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {dayjs(s.createdAt).format("DD/MM/YYYY HH:mm:ss")}
                    </p>
                  </div>

                  {/* Last Activity */}
                  {s.lastSeenAt && (
                    <div className="relative">
                      <div className="absolute -left-4 top-0.5 w-3 h-3 rounded-full bg-blue-500 ring-2 ring-white dark:ring-gray-900" />
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        Last Activity
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {dayjs(s.lastSeenAt).format("DD/MM/YYYY HH:mm:ss")} ({dayjs(s.lastSeenAt).fromNow()})
                      </p>
                      {s.lastActivityDescription && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 italic">
                          "{s.lastActivityDescription}"
                        </p>
                      )}
                    </div>
                  )}

                  {/* Duration */}
                  <div className="relative">
                    <div className="absolute -left-4 top-0.5 w-3 h-3 rounded-full bg-gray-400 ring-2 ring-white dark:ring-gray-900" />
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Duration</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                      {formatDur(s.createdAt, s.revokedAt || s.lastSeenAt)}
                    </p>
                  </div>

                  {/* Requests */}
                  <div className="relative">
                    <div className="absolute -left-4 top-0.5 w-3 h-3 rounded-full bg-purple-500 ring-2 ring-white dark:ring-gray-900" />
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      Activity Count
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {s.requestCount.toLocaleString()} requests
                    </p>
                  </div>

                  {/* Revoked */}
                  {s.revokedAt && (
                    <div className="relative">
                      <div className="absolute -left-4 top-0.5 w-3 h-3 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900" />
                      <p className="text-sm font-medium text-red-600 dark:text-red-400">Revoked</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {dayjs(s.revokedAt).format("DD/MM/YYYY HH:mm:ss")}
                      </p>
                      {s.revokeReason && (
                        <p className="text-xs text-red-500 mt-0.5">Reason: {s.revokeReason}</p>
                      )}
                    </div>
                  )}
                </div>
              </Section>
            </>
          )}

          {/* Tab: Connection */}
          {activeTab === "connection" && (
            <>
              <Section title="Network Information">
                <InfoRow label="IP Address" value={s.ipAddress} mono />
                <InfoRow label="Country" value={s.geoCountry} />
                <InfoRow label="City" value={s.geoCity} />
                {(s.geoCity || s.geoCountry) && (
                  <div className="mt-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-center">
                    <span className="text-2xl"></span>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                      {[s.geoCity, s.geoCountry].filter(Boolean).join(", ") || "Location unknown"}
                    </p>
                  </div>
                )}
              </Section>

              <Section title="Device Information">
                <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-3xl">{deviceIcon}</span>
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-200">
                      {s.deviceType || "Unknown Device"}
                    </p>
                    {s.deviceName && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{s.deviceName}</p>
                    )}
                  </div>
                </div>
                <InfoRow label="Browser" value={[s.browserName, s.browserVersion].filter(Boolean).join(" ") || undefined} />
                <InfoRow label="Operating System" value={s.osName} />
                {s.deviceId && <InfoRow label="Device ID" value={s.deviceId} mono />}
              </Section>
            </>
          )}

          {/* Tab: Activity */}
          {activeTab === "activity" && (
            <>
              <Section title="Activity Summary">
                <InfoRow label="Total Requests" value={s.requestCount.toLocaleString()} />
                <InfoRow label="Last Activity" value={s.lastSeenAt ? dayjs(s.lastSeenAt).fromNow() : undefined} />
                <InfoRow label="Last Action" value={s.lastActivityDescription} />
              </Section>

              <Section title="Session Duration Breakdown">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Started</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {dayjs(s.createdAt).format("HH:mm:ss")}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {dayjs(s.createdAt).format("DD/MM/YYYY")}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Last Seen</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {s.lastSeenAt ? dayjs(s.lastSeenAt).format("HH:mm:ss") : "—"}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {s.lastSeenAt ? dayjs(s.lastSeenAt).format("DD/MM/YYYY") : ""}
                    </p>
                  </div>
                </div>
                <div className="mt-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Duration</p>
                  <p className="text-lg font-bold font-mono text-gray-800 dark:text-gray-200">
                    {formatDur(s.createdAt, s.revokedAt || s.lastSeenAt)}
                  </p>
                </div>
              </Section>

              <Section title="Avg. Request Rate">
                <div className="p-3 text-center">
                  <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                    {(() => {
                      const minutes = dayjs(s.lastSeenAt || undefined).diff(dayjs(s.createdAt), "minute") || 1;
                      return (s.requestCount / minutes).toFixed(1);
                    })()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">requests / minute</p>
                </div>
              </Section>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            {s.user?.id && (
              <button
                onClick={() => {
                  onFilterByUser(s.user.id);
                  onClose();
                }}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition"
              >
                View User's Sessions
              </button>
            )}
            {s.ipAddress && (
              <button
                onClick={() => {
                  onFilterByIp(s.ipAddress!);
                  onClose();
                }}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                View IP's Sessions
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isLive && (
              <button
                onClick={() => onKillSession(s)}
                className="px-4 py-1.5 text-xs font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
              >
                Kill Session
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
