import { useEffect, useState, useCallback } from "react";
import patientService from "../../../services/patientService";
import type {
  PatientDetailDTO,
  UpdatePatientDemographicDTO,
  PatientAppointmentDTO,
  PatientClinicalSummaryDTO,
  PatientDocumentDTO,
  PatientCommunicationDTO,
  PatientPaymentHistoryDTO,
  NotificationTemplateDTO,
} from "../../../services/patientService";
import { GenderBadge, InsuranceBadge, ActiveBadge, Spinner, Toast, Pagination, EmptyState } from "./SharedComponents";
import { useWorkstation } from "../../../context/WorkstationContext";
import { maskPhone, maskEmail } from "../../../utils/privacyMask";

interface PatientDetailProps {
  patientId: number;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

type DetailTab = "overview" | "appointments" | "clinical" | "documents" | "communications" | "payments";

const DETAIL_TABS: { key: DetailTab; label: string; icon: string }[] = [
  { key: "overview", label: "Overview", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  { key: "appointments", label: "Appointments", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { key: "clinical", label: "Clinical", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { key: "documents", label: "Documents", icon: "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" },
  { key: "communications", label: "Messages", icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
  { key: "payments", label: "Payments", icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" },
];

export default function PatientDetail({ patientId, isOpen, onClose, onUpdated }: PatientDetailProps) {
  const [patient, setPatient] = useState<PatientDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<UpdatePatientDemographicDTO>({});
  const [saving, setSaving] = useState(false);

  // Deactivate/Reactivate
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const fetchPatient = useCallback(async () => {
    if (!patientId) return;
    try {
      setLoading(true);
      const data = await patientService.getPatientDetail(patientId);
      setPatient(data);
      setEditData({
        phone: data.phone,
        email: data.email,
        address: data.address,
        insuranceNumber: data.insuranceNumber || "",
        insuranceProvider: data.insuranceProvider || "",
        emergencyContact: data.emergencyContact || "",
      });
    } catch (error) {
      console.error("Failed to fetch patient:", error);
      setToast({ message: "Failed to load patient details", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    if (isOpen && patientId) {
      fetchPatient();
      setActiveTab("overview");
      setEditing(false);
    }
  }, [isOpen, patientId, fetchPatient]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const updated = await patientService.updateDemographic(patientId, editData);
      setPatient(updated);
      setEditing(false);
      setToast({ message: "Patient demographics updated", type: "success" });
      onUpdated?.();
    } catch {
      setToast({ message: "Failed to update demographics", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    try {
      setDeactivating(true);
      await patientService.deactivatePatient(patientId);
      setToast({ message: "Patient deactivated successfully", type: "success" });
      setShowDeactivateConfirm(false);
      fetchPatient();
      onUpdated?.();
    } catch {
      setToast({ message: "Failed to deactivate patient", type: "error" });
    } finally {
      setDeactivating(false);
    }
  };

  const handleReactivate = async () => {
    try {
      setDeactivating(true);
      await patientService.reactivatePatient(patientId);
      setToast({ message: "Patient reactivated successfully", type: "success" });
      fetchPatient();
      onUpdated?.();
    } catch {
      setToast({ message: "Failed to reactivate patient", type: "error" });
    } finally {
      setDeactivating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Slide-over panel */}
      <div className="relative ml-auto w-full max-w-4xl bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto animate-slide-left">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              {patient && (
                <>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{patient.name}</h2>
                    <ActiveBadge isActive={patient.isActive} />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    MRN: {patient.mrn} · Since {new Date(patient.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </p>
                </>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Detail tabs */}
          <div className="flex gap-1 mt-4 overflow-x-auto">
            {DETAIL_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? "bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <Spinner />
          ) : !patient ? (
            <EmptyState message="Patient not found" />
          ) : (
            <>
              {activeTab === "overview" && (
                <OverviewTab
                  patient={patient}
                  editing={editing}
                  editData={editData}
                  saving={saving}
                  onEdit={() => setEditing(true)}
                  onCancel={() => {
                    setEditing(false);
                    setEditData({
                      phone: patient.phone,
                      email: patient.email,
                      address: patient.address,
                      insuranceNumber: patient.insuranceNumber || "",
                      insuranceProvider: patient.insuranceProvider || "",
                      emergencyContact: patient.emergencyContact || "",
                    });
                  }}
                  onSave={handleSave}
                  onChange={setEditData}
                  showDeactivateConfirm={showDeactivateConfirm}
                  onShowDeactivate={() => setShowDeactivateConfirm(true)}
                  onCancelDeactivate={() => setShowDeactivateConfirm(false)}
                  onDeactivate={handleDeactivate}
                  onReactivate={handleReactivate}
                  deactivating={deactivating}
                />
              )}
              {activeTab === "appointments" && <AppointmentsTab patientId={patientId} />}
              {activeTab === "clinical" && <ClinicalTab patientId={patientId} />}
              {activeTab === "documents" && <DocumentsTab patientId={patientId} />}
              {activeTab === "communications" && <CommunicationsTab patientId={patientId} />}
              {activeTab === "payments" && <PaymentsTab patientId={patientId} />}
            </>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ==================== Overview Tab ====================
function OverviewTab({
  patient,
  editing,
  editData,
  saving,
  onEdit,
  onCancel,
  onSave,
  onChange,
  showDeactivateConfirm,
  onShowDeactivate,
  onCancelDeactivate,
  onDeactivate,
  onReactivate,
  deactivating,
}: {
  patient: PatientDetailDTO;
  editing: boolean;
  editData: UpdatePatientDemographicDTO;
  saving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onChange: (data: UpdatePatientDemographicDTO) => void;
  showDeactivateConfirm: boolean;
  onShowDeactivate: () => void;
  onCancelDeactivate: () => void;
  onDeactivate: () => void;
  onReactivate: () => void;
  deactivating: boolean;
}) {
  const { settings: wsSettings } = useWorkstation();

  return (
    <div className="space-y-6">
      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-brand-600 dark:text-brand-400">{patient.totalAppointments}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Appointments</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{patient.completedAppointments}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Completed</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{patient.cancelledAppointments}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Cancelled</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{patient.noShowAppointments}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">No-Show</div>
        </div>
      </div>

      {/* Personal info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Personal Information</h3>
          {!editing ? (
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={onCancel}
                className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onSave}
                disabled={saving}
                className="px-3 py-1.5 text-sm bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Read-only fields */}
          <InfoField label="Full Name" value={patient.name} />
          <InfoField label="Date of Birth" value={patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—"} />
          <InfoField label="Age" value={patient.age ? `${patient.age} years` : "—"} />
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Gender</span>
            <GenderBadge gender={patient.gender} />
          </div>
          <InfoField label="MRN" value={patient.mrn} />
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Verified</span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${patient.isVerified ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"}`}>
              {patient.isVerified ? "✓ Verified" : "Not verified"}
            </span>
          </div>

          {/* Editable fields */}
          {editing ? (
            <>
              <EditField label="Phone" value={editData.phone || ""} onChange={(v) => onChange({ ...editData, phone: v })} />
              <EditField label="Email" value={editData.email || ""} onChange={(v) => onChange({ ...editData, email: v })} type="email" />
              <EditField label="Address" value={editData.address || ""} onChange={(v) => onChange({ ...editData, address: v })} className="md:col-span-2" />
              <EditField label="Insurance Number" value={editData.insuranceNumber || ""} onChange={(v) => onChange({ ...editData, insuranceNumber: v })} />
              <EditField label="Insurance Provider" value={editData.insuranceProvider || ""} onChange={(v) => onChange({ ...editData, insuranceProvider: v })} />
              <EditField label="Emergency Contact" value={editData.emergencyContact || ""} onChange={(v) => onChange({ ...editData, emergencyContact: v })} className="md:col-span-2" />
            </>
          ) : (
            <>
              <InfoField label="Phone" value={wsSettings.hidePhoneNumber ? maskPhone(patient.phone) : (patient.phone || "—")} />
              <InfoField label="Email" value={wsSettings.hideEmail ? maskEmail(patient.email) : (patient.email || "—")} />
              <InfoField label="Address" value={patient.address || "—"} className="md:col-span-2" />
              <InfoField label="Insurance Number" value={patient.insuranceNumber || "—"} />
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Insurance</span>
                <InsuranceBadge status={patient.insuranceStatus} />
                {patient.insuranceProvider && (
                  <span className="text-xs text-gray-500 ml-2">{patient.insuranceProvider}</span>
                )}
              </div>
              <InfoField label="Emergency Contact" value={patient.emergencyContact || "—"} className="md:col-span-2" />
            </>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-xs text-gray-500 dark:text-gray-400 flex flex-wrap gap-4">
        <span>Last Visit: {patient.lastVisit || "Never"}</span>
        <span>Created: {new Date(patient.createdAt).toLocaleString()}</span>
        <span>Updated: {new Date(patient.updatedAt).toLocaleString()}</span>
      </div>

      {/* Deactivate / Reactivate */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Account Status</h3>
        {patient.isActive ? (
          <>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              This patient is currently <span className="font-medium text-green-600 dark:text-green-400">active</span>.
              Deactivating will soft-delete the patient record. This can be reversed later.
            </p>
            {!showDeactivateConfirm ? (
              <button
                onClick={onShowDeactivate}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                Deactivate Patient
              </button>
            ) : (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-red-700 dark:text-red-300">Are you sure?</p>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      The patient will be marked as inactive. Any pending appointments should be handled first.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={onCancelDeactivate}
                    className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onDeactivate}
                    disabled={deactivating}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {deactivating ? "Deactivating..." : "Confirm Deactivate"}
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              This patient is currently <span className="font-medium text-red-600 dark:text-red-400">deactivated</span>.
              You can reactivate to restore their record.
            </p>
            <button
              onClick={onReactivate}
              disabled={deactivating}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 disabled:opacity-50 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {deactivating ? "Reactivating..." : "Reactivate Patient"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function InfoField({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">{label}</span>
      <span className="text-sm text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}

function EditField({
  label,
  value,
  onChange,
  type = "text",
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
      />
    </div>
  );
}

// ==================== Appointments Tab ====================
function AppointmentsTab({ patientId }: { patientId: number }) {
  const [appointments, setAppointments] = useState<PatientAppointmentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const data = await patientService.getPatientAppointments(patientId, { page, size: 10 });
      setAppointments(data?.content || []);
      setTotalPages(data?.totalPages || 0);
      setTotalElements(data?.totalElements || 0);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [patientId, page]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const statusColor: Record<string, string> = {
    CONFIRMED: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    PENDING: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    CANCELLED: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    COMPLETED: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    CHECKED_IN: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
    NO_SHOW: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  };

  if (loading) return <Spinner />;
  if (appointments.length === 0) return <EmptyState message="No appointments found" />;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Code</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Time</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Doctor</th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {appointments.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-3 py-2 text-sm font-mono text-brand-600 dark:text-brand-400">{a.appointmentCode}</td>
                <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">{a.appointmentDate}</td>
                <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">{a.startTime} – {a.endTime}</td>
                <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">{a.doctorName}</td>
                <td className="px-3 py-2 text-center">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[a.status] || "bg-gray-100 text-gray-700"}`}>
                    {a.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 max-w-[200px] truncate">{a.reasonForVisit || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} totalElements={totalElements} pageSize={10} onPageChange={setPage} />
      )}
    </div>
  );
}

// ==================== Clinical Tab ====================
function ClinicalTab({ patientId }: { patientId: number }) {
  const [summary, setSummary] = useState<PatientClinicalSummaryDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await patientService.getClinicalSummary(patientId);
        setSummary(data);
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    })();
  }, [patientId]);

  if (loading) return <Spinner />;
  if (!summary) return <EmptyState message="No clinical data available" />;

  return (
    <div className="space-y-4">
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl px-4 py-3 text-sm text-yellow-700 dark:text-yellow-300">
        As a receptionist, you can only view a summary. Detailed clinical records are accessible to medical staff.
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{summary.totalMedicalRecords}</div>
          <div className="text-xs text-gray-500 mt-1">Medical Records</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{summary.totalPrescriptions}</div>
          <div className="text-xs text-gray-500 mt-1">Prescriptions</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{summary.totalCompletedVisits}</div>
          <div className="text-xs text-gray-500 mt-1">Completed Visits</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{summary.hasClinicalData ? "Yes" : "No"}</div>
          <div className="text-xs text-gray-500 mt-1">Has Clinical Data</div>
        </div>
      </div>
    </div>
  );
}

// ==================== Documents Tab ====================
function DocumentsTab({ patientId }: { patientId: number }) {
  const [documents, setDocuments] = useState<PatientDocumentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const fetchDocs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await patientService.getPatientDocuments(patientId);
      setDocuments(data || []);
    } catch {
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      await patientService.uploadDocument(patientId, file, "GENERAL");
      setToast({ message: "Document uploaded successfully", type: "success" });
      fetchDocs();
    } catch {
      setToast({ message: "Upload failed", type: "error" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      {/* Upload */}
      <div className="flex justify-end">
        <label className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors text-sm cursor-pointer">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          {uploading ? "Uploading..." : "Upload Document"}
          <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {documents.length === 0 ? (
        <EmptyState message="No documents uploaded" />
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{doc.fileName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {doc.documentType} · {formatFileSize(doc.fileSize)} · {new Date(doc.uploadedAt).toLocaleDateString()} · by {doc.uploadedByName}
                </p>
                {doc.notes && <p className="text-xs text-gray-400 mt-0.5">{doc.notes}</p>}
              </div>
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-brand-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </a>
            </div>
          ))}
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ==================== Communications Tab ====================
function CommunicationsTab({ patientId }: { patientId: number }) {
  const [messages, setMessages] = useState<PatientCommunicationDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Send message state
  const [templates, setTemplates] = useState<NotificationTemplateDTO[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<"EMAIL" | "SMS">("EMAIL");
  const [sending, setSending] = useState(false);
  const [showSendForm, setShowSendForm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const data = await patientService.getCommunicationLog(patientId, { page, size: 10 });
      setMessages(data?.content || []);
      setTotalPages(data?.totalPages || 0);
      setTotalElements(data?.totalElements || 0);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [patientId, page]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Load templates when form is opened
  useEffect(() => {
    if (showSendForm && templates.length === 0) {
      patientService.getMessageTemplates().then(setTemplates).catch(() => setTemplates([]));
    }
  }, [showSendForm, templates.length]);

  const handleSendMessage = async () => {
    if (!selectedTemplate) return;
    try {
      setSending(true);
      await patientService.sendMessage(patientId, selectedChannel, selectedTemplate);
      setToast({ message: `Message sent via ${selectedChannel}`, type: "success" });
      setSelectedTemplate("");
      setShowSendForm(false);
      fetchMessages(); // refresh log
    } catch {
      setToast({ message: "Failed to send message", type: "error" });
    } finally {
      setSending(false);
    }
  };

  const channelIcon: Record<string, string> = {
    EMAIL: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    SMS: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
    PUSH: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
  };

  const filteredTemplates = templates.filter(
    (t) => t.active && (t.channel === selectedChannel || t.channel === "ALL")
  );

  return (
    <div className="space-y-4">
      {/* Send Message Section */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowSendForm(!showSendForm)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          {showSendForm ? "Cancel" : "Send Message"}
        </button>
      </div>

      {showSendForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Send Template Message</h4>

          {/* Channel selection */}
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1.5">Channel</label>
            <div className="flex gap-2">
              {(["EMAIL", "SMS"] as const).map((ch) => (
                <button
                  key={ch}
                  onClick={() => { setSelectedChannel(ch); setSelectedTemplate(""); }}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedChannel === ch
                      ? "bg-brand-500 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={channelIcon[ch]} />
                  </svg>
                  {ch}
                </button>
              ))}
            </div>
          </div>

          {/* Template selection */}
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1.5">Template</label>
            {filteredTemplates.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No templates available for {selectedChannel}</p>
            ) : (
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                <option value="">-- Select a template --</option>
                {filteredTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} — {t.category}
                  </option>
                ))}
              </select>
            )}
            {/* Preview */}
            {selectedTemplate && (
              <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-xs text-gray-600 dark:text-gray-300">
                <span className="font-medium">Preview:</span>{" "}
                {filteredTemplates.find((t) => t.id === selectedTemplate)?.contentPreview || ""}
              </div>
            )}
          </div>

          {/* Send button */}
          <div className="flex justify-end">
            <button
              onClick={handleSendMessage}
              disabled={!selectedTemplate || sending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {sending ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Send {selectedChannel === "EMAIL" ? "Email" : "SMS"}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Message Log */}
      {loading ? (
        <Spinner />
      ) : messages.length === 0 ? (
        <EmptyState message="No communications found" />
      ) : (
        <div className="space-y-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={channelIcon[msg.channel] || channelIcon.EMAIL} />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{msg.subject || msg.templateName}</p>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      msg.status === "SENT" || msg.status === "DELIVERED"
                        ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                        : msg.status === "FAILED"
                        ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                        : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                    }`}>
                      {msg.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {msg.channel} to {msg.recipient} · {new Date(msg.sentAt).toLocaleString()}
                    {msg.sentByName && ` · by ${msg.sentByName}`}
                  </p>
                  {msg.errorMessage && (
                    <p className="text-xs text-red-500 mt-1">{msg.errorMessage}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} totalElements={totalElements} pageSize={10} onPageChange={setPage} />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ==================== Payments Tab ====================
function PaymentsTab({ patientId }: { patientId: number }) {
  const [payments, setPayments] = useState<PatientPaymentHistoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const data = await patientService.getPaymentHistory(patientId, { page, size: 10 });
      setPayments(data?.content || []);
      setTotalPages(data?.totalPages || 0);
      setTotalElements(data?.totalElements || 0);
    } catch {
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [patientId, page]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const handleDownloadReceipt = async (paymentId: number) => {
    try {
      const blob = await patientService.downloadReceipt(patientId, paymentId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt_${paymentId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setToast({ message: "Failed to download receipt", type: "error" });
    }
  };

  const paymentStatusColor: Record<string, string> = {
    PAID: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    PENDING: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    FAILED: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    REFUNDED: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  };

  if (loading) return <Spinner />;
  if (payments.length === 0) return <EmptyState message="No payment history" />;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Code</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Appointment</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Doctor</th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Amount</th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">Method</th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Receipt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {payments.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-3 py-2 text-sm font-mono text-brand-600 dark:text-brand-400">{p.paymentCode}</td>
                <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">{p.appointmentCode || "—"}</td>
                <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">{p.doctorName || "—"}</td>
                <td className="px-3 py-2 text-sm text-right font-medium text-gray-900 dark:text-white">
                  {p.totalAmount.toLocaleString()} {p.currency || "VND"}
                </td>
                <td className="px-3 py-2 text-center text-xs text-gray-600 dark:text-gray-400">{p.paymentMethod}</td>
                <td className="px-3 py-2 text-center">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${paymentStatusColor[p.paymentStatus] || "bg-gray-100 text-gray-700"}`}>
                    {p.paymentStatus}
                  </span>
                </td>
                <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                  {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "—"}
                </td>
                <td className="px-3 py-2 text-right">
                  {p.hasReceipt && (
                    <button
                      onClick={() => handleDownloadReceipt(p.id)}
                      title="Download receipt"
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-brand-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} totalElements={totalElements} pageSize={10} onPageChange={setPage} />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
