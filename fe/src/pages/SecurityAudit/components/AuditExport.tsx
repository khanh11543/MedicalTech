import { useState } from "react";
import {
  AuditLogFilter,
  exportAuditLogs,
  downloadBlob,
} from "../../../services/securityService";
import dayjs from "dayjs";

interface Props {
  filter: AuditLogFilter;
  totalCount: number;
}

type ExportFormat = "csv" | "excel" | "pdf";

export default function AuditExport({ filter, totalCount }: Props) {
  const [showPanel, setShowPanel] = useState(false);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [exportScope, setExportScope] = useState<"filtered" | "all">("filtered");
  const [customFilter, setCustomFilter] = useState<AuditLogFilter>({});
  const [showCustom, setShowCustom] = useState(false);

  const handleExport = async (format: ExportFormat) => {
    setExporting(format);
    try {
      const f = exportScope === "filtered" ? filter : showCustom ? customFilter : {};
      const blob = await exportAuditLogs(format, f);
      const ext = format === "excel" ? "xlsx" : format === "pdf" ? "pdf" : "csv";
      downloadBlob(
        blob,
        `audit_logs_${dayjs().format("YYYY-MM-DD_HHmm")}.${ext}`
      );
    } catch (err: any) {
      alert(err?.response?.data?.message || "Export failed");
    } finally {
      setExporting(null);
    }
  };

  if (!showPanel) {
    return (
      <button
        onClick={() => setShowPanel(true)}
        className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Export Audit Logs
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-800 dark:text-white">
          Export Audit Logs
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

      {/* Export Scope */}
      <div className="mb-4 space-y-2">
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
          Export Scope
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setExportScope("filtered");
              setShowCustom(false);
            }}
            className={`flex-1 rounded-lg border-2 px-3 py-2 text-left transition-colors ${
              exportScope === "filtered" && !showCustom
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 hover:border-gray-300 dark:border-gray-600"
            }`}
          >
            <p className="text-xs font-medium text-gray-800 dark:text-white">
              Current Filters
            </p>
            <p className="text-[10px] text-gray-400">
              {totalCount} records match
            </p>
          </button>
          <button
            onClick={() => {
              setExportScope("all");
              setShowCustom(false);
            }}
            className={`flex-1 rounded-lg border-2 px-3 py-2 text-left transition-colors ${
              exportScope === "all" && !showCustom
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 hover:border-gray-300 dark:border-gray-600"
            }`}
          >
            <p className="text-xs font-medium text-gray-800 dark:text-white">
              All Records
            </p>
            <p className="text-[10px] text-gray-400">Export everything</p>
          </button>
          <button
            onClick={() => setShowCustom(!showCustom)}
            className={`flex-1 rounded-lg border-2 px-3 py-2 text-left transition-colors ${
              showCustom
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 hover:border-gray-300 dark:border-gray-600"
            }`}
          >
            <p className="text-xs font-medium text-gray-800 dark:text-white">
              Custom
            </p>
            <p className="text-[10px] text-gray-400">Pick criteria</p>
          </button>
        </div>
      </div>

      {/* Custom Filter Options */}
      {showCustom && (
        <div className="mb-4 grid grid-cols-2 gap-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-600 dark:bg-gray-800">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-500">
              User ID
            </label>
            <input
              type="number"
              value={customFilter.userId || ""}
              onChange={(e) =>
                setCustomFilter((f) => ({
                  ...f,
                  userId: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
              placeholder="Specific user"
              className="w-full rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-500">
              Search
            </label>
            <input
              type="text"
              value={customFilter.search || ""}
              onChange={(e) =>
                setCustomFilter((f) => ({
                  ...f,
                  search: e.target.value || undefined,
                }))
              }
              placeholder="Search term"
              className="w-full rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-500">
              From
            </label>
            <input
              type="datetime-local"
              value={customFilter.from || ""}
              onChange={(e) =>
                setCustomFilter((f) => ({ ...f, from: e.target.value || undefined }))
              }
              className="w-full rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-500">
              To
            </label>
            <input
              type="datetime-local"
              value={customFilter.to || ""}
              onChange={(e) =>
                setCustomFilter((f) => ({ ...f, to: e.target.value || undefined }))
              }
              className="w-full rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      )}

      {/* Export Format Buttons */}
      <div className="flex gap-2">
        {(
          [
            { format: "csv" as ExportFormat, label: "CSV", icon: "", desc: "Data only" },
            { format: "excel" as ExportFormat, label: "Excel", icon: "", desc: "Formatted" },
            { format: "pdf" as ExportFormat, label: "PDF", icon: "", desc: "Report" },
          ]
        ).map(({ format, label, icon, desc }) => (
          <button
            key={format}
            onClick={() => handleExport(format)}
            disabled={!!exporting}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {exporting === format ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
            ) : (
              <span>{icon}</span>
            )}
            <span>{label}</span>
            <span className="text-[10px] text-gray-400">({desc})</span>
          </button>
        ))}
      </div>

      {/* Export Info */}
      <p className="mt-2 text-[10px] text-gray-400">
        Export includes: all visible columns, filter criteria, export timestamp, and admin info
      </p>
    </div>
  );
}
