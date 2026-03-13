import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Toast from "../../components/common/Toast";
import { useToast } from "../../hooks/useToast";
import Badge from "../../components/ui/badge/Badge";
import { useWorkstation } from "../../context/WorkstationContext";
import { maskEmail } from "../../utils/privacyMask";
import { FormSkeleton } from "../../components/ui/skeleton/Skeleton";
import adminService, {
  DoctorVerification,
  DoctorVerificationDocument,
  VerificationDecision,
} from "../../services/adminService";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

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
    <div className="fixed inset-0 z-[99999] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"></div>
        <div className="relative inline-block px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl dark:bg-gray-800 sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
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

export default function VerificationDetail() {
  const { toast, showToast, dismissToast } = useToast();
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();
  const { settings: wsSettings } = useWorkstation();
  const [doctor, setDoctor] = useState<DoctorVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal states
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decisionType, setDecisionType] = useState<VerificationDecision["decision"]>("APPROVE");
  const [reason, setReason] = useState("");
  const [instructions, setInstructions] = useState("");

  const fetchDetail = useCallback(async () => {
    if (!doctorId) return;
    try {
      setLoading(true);
      const data = await adminService.getVerificationDetail(Number(doctorId));
      setDoctor(data);
      setError(null);
    } catch (err: unknown) {
      console.error("Failed to fetch verification detail:", err);
      setError("Failed to load doctor information.");
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const openDecisionModal = (type: VerificationDecision["decision"]) => {
    setDecisionType(type);
    setReason("");
    setInstructions("");
    setShowDecisionModal(true);
  };

  const handleDecisionSubmit = async () => {
    if (!doctor) return;

    // Validate reason for non-approve decisions
    if (decisionType !== "APPROVE" && !reason.trim()) {
      showToast("Please enter a reason.", "error");
      return;
    }

    try {
      setActionLoading(true);
      const decision: VerificationDecision = {
        decision: decisionType,
        reason: reason || undefined,
        instructions: instructions || undefined,
      };
      await adminService.submitVerificationDecision(doctor.doctorId, decision);
      setShowDecisionModal(false);
      fetchDetail();
      showToast(`Decision submitted: ${decisionType}`, "success");
    } catch (err: unknown) {
      console.error("Failed to submit decision:", err);
      let msg = "Action failed.";
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        if (axiosErr.response?.data?.message) msg = axiosErr.response.data.message;
      }
      showToast(msg, "error");
    } finally {
      setActionLoading(false);
    }
  };

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

  const getDocStatusBadgeColor = (status: string): "success" | "error" | "warning" | "info" => {
    switch (status) {
      case "APPROVED": return "success";
      case "REJECTED": return "error";
      case "PENDING": return "warning";
      default: return "info";
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

  const getDecisionModalTitle = () => {
    switch (decisionType) {
      case "APPROVE": return "Approve Doctor";
      case "REJECT": return "Reject Doctor";
      case "REQUEST_MORE_DOCUMENTS": return "Request More Documents";
      case "SUSPEND": return "Suspend Doctor";
      case "UNSUSPEND": return "Unsuspend Doctor";
      case "REVOKE": return "Revoke Verification";
      default: return "";
    }
  };

  const getDecisionButtonColor = () => {
    switch (decisionType) {
      case "APPROVE": return "bg-green-500 hover:bg-green-600";
      case "REJECT": return "bg-red-500 hover:bg-red-600";
      case "REQUEST_MORE_DOCUMENTS": return "bg-yellow-500 hover:bg-yellow-600";
      case "SUSPEND": return "bg-orange-500 hover:bg-orange-600";
      case "UNSUSPEND": return "bg-green-500 hover:bg-green-600";
      case "REVOKE": return "bg-red-700 hover:bg-red-800";
      default: return "bg-blue-500 hover:bg-blue-600";
    }
  };

  if (loading) {
    return <FormSkeleton fields={6} />;
  }

  if (error || !doctor) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || "Doctor not found."}</p>
          <button
            onClick={() => navigate("/admin/doctor-verification")}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Back to List
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta title={`Verification - ${doctor.fullName} | MediTech Admin`} description="Doctor verification details" />
      <PageBreadcrumb pageTitle="Verification Details" />

      <div className="space-y-6">
        {/* Back + Status Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/admin/doctor-verification")}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to list
          </button>
          <Badge size="sm" color={getStatusBadgeColor(doctor.verificationStatus)}>
            {getStatusLabel(doctor.verificationStatus)}
          </Badge>
        </div>

        {/* Doctor Profile Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center overflow-hidden flex-shrink-0">
              {doctor.avatarUrl ? (
                <img src={doctor.avatarUrl} alt={doctor.fullName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl text-blue-600 dark:text-blue-400 font-bold">
                  {doctor.fullName?.charAt(0).toUpperCase() || "D"}
                </span>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">{doctor.fullName}</h2>
              <p className="text-gray-500 dark:text-gray-400">{wsSettings.hideEmail ? maskEmail(doctor.email) : doctor.email}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                <InfoField label="Specialization" value={doctor.specialization} />
                <InfoField label="License No." value={doctor.licenseNumber} />
                <InfoField label="Experience" value={doctor.experienceYears ? `${doctor.experienceYears} years` : null} />
                <InfoField label="Education" value={doctor.education} />
                <InfoField label="Hospital" value={doctor.hospitalAffiliation} />
                <InfoField label="Office Address" value={doctor.officeAddress} />
              </div>

              {doctor.bio && (
                <div className="mt-4">
                  <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">Bio</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{doctor.bio}</p>
                </div>
              )}

              {doctor.rejectionReason && (
                <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800">
                  <span className="text-xs text-red-600 dark:text-red-400 uppercase font-medium">Rejection Reason / Note</span>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1 whitespace-pre-wrap">{doctor.rejectionReason}</p>
                </div>
              )}
            </div>
          </div>

          {/* Timeline info */}
          <div className="flex flex-wrap gap-6 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
            <span>Created: {formatDate(doctor.createdAt)}</span>
            <span>Submitted: {formatDate(doctor.submittedAt)}</span>
            {doctor.verifiedAt && <span>Verified: {formatDate(doctor.verifiedAt)}</span>}
            {doctor.verifiedByEmail && <span>Verified by: {doctor.verifiedByEmail}</span>}
          </div>
        </div>

        {/* Document Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total Documents" value={doctor.totalDocuments} color="gray" />
          <StatCard label="Approved" value={doctor.approvedDocuments} color="green" />
          <StatCard label="Pending" value={doctor.pendingDocuments} color="yellow" />
          <StatCard label="Rejected" value={doctor.rejectedDocuments} color="red" />
        </div>

        {/* Documents List */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Submitted Documents</h3>
          </div>

          {!doctor.documents || doctor.documents.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No documents submitted yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {doctor.documents.map((doc: DoctorVerificationDocument) => (
                <div key={doc.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white text-sm">
                        {doc.docTypeDescription || doc.docType}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Submitted: {formatDate(doc.createdAt)}
                        {doc.reviewedAt && ` | Reviewed: ${formatDate(doc.reviewedAt)}`}
                        {doc.reviewedByEmail && ` by ${doc.reviewedByEmail}`}
                      </p>
                      {doc.reviewNote && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">
                          Note: {doc.reviewNote}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge size="sm" color={getDocStatusBadgeColor(doc.status)}>
                      {doc.status === "APPROVED" ? "Approved" : doc.status === "REJECTED" ? "Rejected" : "Pending"}
                    </Badge>
                    {doc.fileUrl && (
                      <a
                        href={`${API_BASE}${doc.fileUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-xs font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        View
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Actions</h3>
          <div className="flex flex-wrap gap-3">
            {/* PENDING → can Approve, Reject, or Request More Docs */}
            {doctor.verificationStatus === "PENDING" && (
              <>
                <button
                  onClick={() => openDecisionModal("APPROVE")}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={() => openDecisionModal("REJECT")}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={() => openDecisionModal("REQUEST_MORE_DOCUMENTS")}
                  className="px-4 py-2 text-sm font-medium text-white bg-yellow-500 rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  Request More Documents
                </button>
              </>
            )}

            {/* VERIFIED/APPROVED → can Suspend or Revoke */}
            {(doctor.verificationStatus === "VERIFIED" || doctor.verificationStatus === "APPROVED") && (
              <>
                <button
                  onClick={() => openDecisionModal("SUSPEND")}
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Suspend
                </button>
                <button
                  onClick={() => openDecisionModal("REVOKE")}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-700 rounded-lg hover:bg-red-800 transition-colors"
                >
                  Revoke Verification
                </button>
              </>
            )}

            {/* SUSPENDED → can Unsuspend or Revoke */}
            {doctor.verificationStatus === "SUSPENDED" && (
              <>
                <button
                  onClick={() => openDecisionModal("UNSUSPEND")}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
                >
                  Unsuspend
                </button>
                <button
                  onClick={() => openDecisionModal("REVOKE")}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-700 rounded-lg hover:bg-red-800 transition-colors"
                >
                  Revoke Verification
                </button>
              </>
            )}

            {/* Show status-specific messages for non-actionable states */}
            {(doctor.verificationStatus === "AWAITING_DOCUMENTS" ||
              doctor.verificationStatus === "REJECTED" ||
              doctor.verificationStatus === "REVOKED") && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {doctor.verificationStatus === "AWAITING_DOCUMENTS" && "Doctor is completing documents. Waiting for resubmission."}
                {doctor.verificationStatus === "REJECTED" && "Application was rejected. Doctor can resubmit."}
                {doctor.verificationStatus === "REVOKED" && "Verification has been permanently revoked."}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Decision Modal */}
      <Modal isOpen={showDecisionModal} onClose={() => setShowDecisionModal(false)} title={getDecisionModalTitle()}>
        <div className="space-y-4">
          {decisionType === "APPROVE" ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Confirm approval of doctor <strong>{doctor.fullName}</strong>? 
              The doctor will be activated and can start practicing.
            </p>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
                />
              </div>
              {decisionType === "REQUEST_MORE_DOCUMENTS" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Additional Instructions
                  </label>
                  <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Detailed instructions for the doctor..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
                  />
                </div>
              )}
            </>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowDecisionModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleDecisionSubmit}
              disabled={actionLoading}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 ${getDecisionButtonColor()}`}
            >
              {actionLoading ? "Processing..." : "Confirm"}
            </button>
          </div>
        </div>
      </Modal>
      <Toast toast={toast} onDismiss={dismissToast} />
    </>
  );
}

// Helper Components
function InfoField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">{label}</span>
      <p className="text-sm font-medium text-gray-800 dark:text-white mt-0.5">{value || "—"}</p>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    gray: "border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]",
    green: "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20",
    yellow: "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20",
    red: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20",
  };
  const textColorMap: Record<string, string> = {
    gray: "text-gray-800 dark:text-white",
    green: "text-green-700 dark:text-green-300",
    yellow: "text-yellow-700 dark:text-yellow-300",
    red: "text-red-700 dark:text-red-300",
  };
  const labelColorMap: Record<string, string> = {
    gray: "text-gray-500 dark:text-gray-400",
    green: "text-green-600 dark:text-green-400",
    yellow: "text-yellow-600 dark:text-yellow-400",
    red: "text-red-600 dark:text-red-400",
  };

  return (
    <div className={`rounded-xl border p-4 ${colorMap[color]}`}>
      <div className={`text-sm ${labelColorMap[color]}`}>{label}</div>
      <div className={`text-2xl font-bold ${textColorMap[color]}`}>{value}</div>
    </div>
  );
}
