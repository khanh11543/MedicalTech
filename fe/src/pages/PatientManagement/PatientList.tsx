import { useEffect, useState, useCallback } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Toast from "../../components/common/Toast";
import { useToast } from "../../hooks/useToast";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Badge from "../../components/ui/badge/Badge";
import { useWorkstation } from "../../context/WorkstationContext";
import { maskPhone, maskEmail } from "../../utils/privacyMask";
import { getAvatarUrl } from "../../utils/avatar";
import adminService, {
  AdminPatient,
  Page,
  AdminPatientListParams,
  UpdatePatientRequest,
} from "../../services/adminService";

// ==================== DETAIL MODAL ====================
function PatientDetailModal({
  patient,
  onClose,
  onSave,
  onToggleStatus,
}: {
  patient: AdminPatient;
  onClose: () => void;
  onSave: (id: number, data: UpdatePatientRequest) => Promise<void>;
  onToggleStatus: (id: number, isActive: boolean) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const { settings: wsSettings } = useWorkstation();
  const [form, setForm] = useState<UpdatePatientRequest>({
    fullName: patient.fullName || "",
    phone: patient.phone || "",
    dateOfBirth: patient.dateOfBirth?.split(" ")[0] || "",
    gender: patient.gender || "",
    address: patient.address || "",
    insuranceNumber: patient.insuranceNumber || "",
    insuranceProvider: patient.insuranceProvider || "",
    emergencyContact: patient.emergencyContact || "",
    bloodGroup: patient.bloodGroup || "",
    allergies: patient.allergies || "",
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(patient.patientId, form);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const Field = ({
    label,
    value,
    field,
    type = "text",
    options,
  }: {
    label: string;
    value: string;
    field?: keyof UpdatePatientRequest;
    type?: string;
    options?: { value: string; label: string }[];
  }) => (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
        {label}
      </label>
      {editing && field ? (
        options ? (
          <select
            title={label}
            value={(form[field] as string) || ""}
            onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">—</option>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ) : type === "textarea" ? (
          <textarea
            title={label}
            value={(form[field] as string) || ""}
            onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        ) : (
          <input
            type={type}
            title={label}
            value={(form[field] as string) || ""}
            onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        )
      ) : (
        <p className="text-sm text-gray-800 dark:text-white/90">{value || "—"}</p>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center overflow-hidden">
              {patient.avatarUrl ? (
                <img src={getAvatarUrl(patient.avatarUrl) ?? ""} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-blue-600 dark:text-blue-400 text-lg font-bold">
                  {(patient.fullName || patient.email).charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                {patient.fullName || patient.email}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{wsSettings.hideEmail ? maskEmail(patient.email) : patient.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600"
              >
                Edit
              </button>
            )}
            <button type="button" title="Close" onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Account Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
            <div className="flex items-center gap-3">
              <Badge color={patient.isActive ? "success" : "error"}>
                {patient.isActive ? "Active" : "Inactive"}
              </Badge>
              {patient.isVerified && (
                <Badge color="info">Verified</Badge>
              )}
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Patient #{patient.patientId} · User #{patient.userId}
              </span>
            </div>
            <button
              onClick={() => onToggleStatus(patient.patientId, !patient.isActive)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                patient.isActive
                  ? "text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-900/20"
                  : "text-green-600 bg-green-50 hover:bg-green-100 dark:text-green-400 dark:bg-green-900/20"
              }`}
            >
              {patient.isActive ? "Deactivate" : "Activate"}
            </button>
          </div>

          {/* Personal Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Full Name" value={patient.fullName || ""} field="fullName" />
              <Field label="Phone" value={editing ? (patient.phone || "") : (wsSettings.hidePhoneNumber ? maskPhone(patient.phone) : (patient.phone || ""))} field="phone" />
              <Field
                label="Date of Birth"
                value={patient.dateOfBirth || ""}
                field="dateOfBirth"
                type="date"
              />
              <Field
                label="Gender"
                value={patient.gender || ""}
                field="gender"
                options={[
                  { value: "MALE", label: "Male" },
                  { value: "FEMALE", label: "Female" },
                ]}
              />
              <Field label="Address" value={patient.address || ""} field="address" type="textarea" />
              <Field
                label="Blood Group"
                value={patient.bloodGroup || ""}
                field="bloodGroup"
                options={[
                  { value: "A+", label: "A+" },
                  { value: "A-", label: "A-" },
                  { value: "B+", label: "B+" },
                  { value: "B-", label: "B-" },
                  { value: "AB+", label: "AB+" },
                  { value: "AB-", label: "AB-" },
                  { value: "O+", label: "O+" },
                  { value: "O-", label: "O-" },
                ]}
              />
            </div>
          </div>

          {/* Insurance & Emergency */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">Insurance & Emergency</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Insurance Number" value={patient.insuranceNumber || ""} field="insuranceNumber" />
              <Field label="Insurance Provider" value={patient.insuranceProvider || ""} field="insuranceProvider" />
              <Field label="Emergency Contact" value={patient.emergencyContact || ""} field="emergencyContact" />
            </div>
          </div>

          {/* Medical Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">Medical Information</h3>
            <div className="grid grid-cols-1 gap-4">
              <Field label="Allergies" value={patient.allergies || ""} field="allergies" type="textarea" />
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Medical History
                </label>
                <p className="text-sm text-gray-800 dark:text-white/90 whitespace-pre-wrap">
                  {patient.medicalHistory || "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {patient.totalAppointments}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Appointments</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
              <p className="text-sm font-medium text-gray-800 dark:text-white">
                {patient.lastLogin
                  ? new Date(patient.lastLogin).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                  : "Never"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Last Login</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
              <p className="text-sm font-medium text-gray-800 dark:text-white">
                {new Date(patient.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Registered</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================
export default function PatientList() {
  const { settings: wsSettings } = useWorkstation();
  const { toast, showToast, dismissToast } = useToast();
  const [patients, setPatients] = useState<AdminPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<AdminPatient | null>(null);

  const [filters, setFilters] = useState({
    search: "",
    gender: "",
    bloodGroup: "",
    isActive: "",
  });

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      const params: AdminPatientListParams = {
        pageNumber: page,
        pageSize,
        sortBy: "id",
        sortOrder: "desc",
      };
      if (filters.search) params.q = filters.search;
      if (filters.gender) params.gender = filters.gender;
      if (filters.bloodGroup) params.bloodGroup = filters.bloodGroup;
      if (filters.isActive !== "") params.isActive = filters.isActive === "true";

      const response: Page<AdminPatient> = await adminService.getPatients(params);
      setPatients(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
      setError(null);
    } catch (err: unknown) {
      console.error("Failed to fetch patients:", err);
      setError("Failed to load patients. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchPatients();
  };

  const clearFilters = () => {
    setFilters({ search: "", gender: "", bloodGroup: "", isActive: "" });
    setPage(0);
  };

  const handleToggleStatus = async (patientId: number, currentStatus: boolean) => {
    const prevPatients = patients;
    setPatients(prev => prev.map(p =>
      p.patientId === patientId ? { ...p, isActive: !currentStatus } : p
    ));
    try {
      await adminService.updatePatientStatus(patientId, !currentStatus);
      if (selectedPatient?.patientId === patientId) {
        const updated = await adminService.getPatientDetail(patientId);
        setSelectedPatient(updated);
      }
      showToast(`Patient ${!currentStatus ? "activated" : "deactivated"} successfully`, "success");
    } catch (err) {
      console.error("Failed to update patient status:", err);
      setPatients(prevPatients);
      showToast("Failed to update patient status", "error");
    }
  };

  const handleSavePatient = async (id: number, data: UpdatePatientRequest) => {
    try {
      const updated = await adminService.updatePatient(id, data);
      setSelectedPatient(updated);
      setPatients(prev => prev.map(p =>
        p.patientId === id ? { ...p, ...updated } : p
      ));
      showToast("Patient updated successfully", "success");
    } catch (err) {
      console.error("Failed to update patient:", err);
      showToast("Failed to update patient", "error");
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays < 1) return "Today";
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  return (
    <>
      <PageMeta
        title="Patient Management | MediTech Admin"
        description="Manage patients in the MediTech system"
      />
      <PageBreadcrumb pageTitle="Patient Management" />

      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Patients</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{totalElements} patients total</p>
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              {showFilters ? "Hide Filters" : "Filters"}
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    placeholder="Name, email, or phone..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div className="w-36">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender</label>
                  <select
                    title="Filter by gender"
                    value={filters.gender}
                    onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">All</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>
                <div className="w-36">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Blood Group</label>
                  <select
                    title="Filter by blood group"
                    value={filters.bloodGroup}
                    onChange={(e) => setFilters({ ...filters, bloodGroup: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">All</option>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <div className="w-36">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                  <select
                    title="Filter by status"
                    value={filters.isActive}
                    onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">All</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600">
                    Search
                  </button>
                  <button type="button" onClick={clearFilters} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:text-gray-300 dark:bg-gray-600">
                    Clear
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Table */}
          <div className="overflow-hidden">
            <div className="max-w-full overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                  <span className="ml-3 text-gray-500 dark:text-gray-400">Loading patients...</span>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <p className="text-red-500">{error}</p>
                  <button onClick={fetchPatients} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                    Retry
                  </button>
                </div>
              ) : patients.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">No patients found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        Patient
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        Contact
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        Gender
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        Blood
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        Insurance
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        Status
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        Joined
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHeader>

                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {patients.map((p) => (
                      <TableRow key={p.patientId}>
                        <TableCell className="px-5 py-4 text-start">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center overflow-hidden">
                              {p.avatarUrl ? (
                                <img src={getAvatarUrl(p.avatarUrl) ?? ""} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-blue-600 dark:text-blue-400 font-medium">
                                  {(p.fullName || p.email).charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800 text-sm dark:text-white/90">
                                {p.fullName || "—"}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">ID: {p.patientId}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          <p className="text-sm text-gray-700 dark:text-gray-300">{wsSettings.hideEmail ? maskEmail(p.email) : p.email}</p>
                          {p.phone && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">{wsSettings.hidePhoneNumber ? maskPhone(p.phone) : p.phone}</p>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {p.gender || "—"}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          {p.bloodGroup ? (
                            <Badge size="sm" color="warning">{p.bloodGroup}</Badge>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          {p.insuranceProvider ? (
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {p.insuranceProvider}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          <button
                            type="button"
                            title={p.isActive ? "Deactivate patient" : "Activate patient"}
                            onClick={() => handleToggleStatus(p.patientId, p.isActive)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              p.isActive ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                p.isActive ? "translate-x-6" : "translate-x-1"
                              }`}
                            />
                          </button>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-sm dark:text-gray-400">
                          {formatRelativeTime(p.createdAt)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          <button
                            onClick={() => setSelectedPatient(p)}
                            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            View
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
          {!loading && !error && patients.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Rows per page:</span>
                <select
                  title="Rows per page"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(0);
                  }}
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
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-300 dark:bg-gray-700"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-300 dark:bg-gray-700"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedPatient && (
        <PatientDetailModal
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
          onSave={handleSavePatient}
          onToggleStatus={handleToggleStatus}
        />
      )}
      <Toast toast={toast} onDismiss={dismissToast} />
    </>
  );
}
