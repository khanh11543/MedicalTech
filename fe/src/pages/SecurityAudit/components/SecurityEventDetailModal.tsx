import { useState } from "react";
import Badge from "../../../components/ui/badge/Badge";
import {
  SecurityEventDTO,
  EVENT_TYPE_LABELS,
  SEVERITY_COLORS,
  STATUS_COLORS,
} from "../../../services/securityService";

interface Props {
  event: SecurityEventDTO;
  isOpen: boolean;
  onClose: () => void;
  onReview: (id: number) => void;
  onResolve: (id: number, note: string) => void;
  onBlockIp: (ip: string) => void;
  isReviewing: boolean;
  isResolving: boolean;
}

export default function SecurityEventDetailModal({
  event,
  isOpen,
  onClose,
  onReview,
  onResolve,
  onBlockIp,
  isReviewing,
  isResolving,
}: Props) {
  const [resolutionNote, setResolutionNote] = useState("");
  const [activeTab, setActiveTab] = useState<"event" | "ip" | "request">("event");

  if (!isOpen) return null;

  const formatDate = (d: string | null) =>
    d
      ? new Date(d).toLocaleString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      : "—";

  const getEventIcon = (eventType: string) => {
    const icons: Record<string, string> = {
      FAILED_LOGIN: "Login",
      ACCOUNT_LOCKOUT: "Lock",
      SUSPICIOUS_LOGIN_LOCATION: "Geo",
      MULTIPLE_FAILED_2FA: "2FA",
      PASSWORD_BRUTE_FORCE: "Brute",
      SQL_INJECTION_ATTEMPT: "SQL",
      XSS_ATTEMPT: "XSS",
      UNUSUAL_DATA_ACCESS: "Data",
      RAPID_API_CALLS: "API",
      FILE_UPLOAD_VIOLATION: "File",
      PASSWORD_CHANGED: "Pass",
      TWO_FA_ENABLED: "+2FA",
      TWO_FA_DISABLED: "-2FA",
      ROLE_CHANGED: "Role",
      ACCOUNT_UNLOCKED: "Unlock",
    };
    return icons[eventType] || "Alert";
  };

  const tabs = [
    { key: "event" as const, label: "Event Info" },
    { key: "ip" as const, label: "IP & Location" },
    { key: "request" as const, label: "Request Details" },
  ];

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 mx-4 w-full max-w-3xl rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {getEventIcon(event.eventType)}
            </span>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                {EVENT_TYPE_LABELS[event.eventType]}
              </h2>
              <p className="text-sm text-gray-500">Event #{event.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="light"
              size="sm"
              color={SEVERITY_COLORS[event.severity] as "error" | "warning" | "info"}
            >
              {event.severity}
            </Badge>
            <Badge
              variant="light"
              size="sm"
              color={STATUS_COLORS[event.status] as "warning" | "info" | "success"}
            >
              {event.status}
            </Badge>
            <button
              onClick={onClose}
              className="ml-2 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6 dark:border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-brand-500 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="max-h-[calc(100vh-300px)] overflow-y-auto px-6 py-5">
          {activeTab === "event" && (
            <div className="space-y-5">
              {/* Event Info */}
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="Event ID" value={`#${event.id}`} />
                <InfoRow label="Event Type" value={EVENT_TYPE_LABELS[event.eventType]} />
                <InfoRow label="Date & Time" value={formatDate(event.createdAt)} />
                <InfoRow label="Status" value={event.status} />
                {event.resolvedAt && (
                  <InfoRow label="Resolved At" value={formatDate(event.resolvedAt)} />
                )}
                {event.resolvedBy && (
                  <InfoRow label="Resolved By" value={event.resolvedBy.fullName} />
                )}
              </div>

              {/* Description */}
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                  Description
                </label>
                <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  {event.description || "No description available"}
                </p>
              </div>

              {/* User Info */}
              {event.user && (
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                    User Information
                  </label>
                  <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                      {event.user.fullName?.charAt(0) || "?"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">
                        {event.user.fullName}
                      </p>
                      <p className="text-xs text-gray-500">{event.user.email}</p>
                      <p className="text-xs text-gray-400">ID: {event.user.id}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Metadata */}
              {event.metadata && Object.keys(event.metadata).length > 0 && (
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                    Metadata
                  </label>
                  <pre className="max-h-40 overflow-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    {JSON.stringify(event.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {activeTab === "ip" && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="IP Address" value={event.ipAddress} mono />
                <InfoRow label="Country" value={event.geoCountry || "Unknown"} />
                <InfoRow label="City" value={event.geoCity || "Unknown"} />
                <InfoRow label="ISP" value={event.isp || "Unknown"} />
              </div>

              {/* User Agent */}
              {event.userAgent && (
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                    User Agent
                  </label>
                  <p className="rounded-lg bg-gray-50 p-3 text-xs font-mono text-gray-600 break-all dark:bg-gray-800 dark:text-gray-400">
                    {event.userAgent}
                  </p>
                </div>
              )}

              {/* Block IP Button */}
              <button
                onClick={() => onBlockIp(event.ipAddress)}
                className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                Block This IP
              </button>
            </div>
          )}

          {activeTab === "request" && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="Request URL" value={event.requestUrl || "—"} mono />
                <InfoRow label="Request Method" value={event.requestMethod || "—"} />
              </div>

              {event.requestHeaders && (
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                    Request Headers
                  </label>
                  <pre className="max-h-48 overflow-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    {JSON.stringify(event.requestHeaders, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {event.status === "NEW" && (
              <button
                onClick={() => onReview(event.id)}
                disabled={isReviewing}
                className="flex items-center gap-1.5 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50"
              >
                {isReviewing ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                )}
                Mark as Reviewed
              </button>
            )}
            {(event.status === "NEW" || event.status === "REVIEWED") && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Resolution note..."
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                />
                <button
                  onClick={() => {
                    onResolve(event.id, resolutionNote);
                    setResolutionNote("");
                  }}
                  disabled={isResolving}
                  className="flex items-center gap-1.5 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50"
                >
                  {isResolving ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  Resolve
                </button>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-gray-400 dark:text-gray-500">
        {label}
      </p>
      <p
        className={`mt-0.5 text-sm text-gray-800 dark:text-white/90 ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
