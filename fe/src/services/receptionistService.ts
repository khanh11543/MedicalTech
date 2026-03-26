import api from "./api";

// ==================== TYPES ====================

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW"
  | "RESCHEDULED";

export interface ReceptionistAppointmentDTO {
  id: number;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  department: string;
  appointmentDate: string;
  timeSlot: string;
  status: string;
  queueNumber?: number;
  checkInTime?: string;
  notes?: string;
}

export interface BookAppointmentRequest {
  patientId: number;
  doctorId: number;
  appointmentDate: string;
  timeSlotId: number;
  notes?: string;
}

export interface PaymentDTO {
  id: number;
  appointmentId: number;
  patientName: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod?: string;
  createdAt: string;
  paidAt?: string;
}

export interface CreatePaymentRequest {
  appointmentId: number;
  paymentMethod?: "CASH" | "MOMO";
}

export interface MomoInitResponse {
  payUrl: string;
  qrCodeUrl: string;
  orderId: string;
  requestId: string;
}

export interface QueueItemDTO {
  id: number;
  appointmentId: number;
  patientName: string;
  doctorName: string;
  department: string;
  queueNumber: number;
  status: string;
  checkInTime: string;
  estimatedWaitTime?: number;
}

export interface DashboardStats {
  totalAppointmentsToday: number;
  checkedInCount: number;
  pendingCount: number;
  completedCount: number;
  totalPaymentsToday: number;
  totalRevenueToday: number;
  averageWaitTime: number;
}

// ==================== NEW DASHBOARD TYPES ====================

export interface ReceptionistDashboardStatsDTO {
  todayTotalAppointments: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  checkedInCount: number;
  awaitingCheckIn: number;
  inProgressCount: number;
  totalInQueue: number;
  activeDoctors: number;
  avgWaitTimeMinutes: number;
  noShowCount: number;
  overdueCount: number;
  todayRevenue: number;
  pendingPayments: number;
  pendingPaymentAmount: number;
  completedPayments: number;
}

export interface UpcomingAppointmentDTO {
  id: number;
  appointmentCode: string;
  patientName: string;
  maskedPhone: string;
  doctorName: string;
  doctorSpecialization: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  queueNumber: number | null;
  minutesUntilStart: number;
}

export interface DoctorQueueStatusDTO {
  doctorId: number;
  doctorName: string;
  specialization: string;
  totalAppointmentsToday: number;
  checkedInWaiting: number;
  inProgress: number;
  completed: number;
  noShow: number;
  currentQueueNumber: number | null;
  nextQueueNumber: number | null;
  estimatedWaitMinutes: number;
}

export interface CallNextDTO {
  queueNumber?: number;
  note?: string;
}

export interface QueueCallResultDTO {
  success: boolean;
  message: string;
  appointmentId: number;
  appointmentCode: string;
  patientName: string;
  maskedPhone: string;
  queueNumber: number;
  startTime: string;
  newStatus: AppointmentStatus;
  remainingInQueue: number;
  nextQueueNumber: number | null;
}

export interface PendingActionsDTO {
  needConfirmation: number;
  awaitingCheckIn: number;
  overdueAppointments: number;
  pendingPayments: number;
  inQueueCount: number;
  noShowCandidates: number;
}

export interface AppointmentConfirmDTO {
  id: number;
  appointmentCode: string;
  patientName: string;
  maskedPhone: string;
  doctorName: string;
  doctorSpecialization: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  bookedByType: string;
}

export interface NoShowAppointmentDTO {
  id: number;
  appointmentCode: string;
  patientName: string;
  maskedPhone: string;
  doctorName: string;
  doctorSpecialization: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  minutesOverdue: number;
  currentStatus: string;
}

export interface MarkNoShowDTO {
  reason: string;
  sendNotification?: boolean;
}

export interface NotifyDoctorDTO {
  priority?: "NORMAL" | "URGENT" | "VIP";
  message?: string;
}

export interface DashboardPreferencesDTO {
  showAppointmentStats: boolean;
  showQueueStatus: boolean;
  showPaymentSummary: boolean;
  showUpcomingAppointments: boolean;
  showPendingActions: boolean;
  showNoShowAlerts: boolean;
  upcomingAppointmentsLimit: number;
  refreshIntervalSeconds: number;
  defaultDateRange: string;
}

export interface ReceptionistAppointmentListDTO {
  id: number;
  appointmentCode: string;
  patientId: number;
  patientName: string;
  maskedPhone: string;
  doctorId: number;
  doctorName: string;
  doctorSpecialization: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  bookedBy: string;
  bookedByUserName: string;
  queueNumber: number | null;
  checkedInAt: string | null;
  createdAt: string;
  appointmentType?: string;
  fee?: number;
  paymentId?: number | null;
  paymentStatus?: string;
  prescriptionId?: number | null;
  prescriptionPaymentStatus?: string;
  prescriptionTotalCost?: number;
}

// ==================== APPOINTMENT DETAIL TYPES ====================

export interface ReceptionistAppointmentDetailDTO {
  id: number;
  appointmentCode: string;
  status: AppointmentStatus;
  createdAt: string;
  updatedAt: string;
  createdByName: string;
  bookedBy: string;
  patient: PatientCardDTO;
  appointment: AppointmentCardDTO;
  doctor: DoctorCardDTO;
  payment: PaymentCardDTO | null;
  allowedActions: string[];
}

export interface PatientCardDTO {
  id: number;
  name: string;
  maskedPhone: string;
  email?: string;
  mrn?: string;
  gender?: string;
  dateOfBirth?: string;
}

export interface AppointmentCardDTO {
  appointmentDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  type?: string;
  status: AppointmentStatus;
  queueNumber?: number;
  reasonCategory?: string;
  adminNotes?: string;
  checkedInAt?: string;
  cancellationReason?: string;
  cancelledByName?: string;
}

export interface DoctorCardDTO {
  id: number;
  name: string;
  specialization: string;
  room?: string;
  consultationFee?: number;
}

export interface PaymentCardDTO {
  paymentId: number;
  fee: number;
  paymentStatus: string;
  paymentMethod?: string;
  receiptUrl?: string;
  paidAt?: string;
}

export interface CommunicationLogDTO {
  id: number;
  type: string;
  recipient: string;
  subject?: string;
  message?: string;
  status: string;
  errorMessage?: string;
  sentByUserId: number;
  sentByUserName: string;
  sentAt: string;
  createdAt: string;
  category: string;
}

export interface DocumentSummaryDTO {
  type: string;
  exists: boolean;
  accessible: boolean;
  downloadUrl?: string;
  label: string;
}

export interface NotificationTemplateDTO {
  id: string;
  name: string;
  channel: string;
  category: string;
  contentPreview: string;
  active: boolean;
}

export interface AppointmentCategoryDTO {
  id: number;
  name: string;
  description: string;
  active: boolean;
}

export interface PatientBasicDTO {
  id: number;
  userId: number;
  name: string;
  maskedPhone: string;
  email?: string;
  gender?: string;
  dateOfBirth?: string;
  mrn?: string;
}

export interface BulkActionResultDTO {
  totalProcessed: number;
  successCount: number;
  failCount: number;
  results: BulkItemResult[];
  message: string;
}

export interface BulkItemResult {
  appointmentId: number;
  appointmentCode: string;
  success: boolean;
  message: string;
  errorCode?: string;
}

export interface BulkReminderResultDTO {
  totalProcessed: number;
  successCount: number;
  failCount: number;
  message: string;
  quotaRemaining: number;
  quotaLimit: number;
  results: BulkItemResult[];
}

export interface CreateFollowUpRequest {
  doctorId?: number;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  type?: string;
  adminNote?: string;
}

export interface CreatePatientRequest {
  name: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

// ==================== PAYMENT TAB 5 TYPES ====================

export interface MarkCashPaymentDTO {
  transactionId?: string;
  notes?: string;
  amountReceived?: number;
  changeGiven?: number;
  printReceipt?: boolean;
  emailReceipt?: boolean;
  smsReceipt?: boolean;
}

export interface PendingPaymentDTO {
  paymentId: number;
  paymentCode: string;
  appointmentId: number;
  appointmentCode: string;
  appointmentStatus: string;
  completedAt: string;
  patientId: number;
  patientName: string;
  maskedPhone: string;
  email: string;
  doctorName: string;
  amountDue: number;
  currency: string;
  daysPending: number;
  lastReminderSent: string | null;
  reminderCount: number;
  urgencyLevel: string;
  createdAt: string;
}

export interface HourlyRevenueDTO {
  date: string;
  totalRevenue: number;
  totalTransactions: number;
  hourlyData: {
    hour: number;
    label: string;
    revenue: number;
    transactionCount: number;
    cashAmount: number;
    momoAmount: number;
  }[];
}

export interface EndOfDayReportDTO {
  reportDate: string;
  generatedBy: string;
  generatedAt: string;
  totalRevenue: number;
  totalTransactions: number;
  cashTotal: number;
  cashTransactions: number;
  momoTotal: number;
  momoTransactions: number;
  pendingCount: number;
  pendingAmount: number;
  transactions: {
    transactionCode: string;
    appointmentCode: string;
    paidTime: string;
    amount: number;
    paymentMethod: string;
    status: string;
    collectedBy: string;
  }[];
}

export interface PaymentFullDTO {
  id: number;
  paymentCode: string;
  appointmentId: number;
  appointmentCode: string;
  patientId: number;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  doctorName: string;
  amount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  transactionId: string;
  paidAt: string;
  processedByName: string;
  amountReceived: number;
  changeGiven: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
  qrCodeUrl: string;
  qrExpiresAt: string;
}

// ==================== REPORT TYPES (Tab 6) ====================

export interface DailyAppointmentReportDTO {
  reportDate: string;
  generatedBy: string;
  branch: string;
  generatedAt: string;
  summary: {
    totalAppointments: number;
    confirmed: number;
    checkedIn: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    noShow: number;
    pending: number;
    rescheduled: number;
    completionRate: number;
  };
  appointments: {
    appointmentCode: string;
    startTime: string;
    endTime: string;
    patientName: string;
    maskedPhone: string;
    doctorName: string;
    room: string;
    status: string;
    queueNumber: number | null;
    paymentStatus: string;
  }[];
}

export interface DailyRevenueReportDTO {
  reportDate: string;
  generatedBy: string;
  branch: string;
  generatedAt: string;
  totalRevenue: number;
  cashTotal: number;
  cashTransactions: number;
  momoTotal: number;
  momoTransactions: number;
  pendingPaymentsCount: number;
  pendingPaymentsAmount: number;
  cashDrawerExpectedBalance: number;
  transactions: {
    transactionCode: string;
    paidTime: string;
    appointmentCode: string;
    patientName: string;
    amount: number;
    paymentMethod: string;
    collectedBy: string;
  }[];
  pendingPayments: {
    paymentCode: string;
    appointmentCode: string;
    patientName: string;
    maskedPhone: string;
    amount: number;
    createdAt: string;
  }[];
}

export interface QueuePerformanceReportDTO {
  reportDate: string;
  generatedBy: string;
  branch: string;
  generatedAt: string;
  totalCheckedIn: number;
  avgWaitMinutes: number;
  longestWaitMinutes: number;
  noShowRate: number;
  noShowCount: number;
  totalScheduled: number;
  byDoctor: {
    doctorId: number;
    doctorName: string;
    room: string;
    patientsServed: number;
    patientsWaiting: number;
    avgWaitMinutes: number;
    longestWaitMinutes: number;
    peakHour: string;
  }[];
}

export interface ExportQuotaDTO {
  remainingExports: number;
  maxPerDay: number;
}

// ==================== SERVICE ====================

const receptionistService = {
  // ========== APPOINTMENTS ==========

  bookAppointment: async (data: BookAppointmentRequest) => {
    const response = await api.post("/receptionist/appointments", data);
    return response.data;
  },

  checkInPatient: async (appointmentId: number) => {
    const response = await api.patch(
      `/receptionist/appointments/${appointmentId}/check-in`
    );
    return response.data;
  },

  getTodayAppointments: async (
    page: number = 0,
    size: number = 20,
    status?: string
  ) => {
    const today = new Date().toISOString().split("T")[0];
    const params: Record<string, string | number> = { page, size, date: today };
    if (status) params.status = status;
    const response = await api.get("/admin/appointments", { params });
    return response.data;
  },

  getAppointmentById: async (id: number) => {
    const response = await api.get(`/admin/appointments/${id}`);
    return response.data;
  },

  // ========== PAYMENTS ==========

  createPayment: async (data: CreatePaymentRequest) => {
    const response = await api.post("/receptionist/payments", data);
    return response.data;
  },

  initMomoPayment: async (paymentId: number) => {
    const response = await api.post(
      `/receptionist/payments/${paymentId}/momo/init`
    );
    return response.data;
  },

  getPaymentQR: async (paymentId: number) => {
    const response = await api.get(`/receptionist/payments/${paymentId}/qr`);
    return response.data;
  },

  refreshPaymentQR: async (paymentId: number) => {
    const response = await api.post(
      `/receptionist/payments/${paymentId}/qr/refresh`
    );
    return response.data;
  },

  markPaymentCash: async (paymentId: number) => {
    const response = await api.patch(
      `/receptionist/payments/${paymentId}/mark-cash`
    );
    return response.data;
  },

  cancelPayment: async (paymentId: number) => {
    const response = await api.patch(
      `/receptionist/payments/${paymentId}/cancel`
    );
    return response.data;
  },

  getPaymentById: async (paymentId: number) => {
    const response = await api.get(`/receptionist/payments/${paymentId}`);
    return response.data;
  },

  getInvoiceByPayment: async (paymentId: number) => {
    const response = await api.get(
      `/receptionist/payments/invoices/by-payment/${paymentId}`
    );
    return response.data;
  },

  downloadInvoicePDF: async (invoiceId: number) => {
    const response = await api.get(
      `/receptionist/payments/invoices/${invoiceId}/pdf`,
      { responseType: "blob" }
    );
    return response.data;
  },

  getPayments: async (page: number = 0, size: number = 20, status?: string) => {
    const params: Record<string, string | number> = { page, size };
    if (status) params.status = status;
    const response = await api.get("/receptionist/payments", { params });
    return response.data;
  },

  // ========== QUEUE (Legacy) ==========

  getTodayQueue: async () => {
    const today = new Date().toISOString().split("T")[0];
    const response = await api.get("/admin/appointments", {
      params: { date: today, status: "CHECKED_IN", size: 100, sort: "queueNumber,asc" },
    });
    return response.data;
  },

  // ========== DASHBOARD STATS (Legacy) ==========

  getDashboardStats: async (): Promise<DashboardStats> => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const [appointmentsRes, paymentsRes] = await Promise.all([
        api.get("/admin/appointments", { params: { date: today, size: 1 } }),
        api.get("/admin/payments", { params: { size: 1 } }),
      ]);

      const totalAppointments = appointmentsRes.data?.totalElements || 0;
      const totalPayments = paymentsRes.data?.totalElements || 0;

      return {
        totalAppointmentsToday: totalAppointments,
        checkedInCount: 0,
        pendingCount: 0,
        completedCount: 0,
        totalPaymentsToday: totalPayments,
        totalRevenueToday: 0,
        averageWaitTime: 0,
      };
    } catch {
      return {
        totalAppointmentsToday: 0,
        checkedInCount: 0,
        pendingCount: 0,
        completedCount: 0,
        totalPaymentsToday: 0,
        totalRevenueToday: 0,
        averageWaitTime: 0,
      };
    }
  },

  // ==================== NEW DASHBOARD APIs ====================

  // A. Dashboard Stats
  getDashboardStatsV2: async (date?: string): Promise<ReceptionistDashboardStatsDTO> => {
    const params: Record<string, string> = {};
    if (date) params.date = date;
    const response = await api.get("/receptionist/dashboard/stats", { params });
    return response.data;
  },

  // B. Today's Appointments (paginated, privacy-respecting)
  getTodayAppointmentsV2: async (
    pageNumber: number = 0,
    pageSize: number = 10,
    status?: string,
    sortBy: string = "startTime",
    sortOrder: string = "ASC"
  ): Promise<PageResponse<ReceptionistAppointmentListDTO>> => {
    const params: Record<string, string | number> = { pageNumber, pageSize, sortBy, sortOrder };
    if (status) params.status = status;
    const response = await api.get("/receptionist/appointments/today", { params });
    return response.data;
  },

  // C. Upcoming Appointments (top N)
  getTodayUpcoming: async (limit: number = 5): Promise<UpcomingAppointmentDTO[]> => {
    const response = await api.get("/receptionist/appointments/today/upcoming", {
      params: { limit },
    });
    return response.data;
  },

  // D. Queue Status (per-doctor)
  getQueueStatus: async (): Promise<DoctorQueueStatusDTO[]> => {
    const response = await api.get("/receptionist/queue/status");
    return response.data;
  },

  // E. Call Next Patient
  callNextPatient: async (doctorId: number, dto?: CallNextDTO): Promise<QueueCallResultDTO> => {
    const response = await api.post(`/receptionist/queue/${doctorId}/call-next`, dto || {});
    return response.data;
  },

  // F. Pending Actions
  getPendingActions: async (): Promise<PendingActionsDTO> => {
    const response = await api.get("/receptionist/dashboard/pending-actions");
    return response.data;
  },

  // G. Need Confirmation
  getNeedConfirmation: async (
    pageNumber: number = 0,
    pageSize: number = 10
  ): Promise<PageResponse<AppointmentConfirmDTO>> => {
    const response = await api.get("/receptionist/appointments/need-confirmation", {
      params: { pageNumber, pageSize },
    });
    return response.data;
  },

  // H. No-Show Candidates
  getNoShowCandidates: async (
    pageNumber: number = 0,
    pageSize: number = 10
  ): Promise<PageResponse<NoShowAppointmentDTO>> => {
    const response = await api.get("/receptionist/appointments/no-shows", {
      params: { pageNumber, pageSize },
    });
    return response.data;
  },

  // I. Mark No-Show
  markNoShow: async (appointmentId: number, dto: MarkNoShowDTO) => {
    const response = await api.patch(
      `/receptionist/appointments/${appointmentId}/mark-no-show`,
      dto
    );
    return response.data;
  },

  // I2. Notify Doctor
  notifyDoctor: async (appointmentId: number, dto?: NotifyDoctorDTO): Promise<void> => {
    await api.post(
      `/receptionist/appointments/${appointmentId}/notify-doctor`,
      dto || {}
    );
  },

  // J. Preferences
  getPreferences: async (): Promise<DashboardPreferencesDTO> => {
    const response = await api.get("/receptionist/dashboard/preferences");
    return response.data;
  },

  updatePreferences: async (dto: DashboardPreferencesDTO): Promise<DashboardPreferencesDTO> => {
    const response = await api.put("/receptionist/dashboard/preferences", dto);
    return response.data;
  },

  // ==================== APPOINTMENT TAB APIs ====================

  // #17 - List appointments with filters (paginated, privacy-masked)
  getAppointments: async (params: {
    doctorId?: number;
    patientId?: number;
    status?: string;
    statuses?: string[];
    from?: string;
    to?: string;
    search?: string;
    appointmentType?: string;
    sortBy?: string;
    sortDir?: string;
    pageNumber?: number;
    pageSize?: number;
  }): Promise<PageResponse<ReceptionistAppointmentListDTO>> => {
    const response = await api.get("/receptionist/appointments", { params });
    return response.data;
  },

  // #1 - Confirm a PENDING appointment
  confirmAppointment: async (id: number, adminNote?: string) => {
    const response = await api.patch(`/receptionist/appointments/${id}/confirm`, adminNote ? { adminNote } : {});
    return response.data;
  },

  // #2 - Upcoming appointments (tomorrow+)
  getUpcomingAppointments: async (params: {
    from?: string;
    to?: string;
    pageNumber?: number;
    pageSize?: number;
  }): Promise<PageResponse<ReceptionistAppointmentListDTO>> => {
    const response = await api.get("/receptionist/appointments/upcoming", { params });
    return response.data;
  },

  // #3 - History (COMPLETED/CANCELLED/NO_SHOW)
  getAppointmentHistory: async (params: {
    from?: string;
    to?: string;
    status?: string;
    search?: string;
    pageNumber?: number;
    pageSize?: number;
  }): Promise<PageResponse<ReceptionistAppointmentListDTO>> => {
    const response = await api.get("/receptionist/appointments/history", { params });
    return response.data;
  },

  // #4 - Bulk confirm
  bulkConfirm: async (appointmentIds: number[], adminNote?: string): Promise<BulkActionResultDTO> => {
    const response = await api.post("/receptionist/appointments/bulk/confirm", { appointmentIds, adminNote });
    return response.data;
  },

  // #5 - Bulk send reminders (with quota)
  bulkSendReminders: async (appointmentIds: number[], messageType?: string): Promise<BulkReminderResultDTO> => {
    const response = await api.post("/receptionist/appointments/bulk/reminders", {
      appointmentIds,
      messageType: messageType || "EMAIL",
    });
    return response.data;
  },

  // #6 - Bulk cancel
  bulkCancel: async (appointmentIds: number[], reason: string, sendNotification?: boolean): Promise<BulkActionResultDTO> => {
    const response = await api.post("/receptionist/appointments/bulk/cancel", {
      appointmentIds,
      reason,
      sendNotification: sendNotification ?? true,
    });
    return response.data;
  },

  // #7 - Send single reminder
  sendReminder: async (id: number, channel: string, templateId?: string): Promise<CommunicationLogDTO> => {
    const response = await api.post(`/receptionist/appointments/${id}/send-reminder`, { channel, templateId });
    return response.data;
  },

  // #7b - Cancel single appointment (shared endpoint)
  cancelAppointment: async (id: number, data: {
    reason: string;
    refundAmount?: number;
    sendNotification?: boolean;
    notificationMessage?: string;
  }) => {
    const response = await api.patch(`/appointments/${id}/cancel`, data);
    return response.data;
  },

  // #7c - Reschedule appointment (shared endpoint)
  rescheduleAppointment: async (id: number, data: {
    newDate: string;      // yyyy-MM-dd
    newStartTime: string; // HH:mm
    newEndTime: string;   // HH:mm
    reason?: string;
  }) => {
    const response = await api.patch(`/appointments/${id}/reschedule`, data);
    return response.data;
  },

  // #7d - Get available slots for a doctor (public endpoint)
  getAvailableSlots: async (doctorId: number, dateFrom?: string, dateTo?: string) => {
    const params: Record<string, string> = {};
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    const response = await api.get(`/public/doctors/${doctorId}/slots`, { params });
    return response.data as Array<{
      id: number;
      doctorId: number;
      doctorName: string;
      slotDate: string;
      startTime: string;
      endTime: string;
      status: string;
      isAvailable: boolean;
    }>;
  },

  // #8 - Appointment detail (aggregated, privacy-safe)
  getAppointmentDetail: async (id: number): Promise<ReceptionistAppointmentDetailDTO> => {
    const response = await api.get(`/receptionist/appointments/${id}/detail`);
    return response.data;
  },

  // #9 - Communication logs
  getCommunicationLogs: async (id: number): Promise<CommunicationLogDTO[]> => {
    const response = await api.get(`/receptionist/appointments/${id}/communications`);
    return response.data;
  },

  // #10 - Send template message
  sendTemplateMessage: async (id: number, channel: string, templateId: string): Promise<CommunicationLogDTO> => {
    const response = await api.post(`/receptionist/appointments/${id}/send-message`, { channel, templateId });
    return response.data;
  },

  // #11 - Document summaries
  getDocuments: async (id: number): Promise<DocumentSummaryDTO[]> => {
    const response = await api.get(`/receptionist/appointments/${id}/documents`);
    return response.data;
  },

  // #14 - Create follow-up
  createFollowUp: async (id: number, data: CreateFollowUpRequest) => {
    const response = await api.post(`/receptionist/appointments/${id}/create-follow-up`, data);
    return response.data;
  },

  // #15 - Print check-in slip (PDF download)
  printCheckInSlip: async (id: number): Promise<Blob> => {
    const response = await api.get(`/receptionist/appointments/${id}/print-slip`, { responseType: "blob" });
    return response.data;
  },

  // #16 - Notification templates
  getNotificationTemplates: async (): Promise<NotificationTemplateDTO[]> => {
    const response = await api.get("/receptionist/appointments/notification-templates");
    return response.data;
  },

  // #17b - Appointment categories
  getCategories: async (): Promise<AppointmentCategoryDTO[]> => {
    const response = await api.get("/receptionist/appointments/categories");
    return response.data;
  },

  // #19 - Export appointments
  exportAppointments: async (params: {
    doctorId?: number;
    patientId?: number;
    status?: string;
    statuses?: string[];
    from?: string;
    to?: string;
    search?: string;
    format?: string;
    columns?: string[];
  }): Promise<Blob> => {
    const response = await api.get("/receptionist/appointments/export", { params, responseType: "blob" });
    return response.data;
  },

  // Patient search
  searchPatients: async (query: string): Promise<PatientBasicDTO[]> => {
    const response = await api.get("/receptionist/patients/search", { params: { q: query } });
    return response.data;
  },

  // Create walk-in patient
  createPatient: async (data: CreatePatientRequest) => {
    const response = await api.post("/receptionist/patients", data);
    return response.data;
  },

  // ==================== PAYMENT TAB 5 — NEW APIs ====================

  // Mark cash payment with extended details
  markPaymentCashV2: async (paymentId: number, dto: MarkCashPaymentDTO) => {
    const response = await api.patch(`/receptionist/payments/${paymentId}/mark-cash`, dto);
    return response.data;
  },

  // Get pending payments (completed appointments not yet paid)
  getPendingPayments: async (params: {
    search?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  }): Promise<PageResponse<PendingPaymentDTO>> => {
    const response = await api.get("/receptionist/payments/pending", { params });
    return response.data;
  },

  // Send payment link to patient
  sendPaymentLink: async (paymentId: number, dto: { sendVia: string; customMessage?: string }) => {
    const response = await api.post(`/receptionist/payments/${paymentId}/send-payment-link`, dto);
    return response.data;
  },

  // Send invoice/receipt to patient via email/SMS
  sendInvoice: async (paymentId: number, dto: { sendEmail?: boolean; sendSms?: boolean; email?: string; phone?: string; message?: string }) => {
    const response = await api.post(`/receptionist/payments/${paymentId}/send-invoice`, dto);
    return response.data;
  },

  // Get payment statistics (receptionist)
  getPaymentStatistics: async (from?: string, to?: string) => {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const response = await api.get("/receptionist/payments/statistics", { params });
    return response.data;
  },

  // Get hourly revenue
  getHourlyRevenue: async (date?: string): Promise<HourlyRevenueDTO> => {
    const params: Record<string, string> = {};
    if (date) params.date = date;
    const response = await api.get("/receptionist/payments/revenue/hourly", { params });
    return response.data;
  },

  // Get end-of-day report
  getEndOfDayReport: async (date?: string): Promise<EndOfDayReportDTO> => {
    const params: Record<string, string> = {};
    if (date) params.date = date;
    const response = await api.get("/receptionist/payments/report/end-of-day", { params });
    return response.data;
  },

  // Export end-of-day report
  exportEndOfDayReport: async (date?: string, format: string = "EXCEL"): Promise<Blob> => {
    const params: Record<string, string> = { format };
    if (date) params.date = date;
    const response = await api.get("/receptionist/payments/report/end-of-day/export", {
      params,
      responseType: "blob",
    });
    return response.data;
  },

  // ========== REPORTS (Tab 6) ==========

  // 6.1 Daily Appointments Report
  getDailyAppointmentReport: async (date?: string, doctorId?: number): Promise<DailyAppointmentReportDTO> => {
    const params: Record<string, string> = {};
    if (date) params.date = date;
    if (doctorId) params.doctorId = String(doctorId);
    const response = await api.get("/receptionist/reports/daily-appointments", { params });
    return response.data;
  },

  exportDailyAppointments: async (format: string = "PDF", date?: string, doctorId?: number): Promise<Blob> => {
    const params: Record<string, string> = { format };
    if (date) params.date = date;
    if (doctorId) params.doctorId = String(doctorId);
    const response = await api.get("/receptionist/reports/daily-appointments/export", {
      params,
      responseType: "blob",
    });
    return response.data;
  },

  // 6.2 Daily Revenue Summary
  getDailyRevenueReport: async (date?: string): Promise<DailyRevenueReportDTO> => {
    const params: Record<string, string> = {};
    if (date) params.date = date;
    const response = await api.get("/receptionist/reports/daily-revenue", { params });
    return response.data;
  },

  exportDailyRevenue: async (format: string = "PDF", date?: string): Promise<Blob> => {
    const params: Record<string, string> = { format };
    if (date) params.date = date;
    const response = await api.get("/receptionist/reports/daily-revenue/export", {
      params,
      responseType: "blob",
    });
    return response.data;
  },

  // 6.3 Queue Performance (Today Only)
  getQueuePerformanceReport: async (): Promise<QueuePerformanceReportDTO> => {
    const response = await api.get("/receptionist/reports/queue-performance");
    return response.data;
  },

  exportQueuePerformance: async (format: string = "PDF"): Promise<Blob> => {
    const params: Record<string, string> = { format };
    const response = await api.get("/receptionist/reports/queue-performance/export", {
      params,
      responseType: "blob",
    });
    return response.data;
  },

  // Export quota
  getExportQuota: async (): Promise<ExportQuotaDTO> => {
    const response = await api.get("/receptionist/reports/export-quota");
    return response.data;
  },
};

export default receptionistService;
