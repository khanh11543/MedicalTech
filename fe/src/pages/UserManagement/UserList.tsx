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
import adminService, { User, Page } from "../../services/adminService";

// Filter State
interface Filters {
  search: string;
  role: string;
  isActive: string;
}

export default function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, unknown> = {
        pageNumber: page,
        pageSize: pageSize,
        sortBy: "createdAt",
        sortOrder: "desc",
      };
      
      if (filters.search) params.q = filters.search;
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
  }, [page, pageSize, filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchUsers();
  };

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(0);
  };

  const clearFilters = () => {
    setFilters({ search: "", role: "", isActive: "" });
    setPage(0);
  };

  const handleStatusToggle = async (userId: number, currentStatus: boolean) => {
    try {
      await adminService.updateUserStatus(userId, !currentStatus);
      fetchUsers();
    } catch (err) {
      console.error("Failed to update user status:", err);
      alert("Failed to update user status");
    }
  };

  const handleResetPassword = async (userId: number) => {
    if (!confirm("Are you sure you want to reset this user's password?")) return;
    
    try {
      const result = await adminService.resetUserPassword(userId);
      alert(result.message);
    } catch (err) {
      console.error("Failed to reset password:", err);
      alert("Failed to reset password");
    }
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
              <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-4">
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
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600"
                  >
                    Search
                  </button>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:text-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500"
                  >
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
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-3 text-gray-500 dark:text-gray-400">Loading users...</span>
                </div>
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
                                  src={user.avatarUrl}
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
                                <p className="text-xs text-gray-500 dark:text-gray-400">{user.phone}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {user.email}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          <div className="flex flex-wrap gap-1">
                            {user.roles.map((role) => (
                              <Badge key={role} size="sm" color={getRoleBadgeColor(role)}>
                                {role}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          <button
                            onClick={() => handleStatusToggle(user.id, user.isActive)}
                            aria-label={`Toggle status for ${user.email}`}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              user.isActive ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                user.isActive ? "translate-x-6" : "translate-x-1"
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
                              className="px-3 py-1.5 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
                              title="View Details"
                            >
                              View
                            </button>
                            <button 
                              onClick={() => handleResetPassword(user.id)}
                              className="px-3 py-1.5 text-sm font-medium text-white bg-yellow-500 rounded-lg hover:bg-yellow-600 transition-colors"
                              title="Reset Password"
                            >
                              Reset
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
    </>
  );
}
