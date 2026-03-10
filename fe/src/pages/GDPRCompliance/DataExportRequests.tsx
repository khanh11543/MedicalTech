import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Badge from "../../components/ui/badge/Badge";
import ComponentCard from "../../components/common/ComponentCard";
import gdprService, {
  DataExportRequestDTO,
  ExportRequestFilter,
  ProcessExportRequestDTO,
  AutoProcessConfigDTO,
  ExportRequestStatus,
} from "../../services/gdprService";

const STATUS_COLORS: Record<ExportRequestStatus, "warning" | "info" | "success" | "error"> = {
  PENDING: "warning",
  PROCESSING: "info",
  COMPLETED: "success",
  FAILED: "error",
};

const STATUS_LABELS: Record<ExportRequestStatus, string> = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  COMPLETED: "Completed",
  FAILED: "Failed",
};

const FORMAT_OPTIONS = [
  { value: "JSON", label: "JSON (Machine-readable)" },
  { value: "CSV", label: "CSV (Spreadsheets)" },
  { value: "PDF", label: "PDF (Human-readable)" },
];

export default function DataExportRequests() {
  const [requests, setRequests] = useState<DataExportRequestDTO[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<ExportRequestFilter>({
    pageNumber: 0,
    pageSize: 10,
    sortBy: "requestedDate",
    sortDir: "DESC",
  });

  // Process modal
  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<DataExportRequestDTO | null>(null);
  const [processForm, setProcessForm] = useState<ProcessExportRequestDTO>({
    includeProfile: true,
    includeAppointments: true,
    includePrescriptions: true,
    includePayments: true,
    includeReviews: true,
    includeActivityLogs: true,
    format: "JSON",
    sendEmail: true,
  });
  const [processing, setProcessing] = useState(false);

  // Email modal
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailRequest, setEmailRequest] = useState<DataExportRequestDTO | null>(null);
  const [emailForm, setEmailForm] = useState({ email: "", customMessage: "" });
  const [sendingEmail, setSendingEmail] = useState(false);

  // Auto-process config
  const [autoConfig, setAutoConfig] = useState<AutoProcessConfigDTO>({ enabled: false, processWithinHours: 24 });
  const [autoConfigLoading, setAutoConfigLoading] = useState(false);

  // Delete confirm
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await gdprService.getExportRequests(filter);
      setRequests(data.content);
      setTotalElements(data.totalElements);
      setTotalPages(data.totalPages);
    } catch {
      showToast("Failed to load export requests", "error");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const loadAutoConfig = async () => {
    try {
      const config = await gdprService.getAutoProcessConfig();
      setAutoConfig(config);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    loadAutoConfig();
  }, []);

  const handleProcess = (req: DataExportRequestDTO) => {
    setSelectedRequest(req);
    setProcessForm({
      includeProfile: req.includeProfile ?? true,
      includeAppointments: req.includeAppointments ?? true,
      includePrescriptions: req.includePrescriptions ?? true,
      includePayments: req.includePayments ?? true,
      includeReviews: req.includeReviews ?? true,
      includeActivityLogs: req.includeActivityLogs ?? true,
      format: req.exportFormat ?? "JSON",
      sendEmail: true,
    });
    setProcessModalOpen(true);
  };

  const submitProcess = async () => {
    if (!selectedRequest) return;
    setProcessing(true);
    try {
      await gdprService.processExportRequest(selectedRequest.id, processForm);
      showToast("Export request processed successfully", "success");
      setProcessModalOpen(false);
      loadRequests();
    } catch {
      showToast("Failed to process export request", "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = async (req: DataExportRequestDTO) => {
    try {
      const blob = await gdprService.downloadExportFile(req.id);

      // Check if the response is actually an error (JSON error wrapped in blob)
      if (blob.type === "application/json" && blob.size < 1000) {
        const text = await blob.text();
        try {
          const err = JSON.parse(text);
          showToast(err.message || "Failed to download file", "error");
          return;
        } catch {
          // Not JSON, proceed with download
        }
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `export_${req.id}_${req.userName}.${req.exportFormat?.toLowerCase() || "json"}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast("Download started", "success");
    } catch {
      showToast("Failed to download file", "error");
    }
  };

  const handleSendEmail = (req: DataExportRequestDTO) => {
    setEmailRequest(req);
    setEmailForm({ email: req.userEmail, customMessage: "" });
    setEmailModalOpen(true);
  };

  const submitSendEmail = async () => {
    if (!emailRequest) return;
    setSendingEmail(true);
    try {
      await gdprService.sendExportEmail(emailRequest.id, emailForm);
      showToast("Email sent successfully", "success");
      setEmailModalOpen(false);
      loadRequests();
    } catch {
      showToast("Failed to send email", "error");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    setDeleting(true);
    try {
      await gdprService.deleteExportRequest(deleteId);
      showToast("Export request deleted", "success");
      setDeleteId(null);
      loadRequests();
    } catch {
      showToast("Failed to delete export request", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleAutoProcess = async () => {
    setAutoConfigLoading(true);
    try {
      const updated = await gdprService.toggleAutoProcess({
        enabled: !autoConfig.enabled,
        processWithinHours: autoConfig.processWithinHours,
      });
      setAutoConfig(updated);
      showToast(`Auto-process ${updated.enabled ? "enabled" : "disabled"}`, "success");
    } catch {
      showToast("Failed to update auto-process config", "error");
    } finally {
      setAutoConfigLoading(false);
    }
  };

  const handleAllDataCheckbox = (checked: boolean) => {
    setProcessForm({
      ...processForm,
      includeProfile: checked,
      includeAppointments: checked,
      includePrescriptions: checked,
      includePayments: checked,
      includeReviews: checked,
      includeActivityLogs: checked,
    });
  };

  const allSelected =
    processForm.includeProfile &&
    processForm.includeAppointments &&
    processForm.includePrescriptions &&
    processForm.includePayments &&
    processForm.includeReviews &&
    processForm.includeActivityLogs;

  const formatDate = (date: string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[99999] px-6 py-3 rounded-lg shadow-lg text-white ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
          {toast.message}
        </div>
      )}

      {/* Auto-Process Config */}
      <ComponentCard title="Auto-Process Configuration">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-800 dark:text-white/90">Auto-Process Export Requests</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Automatically generate and email exports within {autoConfig.processWithinHours} hours (GDPR: max 30 days)
            </p>
          </div>
          <div className="flex items-center gap-4">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={autoConfig.enabled}
                onChange={handleToggleAutoProcess}
                disabled={autoConfigLoading}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
            <Badge size="sm" color={autoConfig.enabled ? "success" : "light"}>
              {autoConfig.enabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
        </div>
      </ComponentCard>

      {/* Filters */}
      <ComponentCard title="Export Requests">
        <div className="flex flex-wrap items-end gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm"
              value={filter.status || ""}
              onChange={(e) => setFilter({ ...filter, status: e.target.value || undefined, pageNumber: 0 })}
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From Date</label>
            <input
              type="date"
              className="px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm"
              value={filter.from || ""}
              onChange={(e) => setFilter({ ...filter, from: e.target.value || undefined, pageNumber: 0 })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To Date</label>
            <input
              type="date"
              className="px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm"
              value={filter.to || ""}
              onChange={(e) => setFilter({ ...filter, to: e.target.value || undefined, pageNumber: 0 })}
            />
          </div>
          <button
            onClick={() => setFilter({ pageNumber: 0, pageSize: 10, sortBy: "requestedDate", sortDir: "DESC" })}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Reset
          </button>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">ID</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">User</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Request Date</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Status</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Format</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Size</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Completed</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {loading ? (
                  <TableRow>
                    <td className="px-5 py-8 text-center text-gray-500" colSpan={8}>
                      <div className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        Loading...
                      </div>
                    </td>
                  </TableRow>
                ) : requests.length === 0 ? (
                  <TableRow>
                    <td className="px-5 py-8 text-center text-gray-500" colSpan={8}>
                      No export requests found
                    </td>
                  </TableRow>
                ) : (
                  requests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="px-5 py-4 text-start">
                        <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">#{req.id}</span>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <div>
                          <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">{req.userName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{req.userEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {formatDate(req.requestedDate)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <Badge size="sm" color={STATUS_COLORS[req.status]}>
                          {STATUS_LABELS[req.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {req.exportFormat || "—"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {formatFileSize(req.fileSize)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {formatDate(req.processedDate)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {req.status === "PENDING" && (
                            <button
                              onClick={() => handleProcess(req)}
                              className="px-2.5 py-1 text-xs font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
                            >
                              Process
                            </button>
                          )}
                          {req.status === "COMPLETED" && (
                            <>
                              <button
                                onClick={() => handleDownload(req)}
                                className="px-2.5 py-1 text-xs font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
                              >
                                Download
                              </button>
                              <button
                                onClick={() => handleSendEmail(req)}
                                className="px-2.5 py-1 text-xs font-medium text-white bg-purple-500 rounded-lg hover:bg-purple-600 transition-colors"
                              >
                                Email
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setDeleteId(req.id)}
                            className="px-2.5 py-1 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {(filter.pageNumber ?? 0) * (filter.pageSize ?? 10) + 1} to{" "}
              {Math.min(((filter.pageNumber ?? 0) + 1) * (filter.pageSize ?? 10), totalElements)} of {totalElements}
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={(filter.pageNumber ?? 0) === 0}
                onClick={() => setFilter({ ...filter, pageNumber: (filter.pageNumber ?? 0) - 1 })}
                className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Page {(filter.pageNumber ?? 0) + 1} of {totalPages}
              </span>
              <button
                disabled={(filter.pageNumber ?? 0) + 1 >= totalPages}
                onClick={() => setFilter({ ...filter, pageNumber: (filter.pageNumber ?? 0) + 1 })}
                className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </ComponentCard>

      {/* Process Modal */}
      {processModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Process Export Request #{selectedRequest.id}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {selectedRequest.userName} ({selectedRequest.userEmail})
              </p>
            </div>
            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">User Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">User ID:</span> <span className="font-medium dark:text-white">{selectedRequest.userId}</span></div>
                  <div><span className="text-gray-500">Name:</span> <span className="font-medium dark:text-white">{selectedRequest.userName}</span></div>
                  <div className="col-span-2"><span className="text-gray-500">Email:</span> <span className="font-medium dark:text-white">{selectedRequest.userEmail}</span></div>
                </div>
              </div>

              {/* Data to Export */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Data to Export</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                    <input type="checkbox" checked={allSelected} onChange={(e) => handleAllDataCheckbox(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm font-medium text-gray-800 dark:text-white">All Data</span>
                  </label>
                  <div className="ml-6 space-y-2">
                    {[
                      { key: "includeProfile" as const, label: "Profile Information" },
                      { key: "includeAppointments" as const, label: "Appointments" },
                      { key: "includePrescriptions" as const, label: "Prescriptions" },
                      { key: "includePayments" as const, label: "Payments" },
                      { key: "includeReviews" as const, label: "Reviews Written" },
                      { key: "includeActivityLogs" as const, label: "Activity Logs" },
                    ].map((item) => (
                      <label key={item.key} className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={processForm[item.key]}
                          onChange={(e) => setProcessForm({ ...processForm, [item.key]: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Export Format */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Export Format</h4>
                <div className="space-y-2">
                  {FORMAT_OPTIONS.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                      <input
                        type="radio"
                        name="format"
                        value={opt.value}
                        checked={processForm.format === opt.value}
                        onChange={() => setProcessForm({ ...processForm, format: opt.value })}
                        className="border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Send Email Toggle */}
              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Send to User Email</span>
                <input
                  type="checkbox"
                  checked={processForm.sendEmail}
                  onChange={(e) => setProcessForm({ ...processForm, sendEmail: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </label>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setProcessModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitProcess}
                disabled={processing}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {processing && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                Generate Export
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {emailModalOpen && emailRequest && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Send Export via Email</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  value={emailForm.email}
                  onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Custom Message (optional)</label>
                <textarea
                  value={emailForm.customMessage}
                  onChange={(e) => setEmailForm({ ...emailForm, customMessage: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button onClick={() => setEmailModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 transition-colors">
                Cancel
              </button>
              <button onClick={submitSendEmail} disabled={sendingEmail} className="px-4 py-2 text-sm font-medium text-white bg-purple-500 rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 flex items-center gap-2">
                {sendingEmail && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                Send Email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Confirm Delete</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Are you sure you want to delete this export request? This action cannot be undone.
              </p>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50">
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
