import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import {
  AuditLogDTO,
  AuditLogDetailDTO,
  getAuditLogDetail,
  AUDIT_ACTION_COLORS,
  AUDIT_ACTION_LABELS,
  AUDIT_ENTITY_LABELS,
  AuditEntityType,
} from "../../../services/securityService";

interface Props {
  log: AuditLogDTO;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (id: number) => void;
  onFilterByIp: (ip: string) => void;
  onFilterByUser: (userId: number) => void;
  onFilterByEntity: (entityType: string, entityId: number) => void;
}

type Tab = "info" | "changes" | "metadata" | "related";

export default function AuditDetailModal({
  log,
  isOpen,
  onClose,
  onNavigate,
  onFilterByIp,
  onFilterByUser,
  onFilterByEntity,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("info");
  const [jsonView, setJsonView] = useState(false);

  const { data: detail, isLoading } = useQuery({
    queryKey: ["audit-log-detail", log.id],
    queryFn: () => getAuditLogDetail(log.id),
    enabled: isOpen,
  });

  if (!isOpen) return null;

  const colors = AUDIT_ACTION_COLORS[log.actionType] || AUDIT_ACTION_COLORS.UPDATE;

  const copyId = () => {
    navigator.clipboard.writeText(String(log.id));
    alert("Log ID copied!");
  };

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "info", label: "Information", icon: "" },
    { key: "changes", label: "Changes", icon: "" },
    { key: "metadata", label: "Metadata", icon: "" },
    { key: "related", label: "Related", icon: "" },
  ];

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative z-10 mx-4 flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${colors.bg} ${colors.text}`}
            >
              <span className={`h-2 w-2 rounded-full ${colors.dot}`} />
              {AUDIT_ACTION_LABELS[log.actionType]}
            </span>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Audit Log #{log.id}
              </h3>
              <p className="text-xs text-gray-500">
                {dayjs(log.createdAt).format("DD/MM/YYYY HH:mm:ss")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Navigation */}
            {detail?.previousId && (
              <button
                onClick={() => onNavigate(detail.previousId!)}
                className="rounded-lg border border-gray-300 p-1.5 text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                title="Previous log by this user"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            {detail?.nextId && (
              <button
                onClick={() => onNavigate(detail.nextId!)}
                className="rounded-lg border border-gray-300 p-1.5 text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                title="Next log by this user"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
            <button
              onClick={copyId}
              className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
              title="Copy Log ID"
            >
              Copy ID
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
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
              className={`flex items-center gap-1 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              <span className="text-xs">{tab.icon}</span>
              {tab.label}
              {tab.key === "changes" && detail?.changes?.length ? (
                <span className="ml-1 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  {detail.changes.length}
                </span>
              ) : null}
              {tab.key === "related" && detail?.relatedLogs?.length ? (
                <span className="ml-1 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                  {detail.relatedLogs.length}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-8 rounded bg-gray-100 dark:bg-gray-800" />
              ))}
            </div>
          ) : (
            <>
              {/* Info Tab */}
              {activeTab === "info" && detail && <InfoTab detail={detail} onFilterByUser={onFilterByUser} onFilterByEntity={onFilterByEntity} onClose={onClose} />}

              {/* Changes Tab */}
              {activeTab === "changes" && detail && (
                <ChangesTab detail={detail} jsonView={jsonView} onToggleJsonView={() => setJsonView(!jsonView)} />
              )}

              {/* Metadata Tab */}
              {activeTab === "metadata" && detail && (
                <MetadataTab detail={detail} onFilterByIp={onFilterByIp} onClose={onClose} />
              )}

              {/* Related Tab */}
              {activeTab === "related" && detail && (
                <RelatedTab
                  detail={detail}
                  onNavigate={onNavigate}
                  onFilterByUser={onFilterByUser}
                  onFilterByEntity={onFilterByEntity}
                  onClose={onClose}
                />
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3 dark:border-gray-700">
          <div className="flex gap-2">
            {log.user && (
              <button
                onClick={() => {
                  onFilterByUser(log.user!.id);
                  onClose();
                }}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                View User's All Logs
              </button>
            )}
            {log.entityId && (
              <button
                onClick={() => {
                  onFilterByEntity(log.entityType, log.entityId!);
                  onClose();
                }}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                View Entity's All Logs
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ==================== Sub-Components ==================== */

function InfoTab({
  detail,
  onFilterByUser,
  onFilterByEntity,
  onClose,
}: {
  detail: AuditLogDetailDTO;
  onFilterByUser: (id: number) => void;
  onFilterByEntity: (t: string, id: number) => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-5">
      {/* Log Entry */}
      <Section title="Log Entry Information">
        <InfoRow label="Log ID" value={`#${detail.id}`} mono />
        <InfoRow
          label="Timestamp"
          value={dayjs(detail.createdAt).format("DD/MM/YYYY HH:mm:ss")}
        />
        <InfoRow label="Action" value={detail.action} />
        <InfoRow
          label="Action Type"
          value={
            <ActionBadge actionType={detail.actionType} />
          }
        />
      </Section>

      {/* User Info */}
      <Section title="User Information">
        {detail.user ? (
          <>
            <InfoRow label="User ID" value={`#${detail.user.id}`} mono />
            <InfoRow label="Name" value={detail.user.fullName} />
            <InfoRow label="Email" value={detail.user.email} />
            <div className="flex justify-end">
              <button
                onClick={() => {
                  onFilterByUser(detail.user!.id);
                  onClose();
                }}
                className="text-xs text-blue-500 hover:underline"
              >
                View all logs by this user →
              </button>
            </div>
          </>
        ) : (
          <p className="py-2 text-center text-sm italic text-gray-400">
            System action (no user)
          </p>
        )}
      </Section>

      {/* Entity Info */}
      <Section title="Entity Information">
        <InfoRow
          label="Entity Type"
          value={
            AUDIT_ENTITY_LABELS[detail.entityType as AuditEntityType] ||
            detail.entityType
          }
        />
        <InfoRow
          label="Entity ID"
          value={
            detail.entityId ? (
              <button
                onClick={() => {
                  onFilterByEntity(detail.entityType, detail.entityId!);
                  onClose();
                }}
                className="font-mono text-blue-500 hover:underline"
              >
                #{detail.entityId}
              </button>
            ) : (
              "—"
            )
          }
        />
      </Section>
    </div>
  );
}

function ChangesTab({
  detail,
  jsonView,
  onToggleJsonView,
}: {
  detail: AuditLogDetailDTO;
  jsonView: boolean;
  onToggleJsonView: () => void;
}) {
  const hasChanges = detail.changes && detail.changes.length > 0;
  const hasRawValues = detail.oldValues || detail.newValues;

  return (
    <div className="space-y-4">
      {/* Toggle */}
      {(hasChanges || hasRawValues) && (
        <div className="flex justify-end">
          <button
            onClick={onToggleJsonView}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
              jsonView
                ? "border-indigo-300 bg-indigo-50 text-indigo-600 dark:border-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400"
                : "border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-300"
            }`}
          >
            {jsonView ? "Side-by-Side View" : "{ } JSON Diff View"}
          </button>
        </div>
      )}

      {!hasChanges && !hasRawValues && (
        <div className="flex flex-col items-center py-8 text-gray-400">
          <p className="text-sm">No changes recorded for this action</p>
          <p className="text-xs">
            This may be a {detail.actionType} action without field-level tracking
          </p>
        </div>
      )}

      {/* Side-by-Side View */}
      {!jsonView && hasChanges && (
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50">
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">
                  Field
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-red-500">
                  Before
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-green-500">
                  After
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {detail.changes.map((change, i) => (
                <tr key={i}>
                  <td className="px-3 py-2 font-mono text-xs font-medium text-gray-700 dark:text-gray-300">
                    {change.fieldName}
                  </td>
                  <td className="px-3 py-2">
                    <span className="rounded bg-red-50 px-1.5 py-0.5 font-mono text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">
                      {change.oldValue !== null && change.oldValue !== undefined
                        ? String(change.oldValue)
                        : "null"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="rounded bg-green-50 px-1.5 py-0.5 font-mono text-xs text-green-600 dark:bg-green-900/20 dark:text-green-400">
                      {change.newValue !== null && change.newValue !== undefined
                        ? String(change.newValue)
                        : "null"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* JSON View */}
      {jsonView && hasRawValues && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <h4 className="mb-1 text-xs font-semibold text-red-500">
              Old Values
            </h4>
            <pre className="max-h-60 overflow-auto rounded-lg bg-red-50 p-3 font-mono text-xs text-red-800 dark:bg-red-900/10 dark:text-red-300">
              {detail.oldValues
                ? JSON.stringify(detail.oldValues, null, 2)
                : "null"}
            </pre>
          </div>
          <div>
            <h4 className="mb-1 text-xs font-semibold text-green-500">
              New Values
            </h4>
            <pre className="max-h-60 overflow-auto rounded-lg bg-green-50 p-3 font-mono text-xs text-green-800 dark:bg-green-900/10 dark:text-green-300">
              {detail.newValues
                ? JSON.stringify(detail.newValues, null, 2)
                : "null"}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

function MetadataTab({
  detail,
  onFilterByIp,
  onClose,
}: {
  detail: AuditLogDetailDTO;
  onFilterByIp: (ip: string) => void;
  onClose: () => void;
}) {
  const parseUserAgent = (ua: string | null) => {
    if (!ua) return { browser: "Unknown", os: "Unknown", device: "Unknown" };
    const browser = ua.match(/(Chrome|Firefox|Safari|Edge|Opera|MSIE|Trident)/)?.[1] || "Unknown";
    const os = ua.match(/(Windows|Mac OS|Linux|Android|iOS)/)?.[1] || "Unknown";
    const device = /Mobile|Android|iPhone|iPad/.test(ua) ? "Mobile" : "Desktop";
    return { browser, os, device };
  };

  const uaInfo = parseUserAgent(detail.userAgent);

  return (
    <div className="space-y-5">
      <Section title="Network Information">
        <InfoRow
          label="IP Address"
          value={
            detail.ipAddress ? (
              <button
                onClick={() => {
                  onFilterByIp(detail.ipAddress!);
                  onClose();
                }}
                className="font-mono text-blue-500 hover:underline"
              >
                {detail.ipAddress}
              </button>
            ) : (
              "—"
            )
          }
        />
        <InfoRow
          label="Geolocation"
          value={
            detail.geoCountry
              ? `${detail.geoCity ? detail.geoCity + ", " : ""}${detail.geoCountry}`
              : "—"
          }
        />
      </Section>

      <Section title="Device Information">
        <InfoRow label="Browser" value={uaInfo.browser} />
        <InfoRow label="OS" value={uaInfo.os} />
        <InfoRow label="Device" value={uaInfo.device} />
        {detail.userAgent && (
          <div className="mt-2">
            <p className="mb-1 text-[11px] font-medium text-gray-500">
              Full User Agent
            </p>
            <p className="break-all rounded bg-gray-50 px-2 py-1.5 font-mono text-[11px] text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              {detail.userAgent}
            </p>
          </div>
        )}
      </Section>

      <Section title="Request Information">
        <InfoRow label="Request URL" value={detail.requestUrl || "—"} mono />
        <InfoRow label="Request Method" value={detail.requestMethod || "—"} />
      </Section>
    </div>
  );
}

function RelatedTab({
  detail,
  onNavigate,
  onFilterByUser,
  onFilterByEntity,
  onClose,
}: {
  detail: AuditLogDetailDTO;
  onNavigate: (id: number) => void;
  onFilterByUser: (id: number) => void;
  onFilterByEntity: (t: string, id: number) => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-5">
      {/* Navigation */}
      <Section title="Navigate by User">
        <div className="flex gap-2">
          <button
            onClick={() => detail.previousId && onNavigate(detail.previousId)}
            disabled={!detail.previousId}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            ← Previous Action (#{detail.previousId || "—"})
          </button>
          <button
            onClick={() => detail.nextId && onNavigate(detail.nextId)}
            disabled={!detail.nextId}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Next Action (#{detail.nextId || "—"}) →
          </button>
        </div>
      </Section>

      {/* Related Logs */}
      <Section title={`Other Actions on ${AUDIT_ENTITY_LABELS[detail.entityType as AuditEntityType] || detail.entityType} #${detail.entityId || "?"}`}>
        {detail.relatedLogs?.length ? (
          <div className="max-h-60 space-y-1.5 overflow-y-auto">
            {detail.relatedLogs.map((rl) => {
              const c = AUDIT_ACTION_COLORS[rl.actionType] || AUDIT_ACTION_COLORS.UPDATE;
              return (
                <button
                  key={rl.id}
                  onClick={() => onNavigate(rl.id)}
                  className="flex w-full items-center gap-3 rounded-lg border border-gray-100 p-2.5 text-left hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50"
                >
                  <span className={`h-2 w-2 rounded-full ${c.dot}`} />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-800 dark:text-white">
                      {AUDIT_ACTION_LABELS[rl.actionType]} — #{rl.id}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {dayjs(rl.createdAt).format("DD/MM/YYYY HH:mm:ss")}
                      {rl.user && ` by ${rl.user.fullName}`}
                    </p>
                  </div>
                  <svg className="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-gray-400">
            No other actions found for this entity
          </p>
        )}
      </Section>

      {/* Quick links */}
      <Section title="Quick Links">
        <div className="flex flex-wrap gap-2">
          {detail.user && (
            <button
              onClick={() => {
                onFilterByUser(detail.user!.id);
                onClose();
              }}
              className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400"
            >
              All logs by {detail.user.fullName}
            </button>
          )}
          {detail.entityId && (
            <button
              onClick={() => {
                onFilterByEntity(detail.entityType, detail.entityId!);
                onClose();
              }}
              className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400"
            >
              All logs for {detail.entityType} #{detail.entityId}
            </button>
          )}
        </div>
      </Section>
    </div>
  );
}

/* ==================== Shared UI ==================== */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
        {title}
      </h4>
      <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-3 dark:border-gray-700 dark:bg-gray-800/30">
        {children}
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
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {label}
      </span>
      <span
        className={`text-xs font-medium text-gray-800 dark:text-white ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function ActionBadge({ actionType }: { actionType: string }) {
  const colors =
    AUDIT_ACTION_COLORS[actionType as keyof typeof AUDIT_ACTION_COLORS] ||
    AUDIT_ACTION_COLORS.UPDATE;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${colors.bg} ${colors.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
      {AUDIT_ACTION_LABELS[actionType as keyof typeof AUDIT_ACTION_LABELS] || actionType}
    </span>
  );
}
