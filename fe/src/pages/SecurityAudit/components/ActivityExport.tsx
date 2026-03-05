import { useState } from "react";
import {
  ActivityLogFilter,
  exportActivityLogs,
  downloadBlob,
} from "../../../services/securityService";
import dayjs from "dayjs";

interface Props {
  filter: ActivityLogFilter;
  totalCount: number;
}

type ExportFormat = "csv" | "excel" | "pdf";

export default function ActivityExport({ filter, totalCount }: Props) {
  const [exporting, setExporting] = useState<ExportFormat | null>(null);

  const handleExport = async (format: ExportFormat) => {
    setExporting(format);
    try {
      const blob = await exportActivityLogs(format, filter);
      const ext = format === "excel" ? "xlsx" : format === "pdf" ? "pdf" : "csv";
      downloadBlob(blob, `activity_logs_${dayjs().format("YYYY-MM-DD_HHmm")}.${ext}`);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Export failed");
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-gray-400 mr-1">Export:</span>
      {(
        [
          { format: "csv" as ExportFormat, label: "CSV", icon: "" },
          { format: "excel" as ExportFormat, label: "Excel", icon: "" },
          { format: "pdf" as ExportFormat, label: "PDF", icon: "" },
        ]
      ).map(({ format, label, icon }) => (
        <button
          key={format}
          onClick={() => handleExport(format)}
          disabled={!!exporting}
          className="flex items-center gap-1 rounded-lg border border-gray-300 px-2 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          title={`Export as ${label}`}
        >
          {exporting === format ? (
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
          ) : (
            <span className="text-[10px]">{icon}</span>
          )}
          {label}
        </button>
      ))}
    </div>
  );
}
