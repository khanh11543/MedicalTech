import { useEffect, useState, useCallback } from "react";
import PageMeta from "../../components/common/PageMeta";
import { FormSkeleton } from "../../components/ui/skeleton/Skeleton";
import {
  getDoctorProfile,
  updateDoctorProfile,
  uploadDoctorDocument,
  getDoctorDocuments,
  deleteDoctorDocument,
  getDocumentVerificationSummary,
  submitDoctorVerification,
  DoctorProfile,
  UpdateDoctorProfile,
  DoctorDocumentDTO,
  DocumentVerificationSummary,
} from "../../services/doctorService";

// ============ Document type config ============
const DOCUMENT_TYPES = [
  { value: "LICENSE", label: "Medical License", required: true },
  { value: "ID", label: "ID Card", required: true },
  { value: "DEGREE", label: "Degree Certificate", required: true },
  { value: "EXPERIENCE", label: "Experience Certificate", required: false },
  { value: "AFFILIATION_PROOF", label: "Affiliation Proof", required: false },
];

// ============ Status badge config ============
function getStatusBadge(status: string) {
  switch (status) {
    case "AWAITING_DOCUMENTS":
      return { label: "Awaiting Documents", color: "bg-yellow-100 text-yellow-800", icon: "📝" };
    case "PENDING":
      return { label: "Pending Review", color: "bg-blue-100 text-blue-800", icon: "⏳" };
    case "APPROVED":
      return { label: "Approved", color: "bg-green-100 text-green-800", icon: "✅" };
    case "VERIFIED":
      return { label: "Verified", color: "bg-green-100 text-green-800", icon: "✅" };
    case "REJECTED":
      return { label: "Rejected", color: "bg-red-100 text-red-800", icon: "❌" };
    case "SUSPENDED":
      return { label: "Suspended", color: "bg-orange-100 text-orange-800", icon: "⚠️" };
    case "REVOKED":
      return { label: "Revoked", color: "bg-red-100 text-red-800", icon: "🚫" };
    default:
      return { label: status, color: "bg-gray-100 text-gray-800", icon: "❓" };
  }
}

function getDocStatusBadge(status: string) {
  switch (status) {
    case "PENDING":
      return { label: "Pending", color: "bg-yellow-100 text-yellow-800" };
    case "APPROVED":
      return { label: "Approved", color: "bg-green-100 text-green-800" };
    case "REJECTED":
      return { label: "Rejected", color: "bg-red-100 text-red-800" };
    default:
      return { label: status, color: "bg-gray-100 text-gray-800" };
  }
}

export default function DoctorProfileSetup() {
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [documents, setDocuments] = useState<DoctorDocumentDTO[]>([]);
  const [docSummary, setDocSummary] = useState<DocumentVerificationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState<UpdateDoctorProfile>({
    specialization: "",
    licenseNumber: "",
    experienceYears: 0,
    education: "",
    bio: "",
    hospitalAffiliation: "",
    officeAddress: "",
  });

  // Upload states
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Active tab
  const [activeTab, setActiveTab] = useState<"profile" | "documents">("profile");

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [profileData, docs, summary] = await Promise.all([
        getDoctorProfile(),
        getDoctorDocuments(),
        getDocumentVerificationSummary(),
      ]);
      setProfile(profileData);
      setDocuments(docs);
      setDocSummary(summary);

      // Populate form
      setForm({
        specialization: profileData.specialization || "",
        licenseNumber: profileData.licenseNumber || "",
        experienceYears: profileData.experienceYears || 0,
        education: profileData.education || "",
        bio: profileData.bio || "",
        hospitalAffiliation: profileData.hospitalAffiliation || "",
        officeAddress: profileData.officeAddress || "",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load profile";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ========== PROFILE SAVE ==========
  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);
      const updated = await updateDoctorProfile(form);
      setProfile(updated);
      setSuccessMsg("Profile information saved successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err instanceof Error ? err.message : "Failed to save profile");
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  // ========== DOCUMENT UPLOAD ==========
  const handleFileUpload = async (docType: string, file: File) => {
    try {
      setUploadingType(docType);
      setUploadError(null);
      await uploadDoctorDocument(file, docType);
      // Refresh documents
      const [docs, summary, profileData] = await Promise.all([
        getDoctorDocuments(),
        getDocumentVerificationSummary(),
        getDoctorProfile(),
      ]);
      setDocuments(docs);
      setDocSummary(summary);
      setProfile(profileData);
      setSuccessMsg("Document uploaded successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err instanceof Error ? err.message : "Failed to upload document");
      setUploadError(message);
    } finally {
      setUploadingType(null);
    }
  };

  // ========== DOCUMENT DELETE ==========
  const handleDeleteDocument = async (docId: number) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      await deleteDoctorDocument(docId);
      const [docs, summary, profileData] = await Promise.all([
        getDoctorDocuments(),
        getDocumentVerificationSummary(),
        getDoctorProfile(),
      ]);
      setDocuments(docs);
      setDocSummary(summary);
      setProfile(profileData);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err instanceof Error ? err.message : "Failed to delete document");
      setError(message);
    }
  };

  // ========== SUBMIT VERIFICATION ==========
  const handleSubmitVerification = async () => {
    if (!confirm("Are you sure you want to submit for verification? After submission, you will not be able to edit until you receive a response.")) return;
    try {
      setSubmitting(true);
      setError(null);
      const updated = await submitDoctorVerification();
      setProfile(updated);
      setSuccessMsg("Verification submitted successfully! Please wait for admin approval.");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err instanceof Error ? err.message : "Failed to submit verification");
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const isEditable =
    profile?.verificationStatus === "AWAITING_DOCUMENTS" ||
    profile?.verificationStatus === "REJECTED";

  // ========== LOADING ==========
  if (loading) {
    return <FormSkeleton fields={6} />;
  }

  // ========== RENDER ==========
  const statusBadge = profile ? getStatusBadge(profile.verificationStatus) : null;

  return (
    <>
      <PageMeta title="Profile Setup | MediTech" description="Doctor profile setup and verification" />

      <div className="mx-auto max-w-4xl space-y-6">
        {/* ===== STATUS BANNER ===== */}
        {profile && statusBadge && (
          <div className={`rounded-xl border p-4 ${statusBadge.color}`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{statusBadge.icon}</span>
              <div>
                <h3 className="font-semibold text-lg">Verification Status: {statusBadge.label}</h3>
                {profile.verificationStatus === "AWAITING_DOCUMENTS" && (
                  <p className="text-sm mt-1">Please complete your professional information and upload the required documents.</p>
                )}
                {profile.verificationStatus === "PENDING" && (
                  <p className="text-sm mt-1">Your profile is being reviewed by admin. Please wait for a response.</p>
                )}
                {profile.verificationStatus === "REJECTED" && profile.rejectionReason && (
                  <p className="text-sm mt-1">Rejection reason: {profile.rejectionReason}</p>
                )}
                {profile.verificationStatus === "APPROVED" && (
                  <p className="text-sm mt-1">Your profile has been approved. You can now start practicing.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===== PROGRESS INDICATORS ===== */}
        {profile && profile.verificationStatus !== "APPROVED" && (
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Profile Completion Progress</h3>
            <div className="flex gap-4">
              <StepIndicator
                step={1}
                label="Professional Info"
                done={profile.profileComplete}
                active={activeTab === "profile"}
              />
              <StepIndicator
                step={2}
                label="Upload Documents"
                done={profile.documentsComplete}
                active={activeTab === "documents"}
              />
              <StepIndicator
                step={3}
                label="Submit Verification"
                done={profile.verificationStatus === "PENDING" || profile.verificationStatus === "APPROVED"}
                active={false}
              />
            </div>
          </div>
        )}

        {/* ===== MESSAGES ===== */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
            {error}
            <button onClick={() => setError(null)} className="float-right font-bold">&times;</button>
          </div>
        )}
        {successMsg && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-400">
            {successMsg}
          </div>
        )}

        {/* ===== TABS ===== */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "profile"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            📋 Professional Info
          </button>
          <button
            onClick={() => setActiveTab("documents")}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "documents"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            📄 Verification Documents
            {docSummary && (
              <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-full">
                {docSummary.totalDocuments}
              </span>
            )}
          </button>
        </div>

        {/* ===== TAB: PROFILE ===== */}
        {activeTab === "profile" && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Professional Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name (read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profile?.fullName || ""}
                  disabled
                  className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400"
                />
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="text"
                  value={profile?.email || ""}
                  disabled
                  className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400"
                />
              </div>

              {/* Specialization */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Specialization <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.specialization || ""}
                  onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                  disabled={!isEditable}
                  placeholder="e.g., Internal Medicine, Cardiology, Dermatology..."
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 disabled:text-gray-500 dark:disabled:bg-gray-600"
                />
              </div>

              {/* License Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  License Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.licenseNumber || ""}
                  onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                  disabled={!isEditable}
                  placeholder="e.g., LIC-12345"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 disabled:text-gray-500 dark:disabled:bg-gray-600"
                />
              </div>

              {/* Experience Years */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Years of Experience <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.experienceYears ?? 0}
                  onChange={(e) => setForm({ ...form, experienceYears: parseInt(e.target.value) || 0 })}
                  disabled={!isEditable}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 disabled:text-gray-500 dark:disabled:bg-gray-600"
                />
              </div>

              {/* Hospital Affiliation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Hospital / Medical Facility
                </label>
                <input
                  type="text"
                  value={form.hospitalAffiliation || ""}
                  onChange={(e) => setForm({ ...form, hospitalAffiliation: e.target.value })}
                  disabled={!isEditable}
                  placeholder="e.g., Bach Mai Hospital"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 disabled:text-gray-500 dark:disabled:bg-gray-600"
                />
              </div>

              {/* Education */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Education <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={form.education || ""}
                  onChange={(e) => setForm({ ...form, education: e.target.value })}
                  disabled={!isEditable}
                  placeholder="e.g., Doctor of Medicine - Hanoi Medical University (2010-2016)..."
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 disabled:text-gray-500 dark:disabled:bg-gray-600"
                />
              </div>

              {/* Office Address */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Office Address
                </label>
                <input
                  type="text"
                  value={form.officeAddress || ""}
                  onChange={(e) => setForm({ ...form, officeAddress: e.target.value })}
                  disabled={!isEditable}
                  placeholder="e.g., 78 Giai Phong, Dong Da, Hanoi"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 disabled:text-gray-500 dark:disabled:bg-gray-600"
                />
              </div>

              {/* Bio */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bio
                </label>
                <textarea
                  rows={4}
                  value={form.bio || ""}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  disabled={!isEditable}
                  placeholder="Brief description of your experience and expertise..."
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 disabled:text-gray-500 dark:disabled:bg-gray-600"
                />
              </div>
            </div>

            {/* Save button */}
            {isEditable && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-6 py-2.5 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? "Saving..." : "Save Information"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ===== TAB: DOCUMENTS ===== */}
        {activeTab === "documents" && (
          <div className="space-y-6">
            {/* Upload Error */}
            {uploadError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
                {uploadError}
                <button onClick={() => setUploadError(null)} className="float-right font-bold">&times;</button>
              </div>
            )}

            {/* Document type cards */}
            {DOCUMENT_TYPES.map((dt) => {
              const existingDocs = documents.filter((d) => d.docType === dt.value);
              const hasDoc = existingDocs.length > 0;
              const latestDoc = existingDocs[0]; // sorted by createdAt desc
              const docStatus = latestDoc ? getDocStatusBadge(latestDoc.status) : null;

              return (
                <div
                  key={dt.value}
                  className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {dt.label}
                        {dt.required && <span className="text-red-500 ml-1">*</span>}
                      </h3>
                      {docStatus && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${docStatus.color}`}>
                          {docStatus.label}
                        </span>
                      )}
                    </div>
                    {!dt.required && <span className="text-xs text-gray-400">Optional</span>}
                  </div>

                  {/* Existing documents */}
                  {existingDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg px-4 py-3 mb-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">
                          {doc.fileUrl?.endsWith(".pdf") ? "📑" : "🖼️"}
                        </span>
                        <div>
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                          >
                            {doc.fileUrl?.split("/").pop()}
                          </a>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Uploaded: {new Date(doc.createdAt).toLocaleDateString("en-US")}
                          </p>
                          {doc.reviewNote && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Note: {doc.reviewNote}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getDocStatusBadge(doc.status).color}`}>
                          {getDocStatusBadge(doc.status).label}
                        </span>
                        {doc.status === "PENDING" && isEditable && (
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="text-red-500 hover:text-red-700 text-sm"
                            title="Delete document"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Upload button */}
                  {isEditable && (
                    <div>
                      <label className="cursor-pointer inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors dark:border-gray-600 dark:text-gray-400 dark:hover:border-blue-400">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                          className="hidden"
                          disabled={uploadingType === dt.value}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(dt.value, file);
                            e.target.value = "";
                          }}
                        />
                        {uploadingType === dt.value ? (
                          <>
                            <span className="animate-spin">⏳</span> Uploading...
                          </>
                        ) : (
                          <>
                            📤 {hasDoc ? "Upload new version" : "Select and upload file"}
                          </>
                        )}
                      </label>
                      <p className="text-xs text-gray-400 mt-1">
                        Accepted: JPEG, PNG, GIF, WebP, PDF (max 10MB)
                      </p>
                    </div>
                  )}

                  {!isEditable && !hasDoc && (
                    <p className="text-sm text-gray-400 italic">Not uploaded</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ===== SUBMIT VERIFICATION BUTTON ===== */}
        {profile && profile.verificationStatus === "AWAITING_DOCUMENTS" && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Submit Verification</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {profile.canSubmitVerification
                    ? "Your profile is ready to submit for verification."
                    : "Please complete your professional information and upload all required documents."}
                </p>
                {!profile.profileComplete && (
                  <p className="text-xs text-red-500 mt-1">⚠️ Professional information is incomplete</p>
                )}
                {!profile.documentsComplete && (
                  <p className="text-xs text-red-500 mt-1">⚠️ Missing required documents (Medical License, ID Card, Degree)</p>
                )}
              </div>
              <button
                onClick={handleSubmitVerification}
                disabled={!profile.canSubmitVerification || submitting}
                className="rounded-lg bg-green-600 px-6 py-2.5 text-white font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
              >
                {submitting ? "Submitting..." : "Submit Verification"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ============ Step Indicator Component ============
function StepIndicator({
  step,
  label,
  done,
  active,
}: {
  step: number;
  label: string;
  done: boolean;
  active: boolean;
}) {
  return (
    <div className="flex items-center gap-2 flex-1">
      <div
        className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
          done
            ? "bg-green-500 text-white"
            : active
            ? "bg-blue-500 text-white"
            : "bg-gray-200 text-gray-500 dark:bg-gray-600 dark:text-gray-400"
        }`}
      >
        {done ? "✓" : step}
      </div>
      <span
        className={`text-sm ${
          done
            ? "text-green-600 dark:text-green-400 font-medium"
            : active
            ? "text-blue-600 dark:text-blue-400 font-medium"
            : "text-gray-500 dark:text-gray-400"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
