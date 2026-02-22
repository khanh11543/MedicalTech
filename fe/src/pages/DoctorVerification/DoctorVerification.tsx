import { useEffect, useState, useCallback } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Badge from "../../components/ui/badge/Badge";
import adminService, { DoctorDocument, Page } from "../../services/adminService";

// Modal Component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>
        <div className="relative inline-block px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl dark:bg-gray-800 sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <span className="sr-only">Close</span>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function DoctorVerification() {
  const [documents, setDocuments] = useState<DoctorDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedDoc, setSelectedDoc] = useState<DoctorDocument | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        pageNumber: page,
        pageSize: pageSize,
        sortBy: "createdAt",
        sortOrder: "asc" as const,
        ...(statusFilter && { status: statusFilter }),
      };

      const response: Page<DoctorDocument> = await adminService.getDoctorDocuments(params);
      setDocuments(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
      setError(null);
    } catch (err: unknown) {
      console.error("Failed to fetch documents:", err);
      let errorMessage = "Failed to load documents. Please try again.";
      
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { status: number; data?: { message?: string } } };
        if (axiosError.response) {
          if (axiosError.response.status === 401) {
            errorMessage = "Unauthorized. Please login again.";
            setTimeout(() => {
              localStorage.clear();
              window.location.href = "/signin";
            }, 2000);
          } else if (axiosError.response.status === 403) {
            errorMessage = "Access denied. Admin role required.";
          } else if (axiosError.response.data?.message) {
            errorMessage = axiosError.response.data.message;
          }
        }
      } else if (err && typeof err === 'object' && 'request' in err) {
        errorMessage = "Cannot connect to server. Please check if backend is running.";
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleApprove = async (doc: DoctorDocument) => {
    if (!confirm(`Are you sure you want to approve the document for ${doc.doctorName}?`)) return;

    try {
      setActionLoading(true);
      await adminService.approveDocument(doc.id, "Approved by admin");
      fetchDocuments();
    } catch (err) {
      console.error("Failed to approve document:", err);
      alert("Failed to approve document");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectClick = (doc: DoctorDocument) => {
    setSelectedDoc(doc);
    setRejectNotes("");
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedDoc) return;
    if (!rejectNotes.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    try {
      setActionLoading(true);
      await adminService.rejectDocument(selectedDoc.id, rejectNotes);
      setShowRejectModal(false);
      setSelectedDoc(null);
      setRejectNotes("");
      fetchDocuments();
    } catch (err) {
      console.error("Failed to reject document:", err);
      alert("Failed to reject document");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "APPROVED": return "success";
      case "REJECTED": return "error";
      case "PENDING": return "warning";
      default: return "info";
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Stats
  const pendingCount = documents.filter(d => d.status === "PENDING").length;
  const approvedCount = documents.filter(d => d.status === "APPROVED").length;
  const rejectedCount = documents.filter(d => d.status === "REJECTED").length;

  return (
    <>
      <PageMeta
        title="Doctor Verification | MediTech Admin"
        description="Verify and manage doctor registrations in the MediTech system"
      />
      <PageBreadcrumb pageTitle="Doctor Verification" />
      
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Documents</div>
            <div className="text-2xl font-bold text-gray-800 dark:text-white">{totalElements}</div>
          </div>
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
            <div className="text-sm text-yellow-600 dark:text-yellow-400">Pending Review</div>
            <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{pendingCount}</div>
          </div>
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
            <div className="text-sm text-green-600 dark:text-green-400">Approved</div>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">{approvedCount}</div>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <div className="text-sm text-red-600 dark:text-red-400">Rejected</div>
            <div className="text-2xl font-bold text-red-700 dark:text-red-300">{rejectedCount}</div>
          </div>
        </div>

        {/* Main Content */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Doctor Documents</h3>
            <div className="flex items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                }}
                aria-label="Filter by status"
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden">
            <div className="max-w-full overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-3 text-gray-500 dark:text-gray-400">Loading documents...</span>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <p className="text-red-500 mb-4">{error}</p>
                    <button
                      onClick={fetchDocuments}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : documents.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">No documents found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        Doctor
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        Email
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        Document Type
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        Status
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        Submitted
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        Reviewed By
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHeader>

                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {documents.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="px-5 py-4 sm:px-6 text-start">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 overflow-hidden rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                              <span className="text-green-600 dark:text-green-400 font-medium">
                                {doc.doctorName ? doc.doctorName.charAt(0).toUpperCase() : "D"}
                              </span>
                            </div>
                            <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                              {doc.doctorName || `Doctor #${doc.doctorId}`}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {doc.doctorEmail}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          <Badge size="sm" color="info">{doc.documentType}</Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          <Badge size="sm" color={getStatusBadgeColor(doc.status)}>
                            {doc.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {formatDate(doc.createdAt)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {doc.reviewedBy || "-"}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          <div className="flex items-center gap-2">
                            {doc.status === "PENDING" && (
                              <>
                                <button
                                  onClick={() => handleApprove(doc)}
                                  disabled={actionLoading}
                                  className="px-3 py-1.5 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectClick(doc)}
                                  disabled={actionLoading}
                                  className="px-3 py-1.5 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            <a
                              href={doc.documentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
                            >
                              View
                            </a>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>

          {/* Pagination */}
          {!loading && !error && documents.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(0);
                  }}
                  aria-label="Rows per page"
                  className="px-2 py-1 border border-gray-300 rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 0}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Reject Document"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Please provide a reason for rejecting this document from {selectedDoc?.doctorName}.
          </p>
          <textarea
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
            placeholder="Enter rejection reason..."
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
          />
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowRejectModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleRejectConfirm}
              disabled={actionLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50"
            >
              {actionLoading ? "Rejecting..." : "Confirm Reject"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
