import { useCallback, useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { Modal } from "../../components/ui/modal";
import { useModal } from "../../hooks/useModal";
import adminService, {
  NotificationItem,
  NotificationListParams,
  CreateNotificationRequest,
  BroadcastNotificationRequest,
  NotificationStats,
  Page,
} from "../../services/adminService";

const typeColors: Record<string, string> = {
  SYSTEM: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  APPOINTMENT: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  PAYMENT: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  PRESCRIPTION: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  ANNOUNCEMENT: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
};

const EMPTY_FORM: CreateNotificationRequest = {
  userIds: [],
  title: "",
  message: "",
  type: "SYSTEM",
  sendEmail: false,
  sendSms: false,
  sendPush: true,
};

export default function NotificationList() {
  const [notifications, setNotifications] = useState<Page<NotificationItem>>({
    content: [],
    totalPages: 0,
    totalElements: 0,
    number: 0,
    size: 20,
    first: true,
    last: true,
    numberOfElements: 0,
    empty: true,
  });

  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [filters, setFilters] = useState<NotificationListParams>({
    pageNumber: 0,
    pageSize: 20,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const { isOpen: createModalOpen, openModal: openCreateModal, closeModal: closeCreateModal } = useModal();
  const { isOpen: broadcastModalOpen, openModal: openBroadcastModal, closeModal: closeBroadcastModal } = useModal();
  const { isOpen: detailsOpen, openModal: openDetails, closeModal: closeDetails } = useModal();

  const [form, setForm] = useState<CreateNotificationRequest>(EMPTY_FORM);
  const [broadcastForm, setBroadcastForm] = useState<BroadcastNotificationRequest>({
    title: "",
    message: "",
    type: "ANNOUNCEMENT",
    sendEmail: false,
    sendSms: false,
    sendPush: true,
  });
  const [broadcastRole, setBroadcastRole] = useState<string>("");
  const [userIdsInput, setUserIdsInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getNotifications(filters);
      setNotifications(data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const data = await adminService.getNotificationStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchStats();
  }, [fetchNotifications, fetchStats]);

  const handleFilterChange = (key: keyof NotificationListParams, value: string | boolean | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value, pageNumber: 0 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, pageNumber: newPage }));
  };

  const handleCreateNotification = async () => {
    setSaving(true);
    setError(null);
    try {
      // Parse user IDs from comma-separated input
      const userIds = userIdsInput
        .split(",")
        .map((id) => parseInt(id.trim()))
        .filter((id) => !isNaN(id));

      if (userIds.length === 0) {
        setError("Please enter valid user IDs");
        setSaving(false);
        return;
      }

      await adminService.createNotification({ ...form, userIds });
      closeCreateModal();
      setForm(EMPTY_FORM);
      setUserIdsInput("");
      fetchNotifications();
      fetchStats();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Failed to create notification");
    } finally {
      setSaving(false);
    }
  };

  const handleBroadcast = async () => {
    setSaving(true);
    setError(null);
    try {
      await adminService.broadcastNotification(broadcastForm, broadcastRole || undefined);
      closeBroadcastModal();
      setBroadcastForm({
        title: "",
        message: "",
        type: "ANNOUNCEMENT",
        sendEmail: false,
        sendSms: false,
        sendPush: true,
      });
      setBroadcastRole("");
      fetchNotifications();
      fetchStats();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Failed to broadcast notification");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this notification?")) return;
    try {
      await adminService.deleteNotification(id);
      fetchNotifications();
      fetchStats();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Failed to delete notification");
    }
  };

  const handleViewDetails = (notification: NotificationItem) => {
    setSelectedNotification(notification);
    openDetails();
  };

  return (
    <>
      <PageMeta
        title="Notification Management | MediTech Admin"
        description="Manage system notifications and announcements in the MediTech system"
      />
      <PageBreadcrumb pageTitle="Notification Management" />

      {/* Stats Cards */}
      {stats && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-gray-200 dark:border-white/[0.05] bg-white dark:bg-white/[0.03] p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalNotifications}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Notifications</div>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-white/[0.05] bg-white dark:bg-white/[0.03] p-4">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.totalUnread}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Unread</div>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-white/[0.05] bg-white dark:bg-white/[0.03] p-4">
            <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">{stats.sentToday}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Sent Today</div>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-white/[0.05] bg-white dark:bg-white/[0.03] p-4">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.scheduledCount}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Scheduled</div>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 dark:border-white/[0.05] bg-white dark:bg-white/[0.03] px-6 pt-6 pb-2.5 shadow-sm">
        {/* Header with Actions */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Notifications</h2>
          <div className="flex gap-3">
            <button
              onClick={openCreateModal}
              className="rounded bg-teal-500 px-4 py-2 font-medium text-white hover:bg-teal-600 transition-colors"
            >
              + Create Notification
            </button>
            <button
              onClick={openBroadcastModal}
              className="rounded bg-purple-500 px-4 py-2 font-medium text-white hover:bg-purple-600 transition-colors"
            >
              📢 Broadcast
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <input
            type="text"
            placeholder="Search..."
            value={filters.q || ""}
            onChange={(e) => handleFilterChange("q", e.target.value)}
            className="rounded border border-gray-300 dark:border-white/[0.1] bg-white dark:bg-gray-900 px-4 py-2.5 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus-visible:outline-none"
          />
          <select
            title="Filter by notification type"
            value={filters.type || ""}
            onChange={(e) => handleFilterChange("type", e.target.value || undefined)}
            className="rounded border border-gray-300 dark:border-white/[0.1] bg-white dark:bg-gray-900 px-4 py-2.5 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus-visible:outline-none"
          >
            <option value="">All Types</option>
            <option value="SYSTEM">System</option>
            <option value="APPOINTMENT">Appointment</option>
            <option value="PAYMENT">Payment</option>
            <option value="PRESCRIPTION">Prescription</option>
            <option value="ANNOUNCEMENT">Announcement</option>
          </select>
          <select
            title="Filter by read status"
            value={filters.isRead === undefined ? "" : String(filters.isRead)}
            onChange={(e) =>
              handleFilterChange("isRead", e.target.value === "" ? undefined : e.target.value === "true")
            }
            className="rounded border border-gray-300 dark:border-white/[0.1] bg-white dark:bg-gray-900 px-4 py-2.5 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus-visible:outline-none"
          >
            <option value="">All Status</option>
            <option value="false">Unread</option>
            <option value="true">Read</option>
          </select>
          <button
            onClick={() => setFilters({ pageNumber: 0, pageSize: 20 })}
            className="rounded bg-gray-200 dark:bg-gray-700 px-4 py-2.5 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Reset
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400">
            {error}
            <button onClick={fetchNotifications} className="ml-2 underline">
              Retry
            </button>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="max-w-full overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-white/[0.05] text-left">
                    <th className="py-3 px-4 font-medium text-gray-900 dark:text-white">Title</th>
                    <th className="py-3 px-4 font-medium text-gray-900 dark:text-white">Type</th>
                    <th className="py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
                    <th className="py-3 px-4 font-medium text-gray-900 dark:text-white">Channels</th>
                    <th className="py-3 px-4 font-medium text-gray-900 dark:text-white">Sent At</th>
                    <th className="py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.content.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500 dark:text-gray-400">
                        No notifications found
                      </td>
                    </tr>
                  ) : (
                    notifications.content.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-gray-200 dark:border-white/[0.05] hover:bg-gray-50 dark:hover:bg-gray-900/30"
                      >
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900 dark:text-white">{item.title}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                            {item.message}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                              typeColors[item.type] || typeColors.SYSTEM
                            }`}
                          >
                            {item.type}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {item.isRead ? (
                            <span className="text-sm text-green-600 dark:text-green-400">✓ Read</span>
                          ) : (
                            <span className="text-sm text-orange-600 dark:text-orange-400">● Unread</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1">
                            {item.pushSent && <span className="text-xs">📱</span>}
                            {item.emailSent && <span className="text-xs">✉️</span>}
                            {item.smsSent && <span className="text-xs">💬</span>}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                          {item.sentAt ? new Date(item.sentAt).toLocaleString() : "Not sent"}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleViewDetails(item)}
                              className="text-sm text-teal-600 dark:text-teal-400 hover:underline"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="text-sm text-red-600 dark:text-red-400 hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {notifications.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 dark:border-white/[0.05] px-4 py-4">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Showing {notifications.numberOfElements} of {notifications.totalElements} results — Page{" "}
                  {notifications.number + 1} / {notifications.totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(notifications.number - 1)}
                    disabled={notifications.first}
                    className="rounded bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(notifications.number + 1)}
                    disabled={notifications.last}
                    className="rounded bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Notification Modal */}
      {createModalOpen && (
        <Modal isOpen={createModalOpen} onClose={closeCreateModal} className="max-w-2xl p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Create Notification</h3>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                User IDs (comma-separated) *
              </label>
              <input
                type="text"
                value={userIdsInput}
                onChange={(e) => setUserIdsInput(e.target.value)}
                placeholder="e.g. 1, 2, 3"
                className="w-full rounded border border-gray-300 dark:border-white/[0.1] bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus-visible:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Notification title..."
                className="w-full rounded border border-gray-300 dark:border-white/[0.1] bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus-visible:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Message *</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                rows={4}
                placeholder="Notification message..."
                className="w-full rounded border border-gray-300 dark:border-white/[0.1] bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus-visible:outline-none resize-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
              <select
                title="Notification type"
                value={form.type}
                onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
                className="w-full rounded border border-gray-300 dark:border-white/[0.1] bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus-visible:outline-none"
              >
                <option value="SYSTEM">System</option>
                <option value="APPOINTMENT">Appointment</option>
                <option value="PAYMENT">Payment</option>
                <option value="PRESCRIPTION">Prescription</option>
                <option value="ANNOUNCEMENT">Announcement</option>
              </select>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.sendPush}
                  onChange={(e) => setForm((prev) => ({ ...prev, sendPush: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-teal-500 focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">📱 Push</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.sendEmail}
                  onChange={(e) => setForm((prev) => ({ ...prev, sendEmail: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-teal-500 focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">✉️ Email</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.sendSms}
                  onChange={(e) => setForm((prev) => ({ ...prev, sendSms: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-teal-500 focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">💬 SMS</span>
              </label>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={closeCreateModal}
              className="rounded bg-gray-200 dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateNotification}
              disabled={!form.title.trim() || !form.message.trim() || !userIdsInput.trim() || saving}
              className="rounded bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Sending..." : "Send Notification"}
            </button>
          </div>
        </Modal>
      )}

      {/* Broadcast Modal */}
      {broadcastModalOpen && (
        <Modal isOpen={broadcastModalOpen} onClose={closeBroadcastModal} className="max-w-2xl p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Broadcast Notification</h3>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Filter by Role (optional)
              </label>
              <select
                title="Filter by role"
                value={broadcastRole}
                onChange={(e) => setBroadcastRole(e.target.value)}
                className="w-full rounded border border-gray-300 dark:border-white/[0.1] bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus-visible:outline-none"
              >
                <option value="">All Users</option>
                <option value="PATIENT">Patients Only</option>
                <option value="DOCTOR">Doctors Only</option>
                <option value="RECEPTIONIST">Receptionists Only</option>
                <option value="ADMIN">Admins Only</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Title *</label>
              <input
                type="text"
                value={broadcastForm.title}
                onChange={(e) => setBroadcastForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Broadcast title..."
                className="w-full rounded border border-gray-300 dark:border-white/[0.1] bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus-visible:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Message *</label>
              <textarea
                value={broadcastForm.message}
                onChange={(e) => setBroadcastForm((prev) => ({ ...prev, message: e.target.value }))}
                rows={4}
                placeholder="Broadcast message..."
                className="w-full rounded border border-gray-300 dark:border-white/[0.1] bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus-visible:outline-none resize-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
              <select
                title="Broadcast type"
                value={broadcastForm.type}
                onChange={(e) => setBroadcastForm((prev) => ({ ...prev, type: e.target.value }))}
                className="w-full rounded border border-gray-300 dark:border-white/[0.1] bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus-visible:outline-none"
              >
                <option value="SYSTEM">System</option>
                <option value="ANNOUNCEMENT">Announcement</option>
              </select>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={broadcastForm.sendPush}
                  onChange={(e) => setBroadcastForm((prev) => ({ ...prev, sendPush: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-purple-500 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">📱 Push</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={broadcastForm.sendEmail}
                  onChange={(e) => setBroadcastForm((prev) => ({ ...prev, sendEmail: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-purple-500 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">✉️ Email</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={broadcastForm.sendSms}
                  onChange={(e) => setBroadcastForm((prev) => ({ ...prev, sendSms: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-purple-500 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">💬 SMS</span>
              </label>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={closeBroadcastModal}
              className="rounded bg-gray-200 dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleBroadcast}
              disabled={!broadcastForm.title.trim() || !broadcastForm.message.trim() || saving}
              className="rounded bg-purple-500 px-4 py-2 text-sm font-medium text-white hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Broadcasting..." : "Broadcast Now"}
            </button>
          </div>
        </Modal>
      )}

      {/* Details Modal */}
      {detailsOpen && selectedNotification && (
        <Modal isOpen={detailsOpen} onClose={closeDetails} className="max-w-2xl p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Notification Details</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Title</label>
              <p className="text-gray-900 dark:text-white">{selectedNotification.title}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Message</label>
              <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{selectedNotification.message}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Type</label>
                <p className="text-gray-900 dark:text-white">{selectedNotification.type}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                <p className="text-gray-900 dark:text-white">
                  {selectedNotification.isRead ? "Read" : "Unread"}
                </p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Delivery Channels</label>
              <div className="flex gap-2 mt-1">
                {selectedNotification.pushSent && (
                  <span className="inline-block rounded bg-blue-100 dark:bg-blue-900/30 px-2 py-1 text-xs text-blue-800 dark:text-blue-400">
                    📱 Push
                  </span>
                )}
                {selectedNotification.emailSent && (
                  <span className="inline-block rounded bg-green-100 dark:bg-green-900/30 px-2 py-1 text-xs text-green-800 dark:text-green-400">
                    ✉️ Email
                  </span>
                )}
                {selectedNotification.smsSent && (
                  <span className="inline-block rounded bg-purple-100 dark:bg-purple-900/30 px-2 py-1 text-xs text-purple-800 dark:text-purple-400">
                    💬 SMS
                  </span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Sent At</label>
                <p className="text-gray-900 dark:text-white text-sm">
                  {selectedNotification.sentAt
                    ? new Date(selectedNotification.sentAt).toLocaleString()
                    : "Not sent"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Created At</label>
                <p className="text-gray-900 dark:text-white text-sm">
                  {new Date(selectedNotification.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            {selectedNotification.referenceType && (
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Reference</label>
                <p className="text-gray-900 dark:text-white text-sm">
                  {selectedNotification.referenceType} #{selectedNotification.referenceId}
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
