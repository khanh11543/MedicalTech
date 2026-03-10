import { useCallback, useEffect, useRef, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import NotificationFilters from "./NotificationFilters";
import NotificationItem from "./NotificationItem";
import AcknowledgeModal from "./AcknowledgeModal";
import useNotificationWebSocket from "../../hooks/useNotificationWebSocket";
import { useAuth } from "../../context/AuthContext";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  acknowledgeNotification,
  type NotificationDTO,
  type NotificationListResponse,
  type FilterTab,
  type NotificationType,
} from "../../services/notificationService";

export default function NotificationCenter() {
  const { user } = useAuth();
  // ==================== STATE ====================
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [data, setData] = useState<NotificationListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalUnread, setTotalUnread] = useState(0);
  const [unreadByType, setUnreadByType] = useState<Record<string, number>>({});

  // Acknowledge modal
  const [ackModal, setAckModal] = useState<{
    open: boolean;
    notification: NotificationDTO | null;
    loading: boolean;
  }>({ open: false, notification: null, loading: false });

  // Polling ref
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ==================== DATA FETCHING ====================
  const fetchNotifications = useCallback(
    async (pageNum = 0, silent = false) => {
      if (!silent) setLoading(true);
      try {
        const params: {
          type?: NotificationType;
          unreadOnly?: boolean;
          page: number;
          size: number;
        } = { page: pageNum, size: 20 };

        if (activeTab === "UNREAD") {
          params.unreadOnly = true;
        } else if (activeTab !== "ALL") {
          params.type = activeTab as NotificationType;
        }

        const res = await getNotifications(params);
        setData(res);
        setUnreadByType(res.unreadCountByType ?? {});
      } catch (err) {
        console.error("Failed to load notifications:", err);
      } finally {
        setLoading(false);
      }
    },
    [activeTab]
  );

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await getUnreadCount();
      setTotalUnread(res.total);
      setUnreadByType(res.byType ?? {});
    } catch {
      /* silent */
    }
  }, []);

  // Initial fetch + on tab change
  useEffect(() => {
    setPage(0);
    fetchNotifications(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Poll unread every 30s
  useEffect(() => {
    fetchUnreadCount();
    pollingRef.current = setInterval(fetchUnreadCount, 30_000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchUnreadCount]);

  // Sync totalUnread from data
  useEffect(() => {
    if (data) {
      setTotalUnread(data.unreadCount);
    }
  }, [data]);

  // ==================== WEBSOCKET (REAL-TIME) ====================
  useNotificationWebSocket({
    userId: user?.userId ?? null,
    token: user?.accessToken ?? null,
    onNotification: useCallback((incoming: NotificationDTO) => {
      // Prepend into current list if on first page
      setData((prev) => {
        if (!prev) return prev;
        // Avoid duplicates
        if (prev.notifications.some((n) => n.id === incoming.id)) return prev;
        return {
          ...prev,
          notifications: [incoming, ...prev.notifications].slice(0, 20),
          totalElements: prev.totalElements + 1,
          unreadCount: prev.unreadCount + 1,
        };
      });
      setTotalUnread((prev) => prev + 1);
      setUnreadByType((prev) => ({
        ...prev,
        [incoming.type]: (prev[incoming.type] ?? 0) + 1,
      }));
    }, []),
  });

  // ==================== ACTIONS ====================
  const handleMarkRead = async (id: number) => {
    try {
      await markAsRead(id);
      // Optimistic update
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          notifications: prev.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
          ),
          unreadCount: Math.max(0, prev.unreadCount - 1),
        };
      });
      setTotalUnread((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          notifications: prev.notifications.map((n) => ({
            ...n,
            isRead: true,
            readAt: n.readAt ?? new Date().toISOString(),
          })),
          unreadCount: 0,
        };
      });
      setTotalUnread(0);
      setUnreadByType({});
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleAcknowledge = (notification: NotificationDTO) => {
    setAckModal({ open: true, notification, loading: false });
  };

  const confirmAcknowledge = async () => {
    if (!ackModal.notification) return;
    setAckModal((prev) => ({ ...prev, loading: true }));
    try {
      await acknowledgeNotification(ackModal.notification.id);
      // Update local state
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          notifications: prev.notifications.map((n) =>
            n.id === ackModal.notification!.id
              ? { ...n, acknowledged: true, acknowledgedAt: new Date().toISOString() }
              : n
          ),
        };
      });
      setAckModal({ open: false, notification: null, loading: false });
    } catch (err) {
      console.error("Failed to acknowledge:", err);
      setAckModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchNotifications(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ==================== RENDER ====================
  const notifications = data?.notifications ?? [];
  const totalPages = data?.totalPages ?? 0;

  return (
    <>
      <PageMeta
        title="Notifications | MediTech Admin"
        description="Notification center"
      />
      <PageBreadcrumb pageTitle="Notifications" />

      <div className="space-y-5">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <svg className="w-6 h-6 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              Notification Center
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {totalUnread > 0 ? (
                <>
                  <span className="font-semibold text-brand-500">{totalUnread}</span> unread notification{totalUnread > 1 ? "s" : ""}
                </>
              ) : (
                "All caught up!"
              )}
            </p>
          </div>

          {totalUnread > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Mark all as read
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <NotificationFilters
          activeTab={activeTab}
          onTabChange={setActiveTab}
          unreadCountByType={unreadByType}
          totalUnread={totalUnread}
        />

        {/* Notification list */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 animate-pulse"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-center py-20">
            <svg
              className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              No notifications
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              {activeTab === "UNREAD"
                ? "You've read all notifications"
                : "Nothing here yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onMarkRead={handleMarkRead}
                onAcknowledge={handleAcknowledge}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Page {page + 1} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 0}
                className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Acknowledge Modal */}
      <AcknowledgeModal
        isOpen={ackModal.open}
        notification={ackModal.notification}
        onConfirm={confirmAcknowledge}
        onClose={() => setAckModal({ open: false, notification: null, loading: false })}
        isLoading={ackModal.loading}
      />
    </>
  );
}
