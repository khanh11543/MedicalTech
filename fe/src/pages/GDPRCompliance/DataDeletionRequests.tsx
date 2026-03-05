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
  DataDeletionRequestDTO,
  DeletionReviewDetailDTO,
  DeletionLogDTO,
  DeletionRequestFilter,
  DeletionRequestStatus,
} from "../../services/gdprService";

const STATUS_COLORS: Record<DeletionRequestStatus, "warning" | "info" | "primary" | "error" | "success"> = {
  PENDING: "warning",
  UNDER_REVIEW: "info",
  APPROVED: "primary",
  REJECTED: "error",
  COMPLETED: "success",
};

const STATUS_LABELS: Record<DeletionRequestStatus, string> = {
  PENDING: "Pending",
  UNDER_REVIEW: "Under Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  COMPLETED: "Completed",
};

const REJECTION_REASONS = [
  "Outstanding payments exist",
  "Active appointments pending",
  "Legal hold in effect",
  "Retention period not met",
  "Insufficient identity verification",
  "Other",
];

export default function DataDeletionRequests() {
  const [requests, setRequests] = useState<DataDeletionRequestDTO[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<DeletionRequestFilter>({
    page: 0,
    size: 10,
    sortBy: "createdAt",
    sortDirection: "desc",
  });

  // Review modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewDetail, setReviewDetail] = useState<DeletionReviewDetailDTO | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  // Approve modal
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveForm, setApproveForm] = useState({
    executeImmediately: false,
    scheduleDate: "",
    adminNotes: "",
    sendNotification: true,
  });
  const [approving, setApproving] = useState(false);

  // Reject modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectForm, setRejectForm] = useState({
    rejectionReason: "",
    additionalComments: "",
    sendNotification: true,
  });
  const [rejecting, setRejecting] = useState(false);

  // Request info modal
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [infoForm, setInfoForm] = useState({
    requiredInfo: "",
    deadline: "",
    sendNotification: true,
  });
  const [requestingInfo, setRequestingInfo] = useState(false);

  // Execute modal
  const [executeModalOpen, setExecuteModalOpen] = useState(false);
  const [executeForm, setExecuteForm] = useState({
    confirmationPhrase: "",
    adminPassword: "",
    adminNotes: "",
  });
  const [executing, setExecuting] = useState(false);

  // Deletion Log
  const [showLog, setShowLog] = useState(false);
  const [logs, setLogs] = useState<DeletionLogDTO[]>([]);
  const [logLoading, setLogLoading] = useState(false);

  // Selected request for actions
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

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

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await gdprService.getDeletionRequests(filter);
      setRequests(data.content);
      setTotalElements(data.totalElements);
      setTotalPages(data.totalPages);
    } catch {
      showToast("Failed to load deletion requests", "error");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleReview = async (id: number) => {
    setSelectedId(id);
    setReviewLoading(true);
    setReviewModalOpen(true);
    try {
      const detail = await gdprService.getReviewDetail(id);
      setReviewDetail(detail);
    } catch {
      showToast("Failed to load review details", "error");
      setReviewModalOpen(false);
    } finally {
      setReviewLoading(false);
    }
  };

  const openApprove = () => {
    setApproveForm({ executeImmediately: false, scheduleDate: "", adminNotes: "", sendNotification: true });
    setApproveModalOpen(true);
    setReviewModalOpen(false);
  };

  const submitApprove = async () => {
    if (selectedId === null) return;
    setApproving(true);
    try {
      await gdprService.approveDeletion(selectedId, {
        executeImmediately: approveForm.executeImmediately,
        scheduleDate: approveForm.executeImmediately ? undefined : approveForm.scheduleDate || undefined,
        adminNotes: approveForm.adminNotes,
        sendNotification: approveForm.sendNotification,
      });
      showToast("Deletion request approved", "success");
      setApproveModalOpen(false);
      loadRequests();
    } catch {
      showToast("Failed to approve request", "error");
    } finally {
      setApproving(false);
    }
  };

  const openReject = () => {
    setRejectForm({ rejectionReason: "", additionalComments: "", sendNotification: true });
    setRejectModalOpen(true);
    setReviewModalOpen(false);
  };

  const submitReject = async () => {
    if (selectedId === null) return;
    setRejecting(true);
    try {
      await gdprService.rejectDeletion(selectedId, rejectForm);
      showToast("Deletion request rejected", "success");
      setRejectModalOpen(false);
      loadRequests();
    } catch {
      showToast("Failed to reject request", "error");
    } finally {
      setRejecting(false);
    }
  };

  const openRequestInfo = () => {
    setInfoForm({ requiredInfo: "", deadline: "", sendNotification: true });
    setInfoModalOpen(true);
    setReviewModalOpen(false);
  };

  const submitRequestInfo = async () => {
    if (selectedId === null) return;
    setRequestingInfo(true);
    try {
      await gdprService.requestMoreInfo(selectedId, {
        ...infoForm,
        deadline: infoForm.deadline || undefined,
      });
      showToast("Information request sent", "success");
      setInfoModalOpen(false);
      loadRequests();
    } catch {
      showToast("Failed to send info request", "error");
    } finally {
      setRequestingInfo(false);
    }
  };

  const openExecute = (id: number) => {
    setSelectedId(id);
    setExecuteForm({ confirmationPhrase: "", adminPassword: "", adminNotes: "" });
    setExecuteModalOpen(true);
  };

  const submitExecute = async () => {
    if (selectedId === null) return;
    if (executeForm.confirmationPhrase !== "DELETE") {
      showToast('You must type "DELETE" to confirm', "error");
      return;
    }
    setExecuting(true);
    try {
      const result = await gdprService.executeDeletion(selectedId, executeForm);
      if (result.success) {
        showToast(`Successfully deleted ${result.totalDeletedRecords} records`, "success");
      } else {
        showToast(result.errorMessage || "Deletion failed", "error");
      }
      setExecuteModalOpen(false);
      loadRequests();
    } catch {
      showToast("Failed to execute deletion", "error");
    } finally {
      setExecuting(false);
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await gdprService.cancelDeletion(id, { cancelReason: "Cancelled by admin", sendNotification: true });
      showToast("Deletion request cancelled", "success");
      loadRequests();
    } catch {
      showToast("Failed to cancel request", "error");
    }
  };

  const loadDeletionLog = async () => {
    setLogLoading(true);
    try {
      const data = await gdprService.getDeletionLog(0, 20);
      setLogs(data.content);
    } catch {
      showToast("Failed to load deletion log", "error");
    } finally {
      setLogLoading(false);
    }
  };

  const toggleLog = () => {
    if (!showLog) loadDeletionLog();
    setShowLog(!showLog);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[99999] px-6 py-3 rounded-lg shadow-lg text-white ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
          {toast.message}
        </div>
      )}

      {/* Filters */}
      <ComponentCard title="Deletion Requests">
        <div className="flex flex-wrap items-end gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm"
              value={filter.status || ""}
              onChange={(e) => setFilter({ ...filter, status: (e.target.value || undefined) as DeletionRequestStatus | undefined, page: 0 })}
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From Date</label>
            <input
              type="date"
              className="px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm"
              value={filter.from || ""}
              onChange={(e) => setFilter({ ...filter, from: e.target.value || undefined, page: 0 })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To Date</label>
            <input
              type="date"
              className="px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm"
              value={filter.to || ""}
              onChange={(e) => setFilter({ ...filter, to: e.target.value || undefined, page: 0 })}
            />
          </div>
          <button
            onClick={() => setFilter({ page: 0, size: 10, sortBy: "createdAt", sortDirection: "desc" })}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={toggleLog}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors ml-auto"
          >
            {showLog ? "Hide Log" : "Deletion Log"}
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
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Reason</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Reviewed By</TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {loading ? (
                  <TableRow>
                    <td className="px-5 py-8 text-center text-gray-500" colSpan={7}>
                      <div className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        Loading...
                      </div>
                    </td>
                  </TableRow>
                ) : requests.length === 0 ? (
                  <TableRow>
                    <td className="px-5 py-8 text-center text-gray-500" colSpan={7}>
                      No deletion requests found
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
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400 max-w-[200px] truncate">
                        {req.reason || "—"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {req.reviewedByName || "—"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {(req.status === "PENDING" || req.status === "UNDER_REVIEW") && (
                            <button
                              onClick={() => handleReview(req.id)}
                              className="px-2.5 py-1 text-xs font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
                            >
                              Review
                            </button>
                          )}
                          {req.status === "APPROVED" && (
                            <>
                              <button
                                onClick={() => openExecute(req.id)}
                                className="px-2.5 py-1 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                              >
                                Execute
                              </button>
                              <button
                                onClick={() => handleCancel(req.id)}
                                className="px-2.5 py-1 text-xs font-medium text-white bg-gray-500 rounded-lg hover:bg-gray-600 transition-colors"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {req.status === "COMPLETED" && (
                            <Badge size="sm" color="success">Done</Badge>
                          )}
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
              Showing {(filter.page ?? 0) * (filter.size ?? 10) + 1} to{" "}
              {Math.min(((filter.page ?? 0) + 1) * (filter.size ?? 10), totalElements)} of {totalElements}
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={(filter.page ?? 0) === 0}
                onClick={() => setFilter({ ...filter, page: (filter.page ?? 0) - 1 })}
                className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Page {(filter.page ?? 0) + 1} of {totalPages}
              </span>
              <button
                disabled={(filter.page ?? 0) + 1 >= totalPages}
                onClick={() => setFilter({ ...filter, page: (filter.page ?? 0) + 1 })}
                className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </ComponentCard>

      {/* Deletion Log Section */}
      {showLog && (
        <ComponentCard title="Deletion Audit Log">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">User</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Executed By</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Date</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Records</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Summary</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Result</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {logLoading ? (
                    <TableRow>
                      <td className="px-5 py-8 text-center text-gray-500" colSpan={6}>Loading...</td>
                    </TableRow>
                  ) : logs.length === 0 ? (
                    <TableRow>
                      <td className="px-5 py-8 text-center text-gray-500" colSpan={6}>No deletion logs</td>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="px-5 py-4 text-start">
                          <div>
                            <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">{log.userFullName}</p>
                            <p className="text-xs text-gray-500">{log.userEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{log.executedByName}</TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{formatDate(log.executedDate)}</TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{log.deletedRecordsCount}</TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400 max-w-[200px] truncate">{log.deletedDataSummary}</TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          <Badge size="sm" color={log.success ? "success" : "error"}>
                            {log.success ? "Success" : "Failed"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </ComponentCard>
      )}

      {/* Review Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Review Deletion Request {selectedId ? `#${selectedId}` : ""}
              </h3>
            </div>
            {reviewLoading ? (
              <div className="p-12 text-center text-gray-500">
                <svg className="animate-spin h-8 w-8 mx-auto mb-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Loading details...
              </div>
            ) : reviewDetail ? (
              <div className="p-6 space-y-6">
                {/* User Info */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">User Information</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-gray-500">User ID:</span> <span className="font-medium dark:text-white">{reviewDetail.userId}</span></div>
                    <div><span className="text-gray-500">Name:</span> <span className="font-medium dark:text-white">{reviewDetail.userName}</span></div>
                    <div><span className="text-gray-500">Email:</span> <span className="font-medium dark:text-white">{reviewDetail.userEmail}</span></div>
                    <div><span className="text-gray-500">Role:</span> <span className="font-medium dark:text-white">{reviewDetail.userRole || "—"}</span></div>
                    <div><span className="text-gray-500">Account Created:</span> <span className="font-medium dark:text-white">{formatDate(reviewDetail.accountCreatedDate)}</span></div>
                    <div><span className="text-gray-500">Last Login:</span> <span className="font-medium dark:text-white">{formatDate(reviewDetail.lastLoginDate)}</span></div>
                  </div>
                </div>

                {/* Request Info */}
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Request Details</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400"><strong>Reason:</strong> {reviewDetail.reason || "No reason provided"}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1"><strong>Requested:</strong> {formatDate(reviewDetail.requestedDate)}</p>
                </div>

                {/* Data Summary */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Data Summary — What Will Be Deleted/Anonymized</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">User Profile</span>
                      <span className="text-red-500 font-medium">Will be deleted</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Appointments</span>
                      <span className="font-medium dark:text-white">{reviewDetail.appointmentCount} records (anonymized)</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Prescriptions</span>
                      <span className="font-medium dark:text-white">{reviewDetail.prescriptionCount} records (anonymized)</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Payments</span>
                      <span className="font-medium dark:text-white">{reviewDetail.paymentCount} transactions (anonymized)</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Reviews</span>
                      <span className="font-medium dark:text-white">{reviewDetail.reviewCount} reviews (deleted)</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Audit Logs</span>
                      <span className="text-orange-500 font-medium">User → "[DELETED USER]"</span>
                    </div>
                    <div className="flex items-center justify-between text-sm border-t pt-2 dark:border-gray-600">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Total Records</span>
                      <span className="font-bold text-gray-800 dark:text-white">{reviewDetail.totalRecords}</span>
                    </div>
                  </div>
                </div>

                {/* Legal Checks Warning */}
                {(reviewDetail.paymentCount > 0 || reviewDetail.appointmentCount > 0) && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <h4 className="text-sm font-medium text-red-700 dark:text-red-400 mb-2">Warnings</h4>
                    {reviewDetail.paymentCount > 0 && (
                      <p className="text-sm text-red-600 dark:text-red-400">• User has {reviewDetail.paymentCount} payment transaction(s)</p>
                    )}
                    {reviewDetail.appointmentCount > 0 && (
                      <p className="text-sm text-red-600 dark:text-red-400">• User has {reviewDetail.appointmentCount} appointment(s)</p>
                    )}
                  </div>
                )}
              </div>
            ) : null}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button onClick={() => setReviewModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 transition-colors">
                Close
              </button>
              <button onClick={openRequestInfo} className="px-4 py-2 text-sm font-medium text-white bg-yellow-500 rounded-lg hover:bg-yellow-600 transition-colors">
                Request Info
              </button>
              <button onClick={openReject} className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors">
                Reject
              </button>
              <button onClick={openApprove} className="px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors">
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {approveModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Approve Deletion</h3>
            </div>
            <div className="p-6 space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={approveForm.executeImmediately}
                  onChange={(e) => setApproveForm({ ...approveForm, executeImmediately: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Execute Immediately (skip 30-day grace period)</span>
              </label>
              {!approveForm.executeImmediately && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Schedule Date (default: 30 days)</label>
                  <input
                    type="datetime-local"
                    value={approveForm.scheduleDate}
                    onChange={(e) => setApproveForm({ ...approveForm, scheduleDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Admin Notes</label>
                <textarea
                  value={approveForm.adminNotes}
                  onChange={(e) => setApproveForm({ ...approveForm, adminNotes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={approveForm.sendNotification}
                  onChange={(e) => setApproveForm({ ...approveForm, sendNotification: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Notify User</span>
              </label>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button onClick={() => setApproveModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 transition-colors">Cancel</button>
              <button onClick={submitApprove} disabled={approving} className="px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50">
                {approving ? "Approving..." : "Approve Deletion"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Reject Deletion Request</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rejection Reason</label>
                <select
                  value={rejectForm.rejectionReason}
                  onChange={(e) => setRejectForm({ ...rejectForm, rejectionReason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
                >
                  <option value="">Select reason...</option>
                  {REJECTION_REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Additional Comments</label>
                <textarea
                  value={rejectForm.additionalComments}
                  onChange={(e) => setRejectForm({ ...rejectForm, additionalComments: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rejectForm.sendNotification}
                  onChange={(e) => setRejectForm({ ...rejectForm, sendNotification: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Notify User</span>
              </label>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button onClick={() => setRejectModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 transition-colors">Cancel</button>
              <button
                onClick={submitReject}
                disabled={rejecting || !rejectForm.rejectionReason}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {rejecting ? "Rejecting..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request More Info Modal */}
      {infoModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Request More Information</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">What information is needed?</label>
                <textarea
                  value={infoForm.requiredInfo}
                  onChange={(e) => setInfoForm({ ...infoForm, requiredInfo: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
                  placeholder="Describe what additional information is required..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Response Deadline (optional)</label>
                <input
                  type="date"
                  value={infoForm.deadline}
                  onChange={(e) => setInfoForm({ ...infoForm, deadline: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button onClick={() => setInfoModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 transition-colors">Cancel</button>
              <button
                onClick={submitRequestInfo}
                disabled={requestingInfo || !infoForm.requiredInfo}
                className="px-4 py-2 text-sm font-medium text-white bg-yellow-500 rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
              >
                {requestingInfo ? "Sending..." : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Execute Deletion Modal */}
      {executeModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-t-2xl">
              <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">Execute Data Deletion</h3>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">This action is PERMANENT and cannot be undone.</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type <span className="font-bold text-red-500">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={executeForm.confirmationPhrase}
                  onChange={(e) => setExecuteForm({ ...executeForm, confirmationPhrase: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
                  placeholder="Type DELETE here"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Admin Password</label>
                <input
                  type="password"
                  value={executeForm.adminPassword}
                  onChange={(e) => setExecuteForm({ ...executeForm, adminPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                <textarea
                  value={executeForm.adminNotes}
                  onChange={(e) => setExecuteForm({ ...executeForm, adminNotes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button onClick={() => setExecuteModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 transition-colors">Cancel</button>
              <button
                onClick={submitExecute}
                disabled={executing || executeForm.confirmationPhrase !== "DELETE" || !executeForm.adminPassword || !executeForm.adminNotes}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {executing ? "Executing..." : "DELETE PERMANENTLY"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
