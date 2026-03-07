import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useDoctorVerificationContext } from "../../context/DoctorVerificationContext";
import { getDocumentVerificationSummary, type DocumentVerificationSummary } from "../../services/doctorService";

const statusConfig: Record<string, { label: string; color: string; bgColor: string; description: string }> = {
  AWAITING_DOCUMENTS: {
    label: "Awaiting Documents",
    color: "text-amber-700",
    bgColor: "bg-amber-50 border-amber-200",
    description: "Please complete your profile and upload the required documents to begin the verification process.",
  },
  PENDING: {
    label: "Pending Approval",
    color: "text-blue-700",
    bgColor: "bg-blue-50 border-blue-200",
    description: "Your profile has been submitted and is awaiting admin review. This process may take 1-3 business days.",
  },
  REJECTED: {
    label: "Rejected",
    color: "text-red-700",
    bgColor: "bg-red-50 border-red-200",
    description: "Your verification has been rejected. Please review the reason and update your profile to resubmit.",
  },
  SUSPENDED: {
    label: "Suspended",
    color: "text-orange-700",
    bgColor: "bg-orange-50 border-orange-200",
    description: "Your account has been suspended. Please contact support for more information.",
  },
  REVOKED: {
    label: "Revoked",
    color: "text-gray-700",
    bgColor: "bg-gray-50 border-gray-200",
    description: "Your verification has been permanently revoked. Please contact support.",
  },
};

const steps = [
  { id: 1, title: "Create Account", description: "Register a doctor account" },
  { id: 2, title: "Complete Profile", description: "Update professional information" },
  { id: 3, title: "Upload Documents", description: "Medical license, ID card, degree" },
  { id: 4, title: "Submit Verification", description: "Submit for admin review" },
  { id: 5, title: "Approval", description: "Admin verifies and activates" },
];

function getActiveStep(status: string | null, profileComplete: boolean, documentsComplete: boolean): number {
  if (!status || status === "AWAITING_DOCUMENTS") {
    if (!profileComplete) return 2;
    if (!documentsComplete) return 3;
    return 4; // ready to submit
  }
  if (status === "PENDING") return 5;
  if (status === "REJECTED") return 2; // back to update profile
  if (status === "VERIFIED" || status === "APPROVED") return 6; // all done
  return 1;
}

export default function DoctorVerificationCenter() {
  const { verificationStatus, profile, refetch } = useDoctorVerificationContext();
  const [docSummary, setDocSummary] = useState<DocumentVerificationSummary | null>(null);

  useEffect(() => {
    getDocumentVerificationSummary()
      .then(setDocSummary)
      .catch(() => setDocSummary(null));
  }, []);

  const config = statusConfig[verificationStatus ?? "AWAITING_DOCUMENTS"] ?? statusConfig.AWAITING_DOCUMENTS;
  const activeStep = getActiveStep(
    verificationStatus,
    profile?.profileComplete ?? false,
    profile?.documentsComplete ?? false
  );

  const isSuspendedOrRevoked = verificationStatus === "SUSPENDED" || verificationStatus === "REVOKED";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Doctor Verification Center
        </h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Manage your doctor profile verification process
        </p>
      </div>

      {/* Status Banner */}
      <div className={`p-5 rounded-xl border-2 ${config.bgColor}`}>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-0.5">
            {verificationStatus === "PENDING" ? (
              <svg className="w-8 h-8 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : verificationStatus === "REJECTED" ? (
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div>
            <h2 className={`text-lg font-semibold ${config.color}`}>{config.label}</h2>
            <p className={`mt-1 text-sm ${config.color} opacity-80`}>{config.description}</p>
          </div>
        </div>

        {/* Rejection reason */}
        {verificationStatus === "REJECTED" && profile?.rejectionReason && (
          <div className="mt-4 p-3 bg-red-100 rounded-lg border border-red-200">
            <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
            <p className="mt-1 text-sm text-red-700">{profile.rejectionReason}</p>
          </div>
        )}
      </div>

      {/* Progress Steps — hide for suspended/revoked */}
      {!isSuspendedOrRevoked && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Verification Progress
          </h3>
          <div className="relative">
            {steps.map((step, index) => {
              const isCompleted = step.id < activeStep;
              const isCurrent = step.id === activeStep;
              return (
                <div key={step.id} className="flex items-start gap-4 mb-6 last:mb-0">
                  {/* Step line */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                        isCompleted
                          ? "bg-green-500 border-green-500 text-white"
                          : isCurrent
                          ? "border-brand-500 bg-brand-50 text-brand-600"
                          : "border-gray-300 bg-white text-gray-400"
                      }`}
                    >
                      {isCompleted ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        step.id
                      )}
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-0.5 h-8 ${isCompleted ? "bg-green-500" : "bg-gray-200"}`} />
                    )}
                  </div>
                  {/* Step content */}
                  <div className="pt-1">
                    <p className={`font-medium ${isCompleted ? "text-green-700" : isCurrent ? "text-brand-600" : "text-gray-500"}`}>
                      {step.title}
                    </p>
                    <p className="text-sm text-gray-400">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Document Summary */}
      {!isSuspendedOrRevoked && docSummary && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Uploaded Documents
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{docSummary.totalDocuments}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{docSummary.approvedCount}</p>
              <p className="text-xs text-gray-500">Approved</p>
            </div>
            <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">{docSummary.pendingCount}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{docSummary.rejectedCount}</p>
              <p className="text-xs text-gray-500">Rejected</p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <span className={`inline-flex items-center px-2 py-0.5 text-xs rounded-full ${docSummary.hasLicense ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {docSummary.hasLicense ? "✓" : "✗"} Medical License
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 text-xs rounded-full ${docSummary.hasId ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {docSummary.hasId ? "✓" : "✗"} ID Card
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 text-xs rounded-full ${docSummary.hasDegree ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {docSummary.hasDegree ? "✓" : "✗"} Degree Certificate
            </span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {(verificationStatus === "AWAITING_DOCUMENTS" || verificationStatus === "REJECTED") && (
          <Link
            to="/doctor/profile-setup"
            className="inline-flex items-center px-5 py-2.5 bg-brand-500 text-white font-medium rounded-lg hover:bg-brand-600 transition-colors"
          >
            {verificationStatus === "REJECTED" ? "Update & Resubmit" : "Complete Profile"}
          </Link>
        )}
        {!isSuspendedOrRevoked && (
          <Link
            to="/doctor/support"
            className="inline-flex items-center px-5 py-2.5 border border-gray-300 text-gray-700 dark:text-gray-300 dark:border-gray-600 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Contact Support
          </Link>
        )}
        {isSuspendedOrRevoked && (
          <Link
            to="/doctor/support"
            className="inline-flex items-center px-5 py-2.5 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors"
          >
            Contact Support
          </Link>
        )}
        <button
          onClick={refetch}
          className="inline-flex items-center px-5 py-2.5 border border-gray-300 text-gray-700 dark:text-gray-300 dark:border-gray-600 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Status
        </button>
      </div>
    </div>
  );
}
