import { useState } from "react";
import {
  AuditLogStatsDTO,
  exportAuditLogs,
  downloadBlob,
} from "../../../services/securityService";
import dayjs from "dayjs";

interface Props {
  stats: AuditLogStatsDTO | undefined;
  isLoading: boolean;
}

type Standard = "HIPAA" | "GDPR" | "SOC2" | "CUSTOM";

const STANDARDS: { key: Standard; label: string; icon: string; desc: string }[] = [
  { key: "HIPAA", label: "HIPAA", icon: "", desc: "Health data access & modifications" },
  { key: "GDPR", label: "GDPR", icon: "", desc: "Personal data processing & consent" },
  { key: "SOC2", label: "SOC 2", icon: "", desc: "Security controls & access monitoring" },
  { key: "CUSTOM", label: "Custom", icon: "", desc: "Full audit trail report" },
];

export default function ComplianceReport({ stats, isLoading }: Props) {
  const [showPanel, setShowPanel] = useState(false);
  const [standard, setStandard] = useState<Standard>("HIPAA");
  const [dateFrom, setDateFrom] = useState(dayjs().subtract(30, "day").format("YYYY-MM-DD"));
  const [dateTo, setDateTo] = useState(dayjs().format("YYYY-MM-DD"));
  const [generating, setGenerating] = useState(false);

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const blob = await exportAuditLogs("pdf", { from: dateFrom, to: dateTo });
      downloadBlob(
        blob,
        `compliance_${standard}_${dateFrom}_to_${dateTo}.pdf`
      );
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  if (!showPanel) {
    return (
      <button
        onClick={() => setShowPanel(true)}
        className="flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 dark:border-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-300 dark:hover:bg-indigo-900/30"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        Compliance Report
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50/30 p-4 dark:border-indigo-800 dark:bg-indigo-900/10">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-800 dark:text-white">
          Compliance Report Generator
        </h4>
        <button
          onClick={() => setShowPanel(false)}
          className="rounded p-1 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Standard Selection */}
      <div className="mb-4">
        <label className="mb-2 block text-xs font-medium text-gray-600 dark:text-gray-400">
          Compliance Standard
        </label>
        <div className="grid grid-cols-4 gap-2">
          {STANDARDS.map((s) => (
            <button
              key={s.key}
              onClick={() => setStandard(s.key)}
              className={`rounded-lg border-2 p-2 text-left transition-colors ${
                standard === s.key
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                  : "border-gray-200 hover:border-gray-300 dark:border-gray-600"
              }`}
            >
              <div className="text-base">{s.icon}</div>
              <p className="text-xs font-semibold text-gray-800 dark:text-white">
                {s.label}
              </p>
              <p className="text-[10px] text-gray-400">{s.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Date Range */}
      <div className="mb-4 flex items-end gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
            From Date
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
            To Date
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div className="flex gap-1">
          {[
            { label: "7d", days: 7 },
            { label: "30d", days: 30 },
            { label: "90d", days: 90 },
          ].map(({ label, days }) => (
            <button
              key={label}
              onClick={() => {
                setDateFrom(dayjs().subtract(days, "day").format("YYYY-MM-DD"));
                setDateTo(dayjs().format("YYYY-MM-DD"));
              }}
              className="rounded border border-gray-300 px-2 py-1.5 text-[10px] text-gray-500 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Summary from Stats */}
      {stats && !isLoading && (
        <div className="mb-4 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-600 dark:bg-gray-800">
          <p className="mb-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
            Report will include:
          </p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-bold text-blue-600">{stats.totalLogs.toLocaleString()}</p>
              <p className="text-[10px] text-gray-400">Total Audit Entries</p>
            </div>
            <div>
              <p className="text-lg font-bold text-orange-600">
                {stats.sensitiveAccessCount}
              </p>
              <p className="text-[10px] text-gray-400">Sensitive Data Access</p>
            </div>
            <div>
              <p className="text-lg font-bold text-red-600">{stats.deleteCount}</p>
              <p className="text-[10px] text-gray-400">Delete Operations</p>
            </div>
          </div>

          <div className="mt-3 border-t border-gray-200 pt-2 dark:border-gray-600">
            <p className="mb-1 text-[10px] font-medium text-gray-500">
              {standard === "HIPAA" && "Focus areas: PHI access, data modifications, user authentication events, emergency access"}
              {standard === "GDPR" && "Focus areas: Personal data processing, consent changes, data subject access, cross-border transfers"}
              {standard === "SOC2" && "Focus areas: Logical access controls, system operations, change management, risk mitigation"}
              {standard === "CUSTOM" && "Full audit trail with all event types, user activities, and system changes"}
            </p>

            <div className="mt-2 flex flex-wrap gap-1">
              {standard === "HIPAA" && (
                <>
                  <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] text-red-700">Medical Records</span>
                  <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[10px] text-orange-700">Prescriptions</span>
                  <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-700">User Access</span>
                  <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] text-purple-700">Consent</span>
                </>
              )}
              {standard === "GDPR" && (
                <>
                  <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-700">User Data</span>
                  <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] text-purple-700">Consent</span>
                  <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] text-green-700">Data Exports</span>
                  <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] text-red-700">Deletions</span>
                </>
              )}
              {standard === "SOC2" && (
                <>
                  <span className="rounded bg-cyan-100 px-1.5 py-0.5 text-[10px] text-cyan-700">Logins</span>
                  <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] text-red-700">Security Events</span>
                  <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-[10px] text-yellow-700">Config Changes</span>
                  <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] text-indigo-700">IP Rules</span>
                </>
              )}
              {standard === "CUSTOM" && (
                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-700">All Event Types</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerateReport}
        disabled={generating}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {generating ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Generating Report...
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Generate {standard} Compliance Report (PDF)
          </>
        )}
      </button>
    </div>
  );
}
