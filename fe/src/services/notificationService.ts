import api from './api';

// ==================== TYPES ====================

export type NotificationType = 'APPOINTMENT' | 'PAYMENT' | 'PATIENT' | 'SYSTEM';
export type NotificationPriority = 'INFO' | 'IMPORTANT' | 'URGENT';
export type NotificationCategory =
  | 'NEW_BOOKING'
  | 'APPOINTMENT_CANCELLED'
  | 'APPOINTMENT_RESCHEDULED'
  | 'PATIENT_CHECKED_IN'
  | 'NO_SHOW_MARKED'
  | 'MOMO_PAYMENT_RECEIVED'
  | 'PAYMENT_FAILED'
  | 'NEW_PENDING_PAYMENT'
  | 'OVERDUE_PAYMENT'
  | 'NEW_PATIENT_REGISTERED'
  | 'PATIENT_PROFILE_UPDATED'
  | 'MAINTENANCE_SCHEDULED'
  | 'BACKUP_COMPLETED'
  | 'SETTING_CHANGED';

export interface NotificationDTO {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory | null;
  priority: NotificationPriority;
  referenceType: string | null;
  referenceId: number | null;
  isRead: boolean;
  readAt: string | null;
  acknowledged: boolean;
  acknowledgedAt: string | null;
  createdAt: string;
}

export interface NotificationListResponse {
  notifications: NotificationDTO[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  unreadCount: number;
  unreadCountByType: Record<string, number>;
}

export interface UnreadCountResponse {
  total: number;
  byType: Record<string, number>;
}

export interface NotificationFilterParams {
  type?: NotificationType;
  priority?: NotificationPriority;
  unreadOnly?: boolean;
  page?: number;
  size?: number;
}

// Filter tab type (includes 'ALL' and 'UNREAD' which are not backend types)
export type FilterTab = 'ALL' | 'UNREAD' | NotificationType;

// ==================== API CALLS ====================

/**
 * Get paginated + filtered notifications for current user
 */
export const getNotifications = async (
  params: NotificationFilterParams = {}
): Promise<NotificationListResponse> => {
  const queryParams: Record<string, string> = {};

  if (params.type) queryParams.type = params.type;
  if (params.priority) queryParams.priority = params.priority;
  if (params.unreadOnly) queryParams.unreadOnly = 'true';
  if (params.page !== undefined) queryParams.pageNumber = params.page.toString();
  if (params.size !== undefined) queryParams.pageSize = params.size.toString();

  const response = await api.get('/me/notifications', { params: queryParams });
  return response.data;
};

/**
 * Get unread count (lightweight — for header badge)
 */
export const getUnreadCount = async (): Promise<UnreadCountResponse> => {
  const response = await api.get('/me/notifications/unread-count');
  return response.data;
};

/**
 * Mark a single notification as read
 */
export const markAsRead = async (notificationId: number): Promise<void> => {
  await api.patch(`/me/notifications/${notificationId}/read`);
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (): Promise<void> => {
  await api.patch('/me/notifications/read-all');
};

/**
 * Acknowledge an URGENT notification
 */
export const acknowledgeNotification = async (
  notificationId: number
): Promise<void> => {
  await api.patch(`/me/notifications/${notificationId}/acknowledge`);
};
