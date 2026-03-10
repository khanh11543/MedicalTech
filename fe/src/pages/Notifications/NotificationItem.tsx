import type { NotificationDTO } from "../../services/notificationService";

// ==================== HELPERS ====================

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const typeConfig: Record<
  string,
  { bg: string; iconBg: string; text: string; icon: React.ReactNode }
> = {
  APPOINTMENT: {
    bg: "bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/30",
    iconBg: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    text: "text-blue-600 dark:text-blue-400",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  PAYMENT: {
    bg: "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
    text: "text-emerald-600 dark:text-emerald-400",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  PATIENT: {
    bg: "bg-violet-50 dark:bg-violet-900/10 border-violet-100 dark:border-violet-800/30",
    iconBg: "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400",
    text: "text-violet-600 dark:text-violet-400",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  SYSTEM: {
    bg: "bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800/30",
    iconBg: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    text: "text-amber-600 dark:text-amber-400",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
};

const priorityBadge: Record<string, { className: string; label: string }> = {
  URGENT: {
    className: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 ring-1 ring-red-300 dark:ring-red-700",
    label: "URGENT",
  },
  IMPORTANT: {
    className: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400",
    label: "IMPORTANT",
  },
};

// ==================== COMPONENT ====================

interface NotificationItemProps {
  notification: NotificationDTO;
  onMarkRead: (id: number) => void;
  onAcknowledge: (notification: NotificationDTO) => void;
}

export default function NotificationItem({
  notification,
  onMarkRead,
  onAcknowledge,
}: NotificationItemProps) {
  const config = typeConfig[notification.type] ?? typeConfig.SYSTEM;
  const priority = priorityBadge[notification.priority];
  const isUrgent = notification.priority === "URGENT";
  const needsAck = isUrgent && !notification.acknowledged;

  return (
    <div
      className={`relative rounded-xl border p-4 transition-all duration-200 ${
        config.bg
      } ${
        !notification.isRead
          ? "ring-2 ring-brand-200 dark:ring-brand-700/50 shadow-sm"
          : "opacity-80"
      } ${
        isUrgent && !notification.acknowledged
          ? "!ring-2 !ring-red-400 dark:!ring-red-600 !border-red-200 dark:!border-red-800 animate-pulse-gentle"
          : ""
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${config.iconBg}`}>
          {config.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {notification.title}
            </h4>
            {!notification.isRead && (
              <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
            )}
            {priority && (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${priority.className}`}
              >
                {priority.label}
              </span>
            )}
            {notification.category && (
              <span className={`text-[10px] font-medium ${config.text}`}>
                {notification.category.replace(/_/g, " ")}
              </span>
            )}
          </div>

          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {notification.message}
          </p>

          <div className="mt-2 flex items-center gap-3 flex-wrap">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {formatTime(notification.createdAt)}
            </span>

            {/* Actions */}
            {!notification.isRead && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkRead(notification.id);
                }}
                className="text-xs font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
              >
                Mark as read
              </button>
            )}

            {needsAck && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAcknowledge(notification);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors shadow-sm"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Acknowledge
              </button>
            )}

            {notification.acknowledged && (
              <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Acknowledged
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
