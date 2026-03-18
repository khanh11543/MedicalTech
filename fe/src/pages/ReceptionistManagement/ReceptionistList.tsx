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
import { getAvatarUrl } from "../../utils/avatar";
import adminService, {
  AdminReceptionist,
  Page,
  AdminReceptionistListParams,
  CreateReceptionistRequest,
  UpdateReceptionistRequest,
} from "../../services/adminService";

const SHIFTS = ["MORNING", "AFTERNOON", "EVENING", "NIGHT"];
const SHIFT_COLORS: Record<string, string> = {
  MORNING: "warning",
  AFTERNOON: "info",
  EVENING: "primary",
  NIGHT: "light",
};

// ==================== CREATE MODAL ====================
function CreateReceptionistModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (data: CreateReceptionistRequest) => Promise<void>;
}) {
  const [form, setForm] = useState<CreateReceptionistRequest>({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    employeeId: "",
    department: "",
    shift: "MORNING",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.password) {
      setError("Full name, email, and password are required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onCreate(form);
      onClose();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to create"
          : "Failed to create receptionist";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">New Receptionist</h2>
          <button type="button" title="Close" onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="Enter full name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Enter email address"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Min 8 chars, upper+lower+digit+special"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
              <input
                type="text"
                value={form.phone || ""}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Enter phone number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Employee ID</label>
              <input
                type="text"
                value={form.employeeId || ""}
                onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                placeholder="Enter employee ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
              <input
                type="text"
                value={form.department || ""}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                placeholder="Enter department"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Shift</label>
              <select
                title="Shift"
                value={form.shift || "MORNING"}
                onChange={(e) => setForm({ ...form, shift: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                {SHIFTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Receptionist"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==================== DETAIL/EDIT MODAL ====================
function ReceptionistDetailModal({
  receptionist,
  onClose,
  onSave,
  onToggleStatus,
}: {
  receptionist: AdminReceptionist;
  onClose: () => void;
  onSave: (id: number, data: UpdateReceptionistRequest) => Promise<void>;
  onToggleStatus: (id: number, isActive: boolean) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<UpdateReceptionistRequest>({
    fullName: receptionist.fullName || "",
    phone: receptionist.phone || "",
    employeeId: receptionist.employeeId || "",
    department: receptionist.department || "",
    shift: receptionist.shift || "MORNING",
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(receptionist.receptionistId, form);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const Field = ({
    label,
    value,
    field,
    options,
  }: {
    label: string;
    value: string;
    field?: keyof UpdateReceptionistRequest;
    options?: { value: string; label: string }[];
  }) => (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
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
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        ) : (
          <input
            type="text"
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
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center overflow-hidden">
              {receptionist.avatarUrl ? (
                <img src={getAvatarUrl(receptionist.avatarUrl) ?? ""} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-amber-600 dark:text-amber-400 text-lg font-bold">
                  {receptionist.fullName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{receptionist.fullName}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{receptionist.email}</p>
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
          {/* Status Bar */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
            <div className="flex items-center gap-3">
              <Badge color={receptionist.isActive ? "success" : "error"}>
                {receptionist.isActive ? "Active" : "Inactive"}
              </Badge>
              {receptionist.shift && (
                <Badge color={SHIFT_COLORS[receptionist.shift] as "warning" | "info" | "primary" | "light"}>
                  {receptionist.shift}
                </Badge>
              )}
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Receptionist #{receptionist.receptionistId}
              </span>
            </div>
            <button
              onClick={() => onToggleStatus(receptionist.receptionistId, !receptionist.isActive)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                receptionist.isActive
                  ? "text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-900/20"
                  : "text-green-600 bg-green-50 hover:bg-green-100 dark:text-green-400 dark:bg-green-900/20"
              }`}
            >
              {receptionist.isActive ? "Deactivate" : "Activate"}
            </button>
          </div>

          {/* Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">Receptionist Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Full Name" value={receptionist.fullName} field="fullName" />
              <Field label="Phone" value={receptionist.phone || ""} field="phone" />
              <Field label="Employee ID" value={receptionist.employeeId || ""} field="employeeId" />
              <Field label="Department" value={receptionist.department || ""} field="department" />
              <Field
                label="Shift"
                value={receptionist.shift || ""}
                field="shift"
                options={SHIFTS.map((s) => ({ value: s, label: s }))}
              />
            </div>
          </div>

          {/* Account Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
              <p className="text-sm font-medium text-gray-800 dark:text-white">
                {receptionist.lastLogin
                  ? new Date(receptionist.lastLogin).toLocaleDateString("en-US", {
                      year: "numeric", month: "short", day: "numeric",
                    })
                  : "Never"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Last Login</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
              <p className="text-sm font-medium text-gray-800 dark:text-white">
                {new Date(receptionist.createdAt).toLocaleDateString("en-US", {
                  year: "numeric", month: "short", day: "numeric",
                })}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Joined</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================
export default function ReceptionistList() {
  const [receptionists, setReceptionists] = useState<AdminReceptionist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast, showToast, dismissToast } = useToast();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedReceptionist, setSelectedReceptionist] = useState<AdminReceptionist | null>(null);

  const [filters, setFilters] = useState({
    search: "",
    department: "",
    shift: "",
    isActive: "",
  });

  const fetchReceptionists = useCallback(async () => {
    try {
      setLoading(true);
      const params: AdminReceptionistListParams = {
        pageNumber: page,
        pageSize,
        sortBy: "id",
        sortOrder: "desc",
      };
      if (filters.search) params.q = filters.search;
      if (filters.department) params.department = filters.department;
      if (filters.shift) params.shift = filters.shift;
      if (filters.isActive !== "") params.isActive = filters.isActive === "true";

      const response: Page<AdminReceptionist> = await adminService.getReceptionists(params);
      setReceptionists(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
      setError(null);
    } catch (err: unknown) {
      console.error("Failed to fetch receptionists:", err);
      setError("Failed to load receptionists. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters]);

  useEffect(() => {
    fetchReceptionists();
  }, [fetchReceptionists]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchReceptionists();
  };

  const clearFilters = () => {
    setFilters({ search: "", department: "", shift: "", isActive: "" });
    setPage(0);
  };

  const handleCreate = async (data: CreateReceptionistRequest) => {
    await adminService.createReceptionist(data);
    fetchReceptionists();
    showToast("Receptionist created successfully", "success");
  };

  const handleToggleStatus = async (receptionistId: number, currentStatus: boolean) => {
    const prevReceptionists = receptionists;
    setReceptionists(prev => prev.map(r =>
      r.receptionistId === receptionistId ? { ...r, isActive: !currentStatus } : r
    ));
    try {
      await adminService.updateReceptionistStatus(receptionistId, !currentStatus);
      if (selectedReceptionist?.receptionistId === receptionistId) {
        const updated = await adminService.getReceptionistDetail(receptionistId);
        setSelectedReceptionist(updated);
      }
      showToast(`Receptionist ${!currentStatus ? "activated" : "deactivated"} successfully`, "success");
    } catch (err) {
      console.error("Failed to update receptionist status:", err);
      setReceptionists(prevReceptionists);
      showToast("Failed to update receptionist status", "error");
    }
  };

  const handleSaveReceptionist = async (id: number, data: UpdateReceptionistRequest) => {
    try {
      const updated = await adminService.updateReceptionist(id, data);
      setSelectedReceptionist(updated);
      setReceptionists(prev => prev.map(r =>
        r.receptionistId === id ? { ...r, ...updated } : r
      ));
      showToast("Receptionist updated successfully", "success");
    } catch (err) {
      console.error("Failed to update receptionist:", err);
      showToast("Failed to update receptionist", "error");
    }
  };

  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
    if (diffDays < 1) return "Today";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  return (
    <>
      <PageMeta
        title="Receptionist Management | MediTech Admin"
        description="Manage receptionists in the MediTech system"
      />
      <PageBreadcrumb pageTitle="Receptionist Management" />

      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Receptionists</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{totalElements} receptionists total</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                {showFilters ? "Hide Filters" : "Filters"}
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600"
              >
                + New Receptionist
              </button>
            </div>
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
                    placeholder="Name, email, or employee ID..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div className="w-36">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Shift</label>
                  <select
                    title="Filter by shift"
                    value={filters.shift}
                    onChange={(e) => setFilters({ ...filters, shift: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">All</option>
                    {SHIFTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
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
                  <span className="ml-3 text-gray-500 dark:text-gray-400">Loading receptionists...</span>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <p className="text-red-500">{error}</p>
                  <button onClick={fetchReceptionists} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                    Retry
                  </button>
                </div>
              ) : receptionists.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <p className="text-gray-500 dark:text-gray-400">No receptionists found</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600"
                  >
                    Create First Receptionist
                  </button>
                </div>
              ) : (
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        Receptionist
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        Employee ID
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        Department
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        Shift
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        Status
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        Last Login
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHeader>

                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {receptionists.map((r) => (
                      <TableRow key={r.receptionistId}>
                        <TableCell className="px-5 py-4 text-start">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center overflow-hidden">
                              {r.avatarUrl ? (
                                <img src={getAvatarUrl(r.avatarUrl) ?? ""} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-amber-600 dark:text-amber-400 font-medium">
                                  {r.fullName.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800 text-sm dark:text-white/90">
                                {r.fullName}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{r.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                            {r.employeeId || "—"}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {r.department || "—"}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          {r.shift ? (
                            <Badge size="sm" color={SHIFT_COLORS[r.shift] as "warning" | "info" | "primary" | "light"}>
                              {r.shift}
                            </Badge>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          <button
                            type="button"
                            title={r.isActive ? "Deactivate receptionist" : "Activate receptionist"}
                            onClick={() => handleToggleStatus(r.receptionistId, r.isActive)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              r.isActive ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                r.isActive ? "translate-x-6" : "translate-x-1"
                              }`}
                            />
                          </button>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-sm dark:text-gray-400">
                          {formatRelativeTime(r.lastLogin)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          <button
                            onClick={() => setSelectedReceptionist(r)}
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
          {!loading && !error && receptionists.length > 0 && (
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

      {/* Create Modal */}
      {showCreateModal && (
        <CreateReceptionistModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreate}
        />
      )}

      {/* Detail Modal */}
      {selectedReceptionist && (
        <ReceptionistDetailModal
          receptionist={selectedReceptionist}
          onClose={() => setSelectedReceptionist(null)}
          onSave={handleSaveReceptionist}
          onToggleStatus={handleToggleStatus}
        />
      )}
      <Toast toast={toast} onDismiss={dismissToast} />
    </>
  );
}
