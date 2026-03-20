import api from "./api";
import authService from "./authService";
import type { MessageResponse } from "./authService";

// ==================== TYPES ====================

export interface UserProfile {
  id: number;
  email: string;
  fullName: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  isVerified: boolean;
  twoFactorEnabled: boolean;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  phone?: string;
  dateOfBirth?: string | null;
}

export interface DisplaySettings {
  language: string;
  dateFormat: string;
  timeFormat: string;
  theme: string;
  currencyDisplay: string;
}

export interface NotificationPreferences {
  id?: number;
  userId?: number;
  // Receptionist-specific event toggles
  patientCheckIn: boolean;
  paymentReceived: boolean;
  longWaitingAlert: boolean;
  longWaitingMinutes: number;
  newOnlineBooking: boolean;
  pendingPaymentReminder: boolean;
  appointmentCancelled: boolean;
  // Alert style
  desktopEnabled: boolean;
  soundEnabled: boolean;
  // Do Not Disturb
  dndEnabled: boolean;
  dndStartTime: string | null;
  dndEndTime: string | null;
  urgentOnly: boolean;
}

export interface PrinterSettings {
  receiptPrinter: string | null;
  a4Printer: string | null;
  autoPrintReceipt: boolean;
  autoPrintAppointmentSlip: boolean;
  paperSize: string;
  printCopies: number;
}

export interface QuickAction {
  id?: number;
  actionKey: string;
  label: string;
  icon: string;
  sortOrder: number;
  enabled: boolean;
}

export interface UpdateQuickActionsRequest {
  actions: QuickAction[];
}

export interface WorkstationSettings {
  hidePhoneNumber: boolean;
  hideEmail: boolean;
  hidePatientNameWhenIdle: boolean;
  largeQueueDisplay: boolean;
  autoLockEnabled: boolean;
  autoLockMinutes: number;
  hasPinSet: boolean;
}

export interface SetPinRequest {
  pin: string;
  confirmPin: string;
  currentPassword: string;
}

export interface VerifyPinRequest {
  pin: string;
}

export interface PrivacySettings {
  sessionTimeoutMinutes: string;
}

export interface ActivityLogEntry {
  id: number;
  user: { id: number; email: string; fullName: string } | null;
  activityType: string;
  description: string;
  resourceType: string | null;
  resourceId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  geoCountry: string | null;
  geoCity: string | null;
  metadata: string | null;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ==================== SERVICE ====================

const userSettingsService = {
  // 8.1 Personal
  getProfile: async (): Promise<UserProfile> => {
    const res = await api.get("/me/profile");
    return res.data;
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<UserProfile> => {
    const res = await api.put("/me/profile", data);
    return res.data;
  },

  uploadAvatar: async (file: File): Promise<UserProfile> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post("/me/profile/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  changePassword: async (data: ChangePasswordRequest): Promise<MessageResponse> => {
    return authService.changePassword(data);
  },

  // 8.2 Display
  getDisplaySettings: async (): Promise<DisplaySettings> => {
    const res = await api.get("/me/display-settings");
    return res.data;
  },

  updateDisplaySettings: async (data: DisplaySettings): Promise<DisplaySettings> => {
    const res = await api.put("/me/display-settings", data);
    return res.data;
  },

  // 8.3 Notification Preferences
  getNotificationPreferences: async (): Promise<NotificationPreferences> => {
    const res = await api.get("/me/notification-preferences");
    return res.data;
  },

  updateNotificationPreferences: async (data: Partial<NotificationPreferences>): Promise<NotificationPreferences> => {
    const res = await api.put("/me/notification-preferences", data);
    return res.data;
  },

  // 8.4 Printer Settings
  getPrinterSettings: async (): Promise<PrinterSettings> => {
    const res = await api.get("/me/printer-settings");
    return res.data;
  },

  updatePrinterSettings: async (data: PrinterSettings): Promise<PrinterSettings> => {
    const res = await api.put("/me/printer-settings", data);
    return res.data;
  },

  testPrint: async (): Promise<MessageResponse> => {
    const res = await api.post("/me/printer-settings/test");
    return res.data;
  },

  // 8.5 Quick Actions
  getQuickActions: async (): Promise<QuickAction[]> => {
    const res = await api.get("/me/quick-actions");
    return res.data;
  },

  updateQuickActions: async (data: UpdateQuickActionsRequest): Promise<QuickAction[]> => {
    const res = await api.put("/me/quick-actions", data);
    return res.data;
  },

  // 8.6 Workstation
  getWorkstationSettings: async (): Promise<WorkstationSettings> => {
    const res = await api.get("/me/workstation-settings");
    return res.data;
  },

  updateWorkstationSettings: async (data: Partial<WorkstationSettings>): Promise<WorkstationSettings> => {
    const res = await api.put("/me/workstation-settings", data);
    return res.data;
  },

  setPin: async (data: SetPinRequest): Promise<MessageResponse> => {
    const res = await api.post("/me/workstation-settings/pin", data);
    return res.data;
  },

  verifyPin: async (data: VerifyPinRequest): Promise<MessageResponse> => {
    const res = await api.post("/me/workstation-settings/verify-pin", data);
    return res.data;
  },

  // 8.7 Data & Privacy
  getPrivacySettings: async (): Promise<PrivacySettings> => {
    const res = await api.get("/me/privacy-settings");
    return res.data;
  },

  updatePrivacySettings: async (data: PrivacySettings): Promise<PrivacySettings> => {
    const res = await api.put("/me/privacy-settings", data);
    return res.data;
  },

  clearCache: async (): Promise<MessageResponse> => {
    const res = await api.post("/me/clear-cache");
    return res.data;
  },

  clearSearchHistory: async (): Promise<MessageResponse> => {
    const res = await api.delete("/me/search-history");
    return res.data;
  },

  getActivityLog: async (page = 0, size = 20): Promise<PageResponse<ActivityLogEntry>> => {
    const res = await api.get("/me/activity-log", { params: { page, size } });
    return res.data;
  },
};

export default userSettingsService;
