import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { TableSkeleton } from "../../components/ui/skeleton/Skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Badge from "../../components/ui/badge/Badge";
import { useWorkstation } from "../../context/WorkstationContext";
import { maskEmail } from "../../utils/privacyMask";
import adminService, { DoctorVerification as DoctorVerificationType, Page } from "../../services/adminService";

export default function DoctorVerification() {
  const navigate = useNavigate();
  const { settings: wsSettings } = useWorkstation();
  const [doctors, setDoctors] = useState<DoctorVerificationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const fetchDoctors = useCallback(async () => {
    try {
      setLoading(true);
      const params: { status?: string; pageNumber: number; pageSize: number } = {
        pageNumber: page,
        pageSize: pageSize,
      };
      if (statusFilter) {
        params.status = statusFilter;
      }

      const response: Page<DoctorVerificationType> = await adminService.getDoctorVerifications(params);
      setDoctors(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
      setError(null);
    } catch (err: unknown) {
      console.error("Failed to fetch doctor verifications:", err);
      let errorMessage = "Failed to load verification list. Please try again.";
      
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { status: number; data?: { message?: string } } };
        if (axiosError.response) {
          if (axiosError.response.status === 401) {
            errorMessage = "Session expired. Please log in again.";
          } else if (axiosError.response.status === 403) {
            errorMessage = "You do not have access.";
          } else if (axiosError.response.data?.message) {
            errorMessage = axiosError.response.data.message;
          }
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const getStatusBadgeColor = (status: string): "success" | "error" | "warning" | "info" | "light" => {
    switch (status) {
      case "VERIFIED":
      case "APPROVED": return "success";
      case "REJECTED":
      case "REVOKED": return "error";
      case "PENDING": return "warning";
      case "AWAITING_DOCUMENTS": return "info";
      case "SUSPENDED": return "light";
      default: return "info";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "AWAITING_DOCUMENTS": return "Awaiting Documents";
      case "PENDING": return "Pending";
      case "VERIFIED": return "Verified";
      case "APPROVED": return "Approved";
      case "REJECTED": return "Rejected";
      case "SUSPENDED": return "Suspended";
      case "REVOKED": return "Revoked";
      default: return status;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Stats from current page data
  const pendingCount = doctors.filter(d => d.verificationStatus === "PENDING").length;
  const verifiedCount = doctors.filter(d => d.verificationStatus === "VERIFIED" || d.verificationStatus === "APPROVED").length;
  const rejectedCount = doctors.filter(d => d.verificationStatus === "REJECTED").length;

  return (
    <>
      <PageMeta
        title="Doctor Verification | MediTech Admin"
        description="Manage doctor verification"
      />
      <PageBreadcrumb pageTitle="Doctor Verification" />
      
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Doctors</div>
            <div className="text-2xl font-bold text-gray-800 dark:text-white">{totalElements}</div>
          </div>
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
            <div className="text-sm text-yellow-600 dark:text-yellow-400">Pending</div>
            <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{pendingCount}</div>
          </div>
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
            <div className="text-sm text-green-600 dark:text-green-400">Verified</div>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">{verifiedCount}</div>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <div className="text-sm text-red-600 dark:text-red-400">Rejected</div>
            <div className="text-2xl font-bold text-red-700 dark:text-red-300">{rejectedCount}</div>
          </div>
        </div>

        {/* Main Content */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Doctor List</h3>
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
                <option value="">All</option>
                <option value="PENDING">Pending</option>
                <option value="AWAITING_DOCUMENTS">Awaiting Documents</option>
                <option value="VERIFIED">Verified</option>
                <option value="REJECTED">Rejected</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="REVOKED">Revoked</option>
              </select>
              <button
                onClick={fetchDoctors}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden">
            <div className="max-w-full overflow-x-auto">
              {loading ? (
                <TableSkeleton rows={5} cols={6} />
              ) : error ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <p className="text-red-500 mb-4">{error}</p>
                    <button
                      onClick={fetchDoctors}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : doctors.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">No doctors found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        Doctor
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        Specialization
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        License No.
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        Documents
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        Status
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        Submitted
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        Action
                      </TableCell>
                    </TableRow>
                  </TableHeader>

                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {doctors.map((doc) => (
                      <TableRow key={doc.doctorId}>
                        <TableCell className="px-5 py-4 sm:px-6 text-start">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 overflow-hidden rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                              {doc.avatarUrl ? (
                                <img src={doc.avatarUrl} alt={doc.fullName} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-blue-600 dark:text-blue-400 font-medium">
                                  {doc.fullName ? doc.fullName.charAt(0).toUpperCase() : "D"}
                                </span>
                              )}
                            </div>
                            <div>
                              <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90 block">
                                {doc.fullName || `Doctor #${doc.doctorId}`}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">{wsSettings.hideEmail ? maskEmail(doc.email) : doc.email}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {doc.specialization || "—"}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {doc.licenseNumber || "—"}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          <div className="flex items-center gap-1 text-xs">
                            <span className="text-green-600">{doc.approvedDocuments}✓</span>
                            <span className="text-yellow-600">{doc.pendingDocuments}⏳</span>
                            <span className="text-red-600">{doc.rejectedDocuments}✗</span>
                            <span className="text-gray-400">/ {doc.totalDocuments}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          <Badge size="sm" color={getStatusBadgeColor(doc.verificationStatus)}>
                            {getStatusLabel(doc.verificationStatus)}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {formatDate(doc.submittedAt)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          <button
                            onClick={() => navigate(`/admin/doctor-verification/${doc.doctorId}`)}
                            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            Review
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>

          {/* Pagination */}
          {!loading && !error && doctors.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Show:</span>
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
                  Page {page + 1} / {totalPages}
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
    </>
  );
}
