import { apiFetch } from '@/services/apiClient';

export type NotificationTypeApi = 'APPOINTMENT' | 'PAYMENT' | 'PATIENT' | 'SYSTEM';
export type NotificationPriorityApi = 'INFO' | 'IMPORTANT' | 'URGENT';

export type NotificationDTO = {
  id: number;
  title: string;
  message: string;
  type: NotificationTypeApi;
  category: string | null;
  priority: NotificationPriorityApi;
  referenceType: string | null;
  referenceId: number | null;
  isRead: boolean;
  readAt: string | null;
  acknowledged: boolean;
  acknowledgedAt: string | null;
  createdAt: string;
};

export type NotificationListResponse = {
  notifications: NotificationDTO[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize?: number;
  unreadCount: number;
  unreadCountByType?: Record<string, number>;
};

export type NotificationFilterParams = {
  type?: NotificationTypeApi;
  priority?: NotificationPriorityApi;
  unreadOnly?: boolean;
  pageNumber?: number;
  pageSize?: number;
};

function buildQuery(params: NotificationFilterParams): string {
  const q = new URLSearchParams();
  if (params.type) q.set('type', params.type);
  if (params.priority) q.set('priority', params.priority);
  if (params.unreadOnly) q.set('unreadOnly', 'true');
  if (params.pageNumber != null) q.set('pageNumber', String(params.pageNumber));
  if (params.pageSize != null) q.set('pageSize', String(params.pageSize));
  const s = q.toString();
  return s ? `?${s}` : '';
}

export async function fetchMyNotifications(
  params: NotificationFilterParams = {}
): Promise<NotificationListResponse> {
  const merged: NotificationFilterParams = {
    pageNumber: 0,
    pageSize: 40,
    ...params,
  };
  return apiFetch<NotificationListResponse>(`/me/notifications${buildQuery(merged)}`);
}

export async function markMyNotificationRead(notificationId: number): Promise<void> {
  await apiFetch(`/me/notifications/${notificationId}/read`, { method: 'PATCH' });
}
