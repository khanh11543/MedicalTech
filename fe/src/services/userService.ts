import api from "./api";

// ============== TYPES ==============

export interface UserProfile {
  id: number;
  email: string;
  fullName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  isVerified: boolean;
  twoFactorEnabled: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
  roles: string[];
}

export interface UpdateProfileRequest {
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface SupportTicket {
  id: number;
  userId: number;
  userEmail: string;
  userName: string;
  subject: string;
  message: string;
  category: string;
  priority: string;
  status: string;
  adminResponse: string | null;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupportTicketRequest {
  subject: string;
  message: string;
  category: string;
  priority?: string;
}

export interface SupportTicketStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
}

export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// ============== API SERVICES ==============

const userService = {
  // ============== PROFILE ==============
  getProfile: async (): Promise<UserProfile> => {
    const response = await api.get("/users/me");
    return response.data;
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<UserProfile> => {
    const response = await api.put("/users/me", data);
    return response.data;
  },

  uploadAvatar: async (file: File): Promise<{ avatarUrl: string; message: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/users/me/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // ============== NOTIFICATIONS (User) ==============
  getMyNotifications: async (params: {
    unreadOnly?: boolean;
    pageNumber?: number;
    pageSize?: number;
  } = {}): Promise<{
    notifications: Array<{
      id: number;
      title: string;
      message: string;
      type: string;
      isRead: boolean;
      readAt: string | null;
      createdAt: string;
    }>;
    totalPages: number;
    totalElements: number;
    currentPage: number;
    pageSize: number;
    unreadCount: number;
  }> => {
    const response = await api.get("/me/notifications", { params });
    return response.data;
  },

  markNotificationRead: async (id: number): Promise<{ message: string }> => {
    const response = await api.patch(`/me/notifications/${id}/read`);
    return response.data;
  },

  markAllNotificationsRead: async (): Promise<{ message: string }> => {
    const response = await api.patch("/me/notifications/read-all");
    return response.data;
  },

  // ============== SUPPORT TICKETS ==============
  createSupportTicket: async (data: CreateSupportTicketRequest): Promise<SupportTicket> => {
    const response = await api.post("/users/support-tickets", data);
    return response.data;
  },

  getMySupportTickets: async (pageNumber = 0, pageSize = 10): Promise<Page<SupportTicket>> => {
    const response = await api.get("/users/support-tickets", {
      params: { pageNumber, pageSize },
    });
    return response.data;
  },

  getSupportTicketDetail: async (id: number): Promise<SupportTicket> => {
    const response = await api.get(`/users/support-tickets/${id}`);
    return response.data;
  },
};

export default userService;
