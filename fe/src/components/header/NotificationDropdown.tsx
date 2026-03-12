import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  type NotificationDTO,
} from "../../services/notificationService";

const typeColor: Record<string, string> = {
  APPOINTMENT: "bg-blue-500",
  PAYMENT: "bg-emerald-500",
  PATIENT: "bg-violet-500",
  SYSTEM: "bg-amber-500",
};

const typeEmoji: Record<string, string> = {
  APPOINTMENT: "Appt",
  PAYMENT: "Pay",
  PATIENT: "Patient",
  SYSTEM: "Sys",
};

function formatTimeShort(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d`;
}

/** Path to "View all notifications" by role */
function getNotificationsPath(roles: string[] | undefined): string {
  if (!roles?.length) return "/home";
  if (roles.includes("ADMIN")) return "/admin/notifications";
  if (roles.includes("RECEPTIONIST")) return "/receptionist/notifications";
  if (roles.includes("DOCTOR")) return "/doctor/notifications";
  return "/home";
}

export default function NotificationDropdown() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notificationsPath = getNotificationsPath(user?.roles);

  const fetchBadge = useCallback(async () => {
    try {
      const res = await getUnreadCount();
      setUnreadCount(res.total);
    } catch {
      /* silent */
    }
  }, []);

  const fetchLatest = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await getNotifications({ page: 0, size: 5 });
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    } catch {
      /* silent */
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchBadge();
    pollingRef.current = setInterval(fetchBadge, 30_000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchBadge]);

  useEffect(() => {
    if (isOpen) fetchLatest();
  }, [isOpen, fetchLatest]);

  const handleToggle = () => setIsOpen((prev) => !prev);
  const closeDropdown = () => setIsOpen(false);

  const handleItemClick = async (n: NotificationDTO) => {
    if (!n.isRead) {
      try {
        await markAsRead(n.id);
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === n.id ? { ...item, isRead: true } : item
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        /* silent */
      }
    }
    closeDropdown();
  };

  return (
    <div className="relative">
      <button
        className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full dropdown-toggle hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={handleToggle}
        aria-label="Notifications"
      >
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 z-10 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm">
            {unreadCount > 99 ? "99+" : unreadCount}
            <span className="absolute inline-flex w-full h-full bg-red-400 rounded-full opacity-75 animate-ping" />
          </span>
        )}
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-brand-100 dark:bg-brand-900/30 px-1.5 text-xs font-bold text-brand-600 dark:text-brand-400">
                {unreadCount}
              </span>
            )}
          </h5>
          <button
            onClick={handleToggle}
            className="text-gray-500 transition dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <svg className="fill-current" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z" fill="currentColor" />
            </svg>
          </button>
        </div>
        <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar">
          {loadingList ? (
            <li className="p-4 text-center text-sm text-gray-400 dark:text-gray-500">Loading...</li>
          ) : notifications.length === 0 ? (
            <li className="p-8 text-center">
              <svg className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <p className="text-sm text-gray-400 dark:text-gray-500">No notifications</p>
            </li>
          ) : (
            notifications.map((n) => (
              <li key={n.id}>
                <DropdownItem
                  onItemClick={() => handleItemClick(n)}
                  className={`flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5 ${
                    !n.isRead ? "bg-brand-50/50 dark:bg-brand-900/5" : ""
                  }`}
                >
                  <span className="relative flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-lg">
                    {typeEmoji[n.type] ?? ""}
                    <span
                      className={`absolute bottom-0 right-0 z-10 h-2.5 w-2.5 rounded-full border-[1.5px] border-white dark:border-gray-900 ${
                        typeColor[n.type] ?? "bg-gray-400"
                      }`}
                    />
                  </span>

                  <span className="block min-w-0 flex-1">
                    <span className="mb-1 flex items-center gap-1.5">
                      <span className="text-theme-sm font-medium text-gray-800 dark:text-white/90 truncate">
                        {n.title}
                      </span>
                      {!n.isRead && (
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0" />
                      )}
                      {n.priority === "URGENT" && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                          URGENT
                        </span>
                      )}
                    </span>
                    <span className="block text-theme-xs text-gray-500 dark:text-gray-400 truncate">
                      {n.message}
                    </span>
                    <span className="flex items-center gap-2 mt-1 text-gray-400 text-theme-xs dark:text-gray-500">
                      <span>{n.type}</span>
                      <span className="w-1 h-1 bg-gray-400 rounded-full" />
                      <span>{formatTimeShort(n.createdAt)}</span>
                    </span>
                  </span>
                </DropdownItem>
              </li>
            ))
          )}
        </ul>
        <Link
          to={notificationsPath}
          onClick={closeDropdown}
          className="block px-4 py-2 mt-3 text-sm font-medium text-center text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          View All Notifications
        </Link>
      </Dropdown>
    </div>
  );
}
