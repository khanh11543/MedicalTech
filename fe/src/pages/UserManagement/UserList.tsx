import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Toast from "../../components/common/Toast";
import { useToast } from "../../hooks/useToast";
import { useDebounce } from "../../hooks/useDebounce";
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
import { maskPhone, maskEmail } from "../../utils/privacyMask";
import adminService, { User, UserDetail, UserRoleDetail, Page } from "../../services/adminService";

const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api").replace(/\/$/, "");

const resolveAvatarUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
};

// Filter State
interface Filters {
  search: string;
  role: string;
  isActive: string;
}

export default function UserList() {
  const navigate = useNavigate();
  const { settings: wsSettings } = useWorkstation();
  const { toast, showToast, dismissToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Reset Password state
  const [resetPasswordLoading, setResetPasswordLoading] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    role: "",
    isActive: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [roleMap, setRoleMap] = useState<Record<string, number>>({});
  const debouncedSearch = useDebounce(filters.search, 400);

  // Fetch available roles from backend on mount
  useEffect(() => {
    adminService.getRoles().then((roles) => {
      const map: Record<string, number> = {};
      roles.forEach((r) => { map[r.name] = r.id; });
      setRoleMap(map);
    }).catch((err) => console.error("Failed to fetch roles:", err));
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, unknown> = {
        pageNumber: page,
        pageSize: pageSize,
        sortBy: "createdAt",
        sortOrder: "desc",
      };

      if (debouncedSearch) params.q = debouncedSearch;
      if (filters.role) params.role = filters.role;
      if (filters.isActive !== "") params.isActive = filters.isActive === "true";

      const response: Page<User> = await adminService.getUsers(params);
      setUsers(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
      setError(null);
    } catch (err: unknown) {
      console.error("Failed to fetch users:", err);
      let errorMessage = "Failed to load users. Please try again.";

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
  }, [page, pageSize, debouncedSearch, filters.role, filters.isActive]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Reset page when debounced search changes
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch]);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(0);
  };

  const clearFilters = () => {
    setFilters({ search: "", role: "", isActive: "" });
    setPage(0);
  };

  const handleStatusToggle = async (userId: number, currentStatus: boolean) => {
    const prev = users;
    setUsers(u => u.map(x => x.id === userId ? { ...x, isActive: !currentStatus } : x));
    try {
      await adminService.updateUserStatus(userId, !currentStatus);
      showToast(`User ${!currentStatus ? "activated" : "deactivated"} successfully`, "success");
    } catch (err) {
      console.error("Failed to update user status:", err);
      setUsers(prev);
      showToast("Failed to update user status", "error");
    }
  };

  const handleResetPassword = async (userId: number, userEmail: string) => {
    if (!confirm(`Reset password for ${userEmail}? A new password will be sent to their email.`)) return;
    try {
      setResetPasswordLoading(userId);
      await adminService.resetUserPassword(userId);
      showToast(`Password reset sent to ${userEmail}`, "success");
    } catch (err: unknown) {
      console.error("Failed to reset password:", err);
      const msg = (err && typeof err === 'object' && 'response' in err)
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to reset password"
        : "Failed to reset password";
      showToast(msg, "error");
    } finally {
      setResetPasswordLoading(null);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string, currentRoles: string[]) => {
    if (currentRoles.includes(newRole)) return;
    const roleId = roleMap[newRole];
    if (!roleId) {
      showToast(`Role ID not found for ${newRole}. Please reload the page.`, "error");
      return;
    }
    if (!confirm(`Change this user's role to ${newRole}?`)) return;
    const prev = users;
    setUsers(u => u.map(x => x.id === userId ? { ...x, roles: [newRole] } : x));
    try {
      await adminService.assignRoles(userId, [roleId]);
      showToast(`Role changed to ${newRole}`, "success");
    } catch (err) {
      console.error("Failed to change role:", err);
      setUsers(prev);
      showToast("Failed to change role", "error");
    }
  };

  const handleViewUser = async (userId: number) => {
    try {
      setViewLoading(true);
      setShowViewModal(true);
      const detail = await adminService.getUserDetail(userId);
      setSelectedUser(detail);
    } catch (err) {
      console.error("Failed to fetch user detail:", err);
      showToast("Failed to load user details", "error");
      setShowViewModal(false);
    } finally {
      setViewLoading(false);
    }
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedUser(null);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN": return "primary";
      case "DOCTOR": return "success";
      case "PATIENT": return "info";
      case "RECEPTIONIST": return "warning";
      default: return "light";
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatDate(dateString);
  };

  return (
    <>
      <PageMeta
        title="User Management | MediTech Admin"
        description="Manage users in the MediTech system"
      />
      <PageBreadcrumb pageTitle="User Management" />

      <div className="space-y-6">
        {/* Filters Panel */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Users</h3>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Total: {totalElements} users
              </span>
              <button
                onClick={() => navigate('/admin/create-user')}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-1.5 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Create New User
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                {showFilters ? "Hide Filters" : "Show Filters"}
              </button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Search
                  </label>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFilterChange("search", e.target.value)}
                    placeholder="Search by email or phone..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div className="w-40">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Role
                  </label>
                  <select
                    value={filters.role}
                    onChange={(e) => handleFilterChange("role", e.target.value)}
                    aria-label="Filter by role"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">All Roles</option>
                    <option value="ADMIN">Admin</option>
                    <option value="DOCTOR">Doctor</option>
                    <option value="PATIENT">Patient</option>
                    <option value="RECEPTIONIST">Receptionist</option>
                  </select>
                </div>
                <div className="w-40">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={filters.isActive}
                    onChange={(e) => handleFilterChange("isActive", e.target.value)}
                    aria-label="Filter by status"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">All Status</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:text-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="overflow-hidden">
            <div className="max-w-full overflow-x-auto">
              {loading && !users.length ? (
                <TableSkeleton rows={pageSize > 10 ? 10 : pageSize} cols={7} />
              ) : error ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <p className="text-red-500 mb-4">{error}</p>
                    <button
                      onClick={fetchUsers}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : users.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">No users found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        User
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        Email
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        Roles
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        Status
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                        Verified
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
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="px-5 py-4 sm:px-6 text-start">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 overflow-hidden rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                              {user.avatarUrl ? (
                                <img
                                  width={40}
                                  height={40}
                                  src={resolveAvatarUrl(user.avatarUrl) || ""}
                                  alt={user.email}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-blue-600 dark:text-blue-400 font-medium">
                                  {user.email.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div>
                              <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                                #{user.id}
                              </span>
                              {user.phone && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">{wsSettings.hidePhoneNumber ? maskPhone(user.phone) : user.phone}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {wsSettings.hideEmail ? maskEmail(user.email) : user.email}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          <select
                            value={user.roles[0] || ""}
                            onChange={(e) => handleRoleChange(user.id, e.target.value, user.roles)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-full border-0 cursor-pointer focus:ring-2 focus:ring-blue-500 ${getRoleBadgeColor(user.roles[0]) === "primary"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                              : getRoleBadgeColor(user.roles[0]) === "success"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : getRoleBadgeColor(user.roles[0]) === "warning"
                                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                  : "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400"
                              }`}
                          >
                            <option value="ADMIN">ADMIN</option>
                            <option value="DOCTOR">DOCTOR</option>
                            <option value="PATIENT">PATIENT</option>
                            <option value="RECEPTIONIST">RECEPTIONIST</option>
                          </select>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          <button
                            onClick={() => handleStatusToggle(user.id, user.isActive)}
                            aria-label={`Toggle status for ${user.email}`}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${user.isActive ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
                              }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${user.isActive ? "translate-x-6" : "translate-x-1"
                                }`}
                            />
                          </button>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          {user.isVerified ? (
                            <Badge size="sm" color="success">Verified</Badge>
                          ) : (
                            <Badge size="sm" color="warning">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {formatRelativeTime(user.lastLogin)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewUser(user.id)}
                              className="px-3 py-1.5 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
                              title="View Details"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleResetPassword(user.id, user.email)}
                              disabled={resetPasswordLoading === user.id}
                              className="px-3 py-1.5 text-sm font-medium text-white bg-yellow-500 rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              title="Reset Password"
                            >
                              {resetPasswordLoading === user.id ? "Resetting..." : "Reset PW"}
                            </button>
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
          {!loading && !error && users.length > 0 && (
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
                  <option value={100}>100</option>
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
      {/* View User Detail Modal */}
      {showViewModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all"
          onClick={closeViewModal}
        >
          <div
            className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4 animate-[fadeInScale_0.25s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">User Details</h2>
              <button
                onClick={closeViewModal}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {viewLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4"></div>
                <span className="text-gray-500 dark:text-gray-400">Loading user details...</span>
              </div>
            ) : selectedUser ? (
              <div className="px-6 py-5 space-y-6">
                {/* User Avatar & Basic Info */}
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shadow-lg flex-shrink-0">
                    {selectedUser.avatarUrl ? (
                      <img
                        src={resolveAvatarUrl(selectedUser.avatarUrl) || ""}
                        alt={selectedUser.email}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-2xl font-bold">
                        {selectedUser.email.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white truncate">
                      {selectedUser.patientProfile
                        ? `${selectedUser.patientProfile.firstName} ${selectedUser.patientProfile.lastName}`
                        : selectedUser.doctorProfile
                          ? `${selectedUser.doctorProfile.firstName} ${selectedUser.doctorProfile.lastName}`
                          : `User #${selectedUser.id}`}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{wsSettings.hideEmail ? maskEmail(selectedUser.email) : selectedUser.email}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedUser.roles.map((role: UserRoleDetail) => (
                        <Badge key={role.roleName} size="sm" color={getRoleBadgeColor(role.roleName) as "primary" | "success" | "info" | "warning" | "light"}>
                          {role.roleName}
                        </Badge>
                      ))}
                      {selectedUser.isActive ? (
                        <Badge size="sm" color="success">Active</Badge>
                      ) : (
                        <Badge size="sm" color="error">Inactive</Badge>
                      )}
                      {selectedUser.isVerified ? (
                        <Badge size="sm" color="success">Verified</Badge>
                      ) : (
                        <Badge size="sm" color="warning">Unverified</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Account Information */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">Account Information</h4>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    <InfoRow label="User ID" value={`#${selectedUser.id}`} />
                    <InfoRow label="Email" value={wsSettings.hideEmail ? maskEmail(selectedUser.email) : selectedUser.email} />
                    <InfoRow label="Phone" value={wsSettings.hidePhoneNumber ? maskPhone(selectedUser.phone) : (selectedUser.phone || "N/A")} />
                    <InfoRow label="2FA Enabled" value={selectedUser.twoFactorEnabled ? "Yes" : "No"} />
                    <InfoRow label="Failed Logins" value={String(selectedUser.failedLoginCount)} />
                    <InfoRow label="Locked Until" value={selectedUser.lockedUntil ? formatDateTime(selectedUser.lockedUntil) : "Not locked"} />
                    <InfoRow label="Last Login" value={formatDateTime(selectedUser.lastLogin)} />
                    <InfoRow label="Created At" value={formatDateTime(selectedUser.createdAt)} />
                    <InfoRow label="Updated At" value={formatDateTime(selectedUser.updatedAt)} />
                  </div>
                </div>

                {/* Patient Profile */}
                {selectedUser.patientProfile && (
                  <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-cyan-700 dark:text-cyan-300 uppercase tracking-wider mb-3">Patient Profile</h4>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                      <InfoRow label="Full Name" value={`${selectedUser.patientProfile.firstName} ${selectedUser.patientProfile.lastName}`} />
                      <InfoRow label="Date of Birth" value={formatDate(selectedUser.patientProfile.dateOfBirth)} />
                      <InfoRow label="Gender" value={selectedUser.patientProfile.gender || "N/A"} />
                      <InfoRow label="Blood Type" value={selectedUser.patientProfile.bloodType || "N/A"} />
                      <InfoRow label="City" value={selectedUser.patientProfile.city || "N/A"} />
                      <InfoRow label="District" value={selectedUser.patientProfile.district || "N/A"} />
                      <InfoRow label="Ward" value={selectedUser.patientProfile.ward || "N/A"} />
                      <InfoRow label="Emergency Contact" value={selectedUser.patientProfile.emergencyContactName || "N/A"} />
                      <InfoRow label="Emergency Phone" value={wsSettings.hidePhoneNumber ? maskPhone(selectedUser.patientProfile.emergencyContactPhone) : (selectedUser.patientProfile.emergencyContactPhone || "N/A")} />
                    </div>
                  </div>
                )}

                {/* Doctor Profile */}
                {selectedUser.doctorProfile && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-green-700 dark:text-green-300 uppercase tracking-wider mb-3">Doctor Profile</h4>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                      <InfoRow label="Full Name" value={`${selectedUser.doctorProfile.firstName} ${selectedUser.doctorProfile.lastName}`} />
                      <InfoRow label="License Number" value={selectedUser.doctorProfile.licenseNumber || "N/A"} />
                      <InfoRow label="Specialization" value={selectedUser.doctorProfile.specialization || "N/A"} />
                      <InfoRow label="Experience" value={`${selectedUser.doctorProfile.yearsOfExperience} years`} />
                      <InfoRow label="Consultation Fee" value={selectedUser.doctorProfile.consultationFee ? `${selectedUser.doctorProfile.consultationFee.toLocaleString()} VND` : "N/A"} />
                      <InfoRow label="Verification" value={selectedUser.doctorProfile.verificationStatus || "N/A"} />
                      <InfoRow label="Rating" value={selectedUser.doctorProfile.rating ? `${selectedUser.doctorProfile.rating} ⭐ (${selectedUser.doctorProfile.reviewCount} reviews)` : "No ratings"} />
                      {selectedUser.doctorProfile.bio && (
                        <div className="col-span-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Bio</span>
                          <p className="text-sm text-gray-800 dark:text-gray-200 mt-0.5">{selectedUser.doctorProfile.bio}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white dark:bg-gray-900 px-6 py-4 border-t border-gray-200 dark:border-gray-700 rounded-b-2xl">
              <button
                onClick={closeViewModal}
                className="w-full px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline styles for animation */}
      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <Toast toast={toast} onDismiss={dismissToast} />
    </>
  );
}

/* Helper component for info rows in the modal */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-0.5 break-words">{value}</p>
    </div>
  );
}
