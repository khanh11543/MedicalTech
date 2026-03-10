import {
  ActivityLogDTO,
  ACTIVITY_TYPE_LABELS,
  ACTIVITY_TYPE_COLORS,
  ACTIVITY_TYPE_ICONS,
} from "../../../services/securityService";
import dayjs from "dayjs";
import { useState } from "react";

interface Props {
  log: ActivityLogDTO;
  isOpen: boolean;
  onClose: () => void;
  onFilterByUser: (userId: number) => void;
  onFilterByIp: (ip: string) => void;
}

const ROLE_BADGE: Record<string, { bg: string; text: string }> = {
  ADMIN: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400" },
  DOCTOR: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400" },
  RECEPTIONIST: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-400" },
  PATIENT: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400" },
};

type Tab = "info" | "details" | "session";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
        {title}
      </h4>
      <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-600 dark:bg-gray-800">
        {children}
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between py-1.5 border-b border-gray-100 last:border-0 dark:border-gray-700">
      <span className="text-xs text-gray-500 dark:text-gray-400 w-32 shrink-0">{label}</span>
      <span className={`text-xs text-right text-gray-800 dark:text-white ${mono ? "font-mono" : ""}`}>
        {value || <span className="text-gray-300">—</span>}
      </span>
    </div>
  );
}

function parseUserAgent(ua?: string) {
  if (!ua) return { browser: "Unknown", os: "Unknown", device: "Unknown" };
  let browser = "Unknown";
  let os = "Unknown";
  let device = "Desktop";
  if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Edg")) browser = "Edge";
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iOS") || ua.includes("iPhone")) os = "iOS";
  if (ua.includes("Mobile") || ua.includes("Android")) device = "Mobile";
  else if (ua.includes("Tablet") || ua.includes("iPad")) device = "Tablet";
  return { browser, os, device };
}

export default function ActivityDetailModal({ log, isOpen, onClose, onFilterByUser, onFilterByIp }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("info");

  if (!isOpen) return null;

  const colors = ACTIVITY_TYPE_COLORS[log.activityType];
  const icon = ACTIVITY_TYPE_ICONS[log.activityType];
  const ua = parseUserAgent(log.userAgent);

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "info", label: "Activity", icon: "" },
    { key: "details", label: "Details", icon: "" },
    { key: "session", label: "Session", icon: "" },
  ];

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative mx-4 w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${colors.bg} ${colors.text}`}
            >
              <span>{icon}</span>
              {ACTIVITY_TYPE_LABELS[log.activityType]}
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-white">
                Activity Log #{log.id}
              </p>
              <p className="text-[10px] text-gray-400">
                {dayjs(log.createdAt).format("DD/MM/YYYY HH:mm:ss")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(String(log.id));
              }}
              className="rounded p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Copy ID"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="rounded p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-4 dark:border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1 border-b-2 px-4 py-2.5 text-xs font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-4">
          {/* Info Tab */}
          {activeTab === "info" && (
            <>
              <Section title="Activity Information">
                <InfoRow label="Activity ID" value={`#${log.id}`} mono />
                <InfoRow
                  label="Activity Type"
                  value={
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${colors.bg} ${colors.text}`}>
                      <span>{icon}</span>
                      {ACTIVITY_TYPE_LABELS[log.activityType]}
                    </span>
                  }
                />
                <InfoRow label="Description" value={log.description} />
                <InfoRow label="Date & Time" value={dayjs(log.createdAt).format("DD/MM/YYYY HH:mm:ss")} />
              </Section>

              <Section title="User Information">
                <div className="mb-2 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                    {log.user.avatarUrl ? (
                      <img src={log.user.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-gray-500">
                        {log.user.fullName?.charAt(0) || "?"}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                      {log.user.fullName}
                    </p>
                    <p className="text-xs text-gray-400">{log.user.email}</p>
                  </div>
                </div>
                <InfoRow label="User ID" value={`#${log.user.id}`} mono />
                <InfoRow label="Email" value={log.user.email} />
              </Section>

              <Section title="Resource Affected">
                <InfoRow label="Resource Type" value={
                  log.resourceType ? (
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                      {log.resourceType}
                    </span>
                  ) : "—"
                } />
                <InfoRow label="Resource ID" value={log.resourceId ? `#${log.resourceId}` : "—"} mono />
              </Section>
            </>
          )}

          {/* Details Tab */}
          {activeTab === "details" && (
            <>
              <Section title="What Changed">
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                  {log.description}
                </p>
              </Section>

              {log.metadata && Object.keys(log.metadata).length > 0 && (
                <Section title="Additional Context">
                  <div className="space-y-1.5">
                    {Object.entries(log.metadata).map(([key, value]) => (
                      <InfoRow
                        key={key}
                        label={key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                        value={typeof value === "object" ? JSON.stringify(value) : String(value)}
                      />
                    ))}
                  </div>
                </Section>
              )}

              {(!log.metadata || Object.keys(log.metadata).length === 0) && (
                <div className="flex flex-col items-center justify-center py-8">
                  <svg className="mb-2 h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-xs text-gray-400">No additional metadata available</p>
                </div>
              )}
            </>
          )}

          {/* Session Tab */}
          {activeTab === "session" && (
            <>
              <Section title="Network Information">
                <InfoRow
                  label="IP Address"
                  value={
                    log.ipAddress ? (
                      <button
                        onClick={() => {
                          onFilterByIp(log.ipAddress!);
                          onClose();
                        }}
                        className="font-mono text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {log.ipAddress}
                      </button>
                    ) : "—"
                  }
                />
                <InfoRow
                  label="Location"
                  value={
                    log.geoCity || log.geoCountry
                      ? `${log.geoCity || ""}${log.geoCity && log.geoCountry ? ", " : ""}${log.geoCountry || ""}`
                      : "—"
                  }
                />
              </Section>

              <Section title="Device Information">
                <InfoRow label="Browser" value={ua.browser} />
                <InfoRow label="Operating System" value={ua.os} />
                <InfoRow label="Device Type" value={ua.device} />
                {log.userAgent && (
                  <div className="mt-2 rounded bg-gray-50 p-2 dark:bg-gray-900">
                    <p className="text-[10px] font-medium text-gray-400 mb-1">Full User Agent</p>
                    <p className="break-all font-mono text-[10px] text-gray-500">{log.userAgent}</p>
                  </div>
                )}
              </Section>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-between border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <button
            onClick={() => {
              onFilterByUser(log.user.id);
              onClose();
            }}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            View User's Activities
          </button>
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
