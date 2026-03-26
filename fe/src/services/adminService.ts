import api from "./api";

// ============== TYPES ==============

// Dashboard Types
export interface DashboardStatistics {
  totalUsers: number;
  totalAdmins?: number;
  totalDoctors: number;
  totalPatients: number;
  totalReceptionists: number;
  activeUsers: number;
  inactiveUsers: number;
  pendingDocuments: number;
  approvedDocuments: number;
  rejectedDocuments: number;
  totalAppointments: number;
  todayAppointments: number;
  pendingAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  pendingStaffInvites: number;
  registeredStaff: number;
  recentUsers: RecentUser[];
  recentAppointments: RecentAppointment[];
  generatedAt: string;
}

export interface RecentUser {
  id: number;
  email: string;
  fullName: string;
  role: string;
  createdAt: string;
}

export interface RecentAppointment {
  id: number;
  patientName: string;
  doctorName: string;
  status: string;
  appointmentDate: string;
}

// User Management Types
export interface User {
  id: number;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  isVerified: boolean;
  twoFactorEnabled: boolean;
  failedLoginCount: number;
  lockedUntil: string | null;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
  roles: string[];
}

export interface UserRoleDetail {
  roleId: number;
  roleName: string;
  roleDescription: string;
  assignedAt: string | null;
  assignedBy: number | null;
  assignedByEmail: string | null;
}

export interface UserDetail extends Omit<User, 'roles'> {
  roles: UserRoleDetail[];
  patientProfile?: PatientProfile;
  doctorProfile?: DoctorProfile;
}

export interface PatientProfile {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  bloodType: string;
  city: string;
  district: string;
  ward: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

export interface DoctorSpecialtyInfo {
  id: number;
  name: string;
  isPrimary: boolean;
}

export interface DoctorProfile {
  id: number;
  fullName: string;
  licenseNumber: string;
  specialization: string;
  dateOfBirth?: string | null;
  yearsOfExperience: number;
  bio: string;
  consultationFee: number;
  verificationStatus: string;
  rating: number;
  reviewCount: number;
  specialties: DoctorSpecialtyInfo[];
}

export interface DoctorBasicDTO {
  id: number;
  fullName: string;
  email: string;
  avatar: string | null;
  specialization: string | null;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
  isActive?: boolean;
  isVerified?: boolean;
  roleIds: number[];
  // Doctor-specific fields
  specialization?: string;
  subSpecialization?: string;
  yearsOfExperience?: string;
  qualification?: string;
  notes?: string;
  sendInvite?: boolean;
  specialtyIds?: number[];
  primarySpecialtyId?: number;
}

export interface CreateUserResponse {
  userId: number;
  email: string;
  fullName: string;
  phone: string;
  isActive: boolean;
  roles: string[];
  doctorId: number | null;
  specialization: string | null;
  verificationStatus: string | null;
  inviteStatus: "sent" | "failed" | "not_sent";
  inviteMessage: string | null;
}

export interface UpdateUserRequest {
  phone?: string;
  isActive?: boolean;
  isVerified?: boolean;
}

export interface StatusRequest {
  isActive: boolean;
}

export interface AssignRolesRequest {
  roleIds: number[];
}

// Doctor Document Types
export interface DoctorDocument {
  id: number;
  doctorId: number;
  doctorName: string;
  doctorEmail: string;
  documentType: string;
  documentUrl: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  notes: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewDocumentRequest {
  notes?: string;
}

// Paginated Response Type
export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// Query Parameters
export interface UserListParams {
  q?: string;
  role?: string;
  isActive?: boolean;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface DocumentListParams {
  status?: string;
  type?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Doctor Verification Types (Phases 6-11)
export interface DoctorVerificationDocument {
  id: number;
  docType: string;
  docTypeDescription: string;
  fileUrl: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewNote: string | null;
  reviewedAt: string | null;
  reviewedByEmail: string | null;
  createdAt: string;
}

export interface DoctorVerification {
  doctorId: number;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  specialization: string | null;
  licenseNumber: string | null;
  experienceYears: number | null;
  education: string | null;
  bio: string | null;
  hospitalAffiliation: string | null;
  officeAddress: string | null;
  verificationStatus: string;
  rejectionReason: string | null;
  submittedAt: string | null;
  verifiedAt: string | null;
  verifiedByEmail: string | null;
  createdAt: string;
  totalDocuments: number;
  approvedDocuments: number;
  pendingDocuments: number;
  rejectedDocuments: number;
  documents: DoctorVerificationDocument[] | null;
}

export interface VerificationDecision {
  decision: "APPROVE" | "REJECT" | "REQUEST_MORE_DOCUMENTS" | "SUSPEND" | "UNSUSPEND" | "REVOKE";
  reason?: string;
  instructions?: string;
}

// ============== API SERVICES ==============

const adminService = {
  // ============== DASHBOARD ==============
  getDashboardStatistics: async (): Promise<DashboardStatistics> => {
    const response = await api.get("/admin/dashboard/statistics");
    return response.data;
  },

  // ============== USER MANAGEMENT ==============
  getUsers: async (params: UserListParams = {}): Promise<Page<User>> => {
    const response = await api.get("/admin/users", { params });
    return response.data;
  },

  getUserDetail: async (userId: number): Promise<UserDetail> => {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  },

  createUser: async (data: CreateUserRequest): Promise<CreateUserResponse> => {
    const response = await api.post("/admin/users", data);
    return response.data;
  },

  updateUser: async (userId: number, data: UpdateUserRequest): Promise<User> => {
    const response = await api.put(`/admin/users/${userId}`, data);
    return response.data;
  },

  updateUserStatus: async (userId: number, isActive: boolean): Promise<void> => {
    await api.patch(`/admin/users/${userId}/status`, { isActive });
  },

  assignRoles: async (userId: number, roleIds: number[]): Promise<void> => {
    await api.put(`/admin/users/${userId}/roles`, { roleIds });
  },

  getRoles: async (): Promise<{ id: number; name: string }[]> => {
    const response = await api.get("/admin/users/roles");
    return response.data;
  },

  resetUserPassword: async (userId: number): Promise<{ message: string }> => {
    const response = await api.post(`/admin/users/${userId}/reset-password`);
    return response.data;
  },

  adminChangePassword: async (userId: number, newPassword: string, confirmPassword: string): Promise<{ message: string }> => {
    const response = await api.put(`/admin/users/${userId}/change-password`, { newPassword, confirmPassword });
    return response.data;
  },

  deleteUser: async (userId: number): Promise<void> => {
    await api.delete(`/admin/users/${userId}`);
  },

  updateDoctorSpecialties: async (doctorId: number, data: { specialtyIds: number[]; primarySpecialtyId: number }): Promise<void> => {
    await api.put(`/admin/doctors/${doctorId}/specialties`, data);
  },

  getDoctorsBasicList: async (): Promise<DoctorBasicDTO[]> => {
    const response = await api.get("/admin/doctors/list");
    return response.data;
  },

  // ============== ROOM MANAGEMENT ==============
  getRooms: async (): Promise<Room[]> => {
    const response = await api.get("/admin/rooms");
    return response.data;
  },

  createRoom: async (data: UpsertRoomRequest): Promise<Room> => {
    const response = await api.post("/admin/rooms", data);
    return response.data;
  },

  updateRoom: async (roomId: number, data: UpsertRoomRequest): Promise<Room> => {
    const response = await api.put(`/admin/rooms/${roomId}`, data);
    return response.data;
  },

  deleteRoom: async (roomId: number): Promise<void> => {
    await api.delete(`/admin/rooms/${roomId}`);
  },

  assignDoctorToRoom: async (roomId: number, doctorId?: number | null): Promise<Room> => {
    const response = await api.put(`/admin/rooms/${roomId}/assign`, null, {
      params: { doctorId: doctorId ?? undefined },
    });
    return response.data;
  },

  // ============== DOCTOR DOCUMENTS ==============
  getDoctorDocuments: async (params: DocumentListParams = {}): Promise<Page<DoctorDocument>> => {
    const response = await api.get("/admin/doctor-documents", { params });
    return response.data;
  },

  getPendingDocuments: async (pageNumber = 0, pageSize = 10): Promise<Page<DoctorDocument>> => {
    const response = await api.get("/admin/doctor-documents/pending", {
      params: { pageNumber, pageSize },
    });
    return response.data;
  },

  getDocumentDetail: async (id: number): Promise<DoctorDocument> => {
    const response = await api.get(`/admin/doctor-documents/${id}`);
    return response.data;
  },

  approveDocument: async (id: number, notes?: string): Promise<DoctorDocument> => {
    const response = await api.patch(`/admin/doctor-documents/${id}/approve`, { notes });
    return response.data;
  },

  rejectDocument: async (id: number, notes?: string): Promise<DoctorDocument> => {
    const response = await api.patch(`/admin/doctor-documents/${id}/reject`, { notes });
    return response.data;
  },

  // ============== DOCTOR VERIFICATION (Phases 6-11) ==============
  getDoctorVerifications: async (params: {
    status?: string;
    pageNumber?: number;
    pageSize?: number;
  } = {}): Promise<Page<DoctorVerification>> => {
    const response = await api.get("/admin/verifications", { params });
    return response.data;
  },

  getPendingVerifications: async (): Promise<DoctorVerification[]> => {
    const response = await api.get("/admin/verifications/pending");
    return response.data;
  },

  getVerificationDetail: async (doctorId: number): Promise<DoctorVerification> => {
    const response = await api.get(`/admin/verifications/${doctorId}`);
    return response.data;
  },

  submitVerificationDecision: async (
    doctorId: number,
    decision: VerificationDecision
  ): Promise<DoctorVerification> => {
    const response = await api.post(`/admin/verifications/${doctorId}/decision`, decision);
    return response.data;
  },

  // ============== STAFF REGISTRY ==============
  getStaffRegistry: async (params: {
    search?: string;
    status?: string;
    expectedRole?: string;
    pageNumber?: number;
    pageSize?: number;
  } = {}): Promise<Page<StaffRegistry>> => {
    const response = await api.get("/admin/staff-registry", { params });
    return response.data;
  },

  createStaffInvite: async (data: CreateStaffInviteRequest): Promise<StaffRegistry> => {
    const response = await api.post("/admin/staff-registry", data);
    return response.data;
  },

  updateStaffRegistry: async (id: number, data: UpdateStaffRegistryRequest): Promise<StaffRegistry> => {
    const response = await api.put(`/admin/staff-registry/${id}`, data);
    return response.data;
  },

  deleteStaffRegistry: async (id: number): Promise<void> => {
    await api.delete(`/admin/staff-registry/${id}`);
  },

  // ============== APPOINTMENTS ==============
  getAppointments: async (params: AppointmentListParams = {}): Promise<Page<Appointment>> => {
    const response = await api.get("/admin/appointments", { params });
    return response.data;
  },

  getAppointmentDetail: async (id: number): Promise<Appointment> => {
    const response = await api.get(`/admin/appointments/${id}`);
    return response.data;
  },

  // ============== PRESCRIPTIONS ==============
  getPrescriptions: async (params: PrescriptionListParams = {}): Promise<Page<Prescription>> => {
    const response = await api.get("/admin/prescriptions", { params });
    return response.data;
  },

  getPrescriptionDetail: async (id: number): Promise<Prescription> => {
    const response = await api.get(`/admin/prescriptions/${id}`);
    return response.data;
  },

  // ============== PAYMENTS ==============
  getPayments: async (params: PaymentListParams = {}): Promise<Page<Payment>> => {
    const response = await api.get("/admin/payments", { params });
    return response.data;
  },

  getPaymentDetail: async (id: number): Promise<Payment> => {
    const response = await api.get(`/admin/payments/${id}`);
    return response.data;
  },

  // ============== REVIEWS ==============
  getReviews: async (params: ReviewListParams = {}): Promise<Page<Review>> => {
    const response = await api.get("/admin/reviews", { params });
    return response.data;
  },

  getReviewDetail: async (id: number): Promise<Review> => {
    const response = await api.get(`/admin/reviews/${id}`);
    return response.data;
  },

  moderateReview: async (id: number, data: ModerateReviewRequest): Promise<Review> => {
    const response = await api.patch(`/admin/reviews/${id}/moderate`, data);
    return response.data;
  },

  deleteReview: async (id: number): Promise<void> => {
    await api.delete(`/admin/reviews/${id}`);
  },

  // ============== CONTENTS ==============
  getContents: async (params: ContentListParams = {}): Promise<Page<ContentItem>> => {
    const response = await api.get("/admin/contents", { params });
    return response.data;
  },

  getContentDetail: async (id: number): Promise<ContentItem> => {
    const response = await api.get(`/admin/contents/${id}`);
    return response.data;
  },

  createContent: async (data: ContentCreateRequest): Promise<ContentItem> => {
    const response = await api.post("/admin/contents", data);
    return response.data;
  },

  updateContent: async (id: number, data: ContentCreateRequest): Promise<ContentItem> => {
    const response = await api.put(`/admin/contents/${id}`, data);
    return response.data;
  },

  updateContentStatus: async (id: number, status: string): Promise<ContentItem> => {
    const response = await api.patch(`/admin/contents/${id}/status`, { status });
    return response.data;
  },

  deleteContent: async (id: number): Promise<void> => {
    await api.delete(`/admin/contents/${id}`);
  },

  // ============== SYSTEM SETTINGS ==============
  getSettings: async (): Promise<SystemSettingItem[]> => {
    const response = await api.get("/admin/settings");
    return response.data;
  },

  getSettingsGrouped: async (): Promise<Record<string, SystemSettingItem[]>> => {
    const response = await api.get("/admin/settings/grouped");
    return response.data;
  },

  getSettingsByGroup: async (group: string): Promise<SystemSettingItem[]> => {
    const response = await api.get(`/admin/settings/group/${group}`);
    return response.data;
  },

  updateSetting: async (id: number, data: SystemSettingUpdateRequest): Promise<SystemSettingItem> => {
    const response = await api.put(`/admin/settings/${id}`, data);
    return response.data;
  },

  bulkUpdateSettings: async (updates: SystemSettingUpdateRequest[]): Promise<SystemSettingItem[]> => {
    const response = await api.put("/admin/settings/bulk", updates);
    return response.data;
  },

  // ============== NOTIFICATIONS ==============
  getNotifications: async (params: NotificationListParams = {}): Promise<Page<NotificationItem>> => {
    const response = await api.get("/admin/notifications", { params });
    return response.data;
  },

  getNotificationStats: async (): Promise<NotificationStats> => {
    const response = await api.get("/admin/notifications/stats");
    return response.data;
  },

  createNotification: async (data: CreateNotificationRequest): Promise<{ message: string }> => {
    const response = await api.post("/admin/notifications", data);
    return response.data;
  },

  broadcastNotification: async (data: BroadcastNotificationRequest, role?: string): Promise<{ message: string }> => {
    const params = role ? { role } : {};
    const response = await api.post("/admin/notifications/broadcast", data, { params });
    return response.data;
  },

  deleteNotification: async (id: number): Promise<void> => {
    await api.delete(`/admin/notifications/${id}`);
  },

  // ============== SUPPORT TICKETS ==============
  getSupportTickets: async (params: SupportTicketListParams = {}): Promise<Page<SupportTicketItem>> => {
    const response = await api.get("/admin/support-tickets", { params });
    return response.data;
  },

  getSupportTicketStats: async (): Promise<SupportTicketStats> => {
    const response = await api.get("/admin/support-tickets/stats");
    return response.data;
  },

  getSupportTicketDetail: async (id: number): Promise<SupportTicketItem> => {
    const response = await api.get(`/admin/support-tickets/${id}`);
    return response.data;
  },

  respondToTicket: async (id: number, data: RespondTicketRequest): Promise<SupportTicketItem> => {
    const response = await api.patch(`/admin/support-tickets/${id}/respond`, data);
    return response.data;
  },

  closeTicket: async (id: number): Promise<SupportTicketItem> => {
    const response = await api.patch(`/admin/support-tickets/${id}/close`);
    return response.data;
  },

  // ============== PATIENT MANAGEMENT ==============
  getPatients: async (params: AdminPatientListParams = {}): Promise<Page<AdminPatient>> => {
    const response = await api.get("/admin/patients", { params });
    return response.data;
  },

  getPatientDetail: async (id: number): Promise<AdminPatient> => {
    const response = await api.get(`/admin/patients/${id}`);
    return response.data;
  },

  updatePatient: async (id: number, data: UpdatePatientRequest): Promise<AdminPatient> => {
    const response = await api.put(`/admin/patients/${id}`, data);
    return response.data;
  },

  updatePatientStatus: async (id: number, isActive: boolean): Promise<void> => {
    await api.patch(`/admin/patients/${id}/status`, { isActive });
  },

  // ============== RECEPTIONIST MANAGEMENT ==============
  getReceptionists: async (params: AdminReceptionistListParams = {}): Promise<Page<AdminReceptionist>> => {
    const response = await api.get("/admin/receptionists", { params });
    return response.data;
  },

  getReceptionistDetail: async (id: number): Promise<AdminReceptionist> => {
    const response = await api.get(`/admin/receptionists/${id}`);
    return response.data;
  },

  createReceptionist: async (data: CreateReceptionistRequest): Promise<AdminReceptionist> => {
    const response = await api.post("/admin/receptionists", data);
    return response.data;
  },

  updateReceptionist: async (id: number, data: UpdateReceptionistRequest): Promise<AdminReceptionist> => {
    const response = await api.put(`/admin/receptionists/${id}`, data);
    return response.data;
  },

  updateReceptionistStatus: async (id: number, isActive: boolean): Promise<void> => {
    await api.patch(`/admin/receptionists/${id}/status`, { isActive });
  },

};

// Staff Registry Types
export interface StaffRegistry {
  id: number;
  email: string;
  phone: string | null;
  fullName: string;
  expectedRole: string;
  department: string | null;
  status: "PENDING" | "REGISTERED" | "DISABLED" | "EXPIRED";
  invitationToken: string;
  invitedBy: string;
  invitedAt: string;
  registeredUser: User | null;
  registeredAt: string | null;
  expiresAt: string | null;
  notes: string | null;
}

export interface CreateStaffInviteRequest {
  email: string;
  phone?: string;
  fullName: string;
  expectedRole: string;
  department?: string;
  expiresAt?: string;
  notes?: string;
}

export interface UpdateStaffRegistryRequest {
  phone?: string;
  fullName?: string;
  department?: string;
  status?: string;
  expiresAt?: string;
  notes?: string;
}

// ============== APPOINTMENT TYPES ==============
export interface Appointment {
  id: number;
  appointmentCode: string;
  patientId: number;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  doctorId: number;
  doctorName: string;
  doctorSpecialization: string;
  doctorEmail: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: "PENDING" | "CONFIRMED" | "CHECKED_IN" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  bookedBy: "PATIENT" | "RECEPTIONIST";
  bookedByUserName: string;
  queueNumber: number;
  reasonForVisit: string;
  symptoms: string;
  notes: string;
  cancellationReason: string | null;
  checkedInAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentListParams {
  doctorId?: number;
  patientId?: number;
  status?: string;
  from?: string;
  to?: string;
  pageNumber?: number;
  pageSize?: number;
}

// ============== PRESCRIPTION TYPES ==============
export interface PrescriptionItem {
  id: number;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  unit: string;
  instructions: string;
  notes: string;
  itemOrder: number;
}

export interface Prescription {
  id: number;
  patientId: number;
  patientName: string;
  patientPhone: string;
  patientDateOfBirth: string;
  patientGender: string;
  doctorId: number;
  doctorName: string;
  doctorSpecialization: string;
  appointmentId: number | null;
  appointmentDate: string | null;
  prescriptionDate: string;
  diagnosis: string;
  notes: string;
  followUpDate: string | null;
  isActive: boolean;
  items: PrescriptionItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PrescriptionListParams {
  doctorId?: number;
  patientId?: number;
  from?: string;
  to?: string;
  pageNumber?: number;
  pageSize?: number;
}

// ============== PAYMENT TYPES ==============
export interface Payment {
  id: number;
  paymentCode: string;
  appointmentId: number;
  appointmentCode: string;
  patientId: number;
  patientName: string;
  amount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  paymentMethod: "CASH" | "MOMO" | "BANK_TRANSFER" | "CREDIT_CARD";
  paymentStatus: "PENDING" | "INITIATED" | "PROCESSING" | "PAID" | "FAILED" | "CANCELLED" | "REFUNDED" | "EXPIRED";
  transactionId: string | null;
  paidAt: string | null;
  refundedAt: string | null;
  refundAmount: number | null;
  refundReason: string | null;
  processedBy: number | null;
  processedByName: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
  qrInfo: Record<string, unknown> | null;
}

export interface PaymentListParams {
  status?: string;
  method?: string;
  patientId?: number;
  from?: string;
  to?: string;
  pageNumber?: number;
  pageSize?: number;
}

// ============== REVIEW TYPES ==============
export interface Review {
  id: number;
  appointmentId: number | null;
  patientId: number;
  patientName: string;
  doctorId: number | null;
  doctorName: string | null;
  rating: number;
  comment: string;
  imageUrls?: string[] | null;
  isAnonymous: boolean;
  isVisible: boolean;
  adminResponse: string | null;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewListParams {
  keyword?: string;
  isVisible?: boolean;
  rating?: number;
  pageNumber?: number;
  pageSize?: number;
}

export interface ModerateReviewRequest {
  isVisible?: boolean;
  adminResponse?: string;
}

// ============== CONTENT TYPES ==============
export interface ContentItem {
  id: number;
  title: string;
  body: string;
  summary: string | null;
  type: "ARTICLE" | "FAQ" | "POLICY" | "NEWS" | "GUIDE";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  author: string | null;
  thumbnailUrl: string | null;
  slug: string | null;
  isPinned: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ContentListParams {
  keyword?: string;
  type?: string;
  status?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface ContentCreateRequest {
  title: string;
  body?: string;
  summary?: string;
  type?: string;
  status?: string;
  author?: string;
  thumbnailUrl?: string;
  slug?: string;
  isPinned?: boolean;
}

// ============== SYSTEM SETTING TYPES ==============
export interface SystemSettingItem {
  id: number;
  settingKey: string;
  settingValue: string;
  settingGroup: string;
  displayName: string;
  description: string;
  valueType: "STRING" | "NUMBER" | "BOOLEAN" | "JSON";
  createdAt: string;
  updatedAt: string;
}

export interface SystemSettingUpdateRequest {
  settingKey: string;
  settingValue: string;
}

// ============== NOTIFICATION TYPES ==============
export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: string;
  referenceType: string | null;
  referenceId: number | null;
  isRead: boolean;
  readAt: string | null;
  sentVia: Record<string, unknown> | null;
  emailSent: boolean;
  smsSent: boolean;
  pushSent: boolean;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
}

export interface NotificationListParams {
  userId?: number;
  type?: string;
  isRead?: boolean;
  q?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: string;
}

export interface CreateNotificationRequest {
  userIds: number[];
  title: string;
  message: string;
  type: string;
  referenceType?: string;
  referenceId?: number;
  sendEmail?: boolean;
  sendSms?: boolean;
  sendPush?: boolean;
  scheduledAt?: string;
}

export interface BroadcastNotificationRequest {
  title: string;
  message: string;
  type: string;
  sendEmail?: boolean;
  sendSms?: boolean;
  sendPush?: boolean;
  scheduledAt?: string;
}

export interface NotificationStats {
  totalNotifications: number;
  totalUnread: number;
  totalRead: number;
  sentToday: number;
  sentThisWeek: number;
  sentThisMonth: number;
  scheduledCount: number;
}

// ============== SUPPORT TICKET TYPES ==============
export interface SupportTicketItem {
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

export interface SupportTicketListParams {
  status?: string;
  category?: string;
  priority?: string;
  q?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: string;
}

export interface RespondTicketRequest {
  adminResponse: string;
  status?: string;
}

export interface SupportTicketStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
}

// ============== ADMIN PATIENT TYPES ==============
export interface AdminPatient {
  patientId: number;
  userId: number;
  email: string;
  fullName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  isVerified: boolean;
  lastLogin: string | null;
  createdAt: string;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  insuranceNumber: string | null;
  insuranceProvider: string | null;
  emergencyContact: string | null;
  bloodGroup: string | null;
  allergies: string | null;
  medicalHistory: string | null;
  totalAppointments: number;
}

export interface UpdatePatientRequest {
  fullName?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  insuranceNumber?: string;
  insuranceProvider?: string;
  emergencyContact?: string;
  bloodGroup?: string;
  allergies?: string;
  isActive?: boolean;
}

export interface AdminPatientListParams {
  q?: string;
  gender?: string;
  bloodGroup?: string;
  isActive?: boolean;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ============== ADMIN RECEPTIONIST TYPES ==============
export interface AdminReceptionist {
  receptionistId: number;
  userId: number;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  employeeId: string | null;
  department: string | null;
  shift: string | null;
  isActive: boolean;
  isVerified: boolean;
  lastLogin: string | null;
  createdAt: string;
}

export interface CreateReceptionistRequest {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  employeeId?: string;
  department?: string;
  shift?: string;
}

export interface UpdateReceptionistRequest {
  fullName?: string;
  phone?: string;
  employeeId?: string;
  department?: string;
  shift?: string;
  isActive?: boolean;
}

// ============== ROOM TYPES ==============
export interface Room {
  id: number;
  roomNumber: string;
  name: string | null;
  floor: number | null;
  isActive: boolean;
  doctorId: number | null;
  doctorName: string | null;
}

export interface UpsertRoomRequest {
  roomNumber: string;
  name?: string;
  floor?: number | null;
  isActive?: boolean;
}

export interface AdminReceptionistListParams {
  q?: string;
  department?: string;
  shift?: string;
  isActive?: boolean;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export default adminService;
