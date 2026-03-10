import api from "./api";

<<<<<<< HEAD
// Appointment interface based on API response
export interface Appointment {
  id: number;
=======
// =========== ENUMS ===========
export enum AppointmentStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  CHECKED_IN = "CHECKED_IN",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  NO_SHOW = "NO_SHOW",
  RESCHEDULED = "RESCHEDULED",
}

export enum AppointmentType {
  CONSULTATION = "CONSULTATION",
  FOLLOW_UP = "FOLLOW_UP",
  EMERGENCY = "EMERGENCY",
  CHECKUP = "CHECKUP",
}

export enum PaymentStatus {
  PAID = "PAID",
  PENDING = "PENDING",
  REFUNDED = "REFUNDED",
}

// =========== INTERFACES ===========
export interface AppointmentDTO {
  id: number;
  appointmentCode: string;
>>>>>>> Dev
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
<<<<<<< HEAD
  status: string;
  bookedBy: string;
  bookedByUserName: string;
  symptoms: string;
  cancellationReason: string;
  checkedInAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Sort interface
export interface Sort {
  empty: boolean;
  sorted: boolean;
  unsorted: boolean;
}

// Pageable interface
export interface Pageable {
  pageNumber: number;
  pageSize: number;
  sort: Sort;
  offset: number;
  paged: boolean;
  unpaged: boolean;
}

// Paginated response interface
export interface PaginatedAppointments {
  content: Appointment[];
  pageable: Pageable;
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort: Sort;
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}

// Query parameters for getting doctor appointments
export interface GetDoctorAppointmentsParams {
  page?: number;
  size?: number;
  sort?: string;
  status?: string;
  search?: string;
}

/**
 * Fetch doctor appointments with optional filters
 * @param params - Query parameters (pagination, sorting, filtering)
 * @returns Promise with paginated appointments
 */
export const getDoctorAppointments = async (
  params?: GetDoctorAppointmentsParams
): Promise<PaginatedAppointments> => {
  const response = await api.get<PaginatedAppointments>("/doctor/appointments", {
    params,
  });
  return response.data;
};

/**
 * Get a single appointment by ID
 * @param appointmentId - The appointment ID
 * @returns Promise with appointment details
 */
export const getAppointmentDetails = async (
  appointmentId: number
): Promise<Appointment> => {
  const response = await api.get<Appointment>(`/doctor/appointments/${appointmentId}`);
  return response.data;
};

/**
 * Cancel an appointment
 * @param appointmentId - The appointment ID to cancel
 * @param reason - Reason for cancellation
 * @returns Promise with updated appointment
 */
export const cancelAppointment = async (
  appointmentId: number,
  reason?: string
): Promise<Appointment> => {
  const response = await api.patch<Appointment>(
    `/appointments/${appointmentId}/cancel`,
    { reason }
  );
  return response.data;
};

/**
 * Request to reschedule an appointment
 * @param appointmentId - The appointment ID
 * @param newDate - New date for the appointment
 * @param reason - Optional reason for rescheduling
 * @returns Promise with updated appointment
 */
export const requestRescheduleAppointment = async (
  appointmentId: number,
  newDate: string,
  reason?: string
): Promise<Appointment> => {
  const response = await api.patch<Appointment>(
    `/appointments/${appointmentId}/reschedule`,
    { newDate, reason }
  );
  return response.data;
};

/**
 * Confirm a pending appointment
 * @param appointmentId - The appointment ID to confirm
 * @returns Promise with updated appointment
 */
export const confirmAppointment = async (
  appointmentId: number
): Promise<Appointment> => {
  const response = await api.patch<Appointment>(
    `/doctor/appointments/${appointmentId}/confirm`
  );
  return response.data;
};
=======
  status: AppointmentStatus;
  bookedBy: string;
  bookedByUserName: string;
  queueNumber: number | null;
  reasonForVisit: string;
  symptoms: string;
  notes: string;
  cancellationReason: string | null;
  checkedInAt: string | null;
  createdAt: string;
  updatedAt: string;
  appointmentType?: AppointmentType;
  paymentStatus?: PaymentStatus;
}

export interface AppointmentFilterDTO {
  doctorId?: number | null;
  patientId?: number | null;
  status?: AppointmentStatus | null;
  statuses?: AppointmentStatus[];
  from?: string | null;
  to?: string | null;
  date?: string | null;
  appointmentType?: AppointmentType | null;
  paymentStatus?: PaymentStatus | null;
  search?: string | null;
  pageNumber?: number;
  pageSize?: number;
}

export interface RescheduleDTO {
  newDate: string;
  newStartTime: string;
  newEndTime: string;
  reason: string;
}

export interface CancelDTO {
  reason: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface AppointmentHistoryDTO {
  id: number;
  appointmentId: number;
  action: string;
  previousStatus: AppointmentStatus | null;
  newStatus: AppointmentStatus | null;
  changedByUserId: number;
  changedByUserName: string;
  notes: string | null;
  createdAt: string;
}

export interface AppointmentStatsDTO {
  // Summary counts
  todayTotal: number;
  weekTotal: number;
  monthTotal: number;
  
  // Today's breakdown
  todayPending: number;
  todayConfirmed: number;
  todayCheckedIn: number;
  todayCompleted: number;
  todayCancelled: number;
  todayNoShow: number;
  
  // Rates
  completionRate: number;
  cancellationRate: number;
  noShowRate: number;
  
  // Trends
  dailyTrend: Record<string, number>;
  statusBreakdown: Record<string, number>;
  doctorBreakdown: Record<string, number>;
  hourlyDistribution: Record<string, number>;
  
  // Peak
  peakHour: string;
  peakHourCount: number;
  
  // Average wait time
  avgWaitTimeMinutes: number;
  
  // Comparison with previous period
  weekOverWeekChange: number;
  monthOverMonthChange: number;
  
  // Legacy properties for backward compatibility
  todayByStatus?: Record<AppointmentStatus, number>;
  weekTrend?: number;
  cancellationTrend?: number;
  noShowByDoctor?: { doctorName: string; rate: number }[];
}

export interface DoctorOption {
  id: number;
  name: string;
  specialization: string;
}

export interface PatientOption {
  id: number;
  name: string;
  email: string;
}

// =========== DETAIL PAGE INTERFACES ===========
export interface AppointmentDetailDTO extends AppointmentDTO {
  // Extended patient info
  patientAvatar?: string;
  patientDob?: string;
  patientGender?: string;
  patientAddress?: string;
  
  // Extended doctor info
  doctorAvatar?: string;
  doctorPhone?: string;
  doctorConsultationFee?: number;
  doctorExperience?: number;
  
  // Additional details
  doctorNotes?: string;
  diagnosis?: string;
  timeSlotId?: number;
  duration?: number;
  
  // Queue info
  checkedInBy?: string;
  checkedInByUserId?: number;
  estimatedWaitTime?: number;
  
  // Payment info
  paymentId?: number;
  paymentAmount?: number;
  paymentMethod?: string;
  paymentDate?: string;
}

export interface CommunicationDTO {
  id: number;
  appointmentId: number;
  type: "CONFIRMATION" | "REMINDER" | "CANCELLATION" | "RESCHEDULE" | "CUSTOM";
  channel: "EMAIL" | "SMS";
  recipient: string;
  subject?: string;
  content: string;
  status: "PENDING" | "SENT" | "DELIVERED" | "FAILED";
  sentAt?: string;
  deliveredAt?: string;
  failureReason?: string;
  createdAt: string;
}

export interface PrescriptionDTO {
  id: number;
  prescriptionCode: string;
  appointmentId: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  diagnosis: string;
  notes: string;
  medications: MedicationDTO[];
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
}

export interface MedicationDTO {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  quantity: number;
}

export interface MedicalRecordDTO {
  id: number;
  recordCode: string;
  appointmentId: number;
  patientId: number;
  doctorId: number;
  diagnosis: string;
  symptoms: string;
  examination: string;
  treatment: string;
  notes: string;
  createdAt: string;
}

export interface PaymentRecordDTO {
  id: number;
  paymentCode: string;
  appointmentId: number;
  amount: number;
  status: PaymentStatus;
  method: string;
  transactionId?: string;
  paidAt?: string;
  refundedAt?: string;
  refundAmount?: number;
  invoiceUrl?: string;
  createdAt: string;
}

export interface ReviewDTO {
  id: number;
  appointmentId: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  rating: number;
  comment: string;
  isAnonymous: boolean;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

export interface RelatedRecordsDTO {
  prescriptions: PrescriptionDTO[];
  medicalRecord: MedicalRecordDTO | null;
  payments: PaymentRecordDTO[];
  review: ReviewDTO | null;
}

export interface SendMessageDTO {
  messageType: "EMAIL" | "SMS";
  message: string;
  subject?: string;
  sendCopy?: boolean;
  copyRecipient?: string;
}

// =========== SERVICE ===========
const appointmentService = {
  // Get all appointments with filters (Admin)
  getAllAppointments: async (
    filter: AppointmentFilterDTO
  ): Promise<PageResponse<AppointmentDTO>> => {
    const params = new URLSearchParams();
    
    if (filter.doctorId) params.append("doctorId", filter.doctorId.toString());
    if (filter.patientId) params.append("patientId", filter.patientId.toString());
    if (filter.status) params.append("status", filter.status);
    // Support multiple status filtering
    if (filter.statuses && filter.statuses.length > 0) {
      filter.statuses.forEach(status => params.append("statuses", status));
    }
    if (filter.from) params.append("from", filter.from);
    if (filter.to) params.append("to", filter.to);
    if (filter.search) params.append("search", filter.search);
    if (filter.appointmentType) params.append("appointmentType", filter.appointmentType);
    if (filter.paymentStatus) params.append("paymentStatus", filter.paymentStatus);
    params.append("pageNumber", (filter.pageNumber ?? 0).toString());
    params.append("pageSize", (filter.pageSize ?? 10).toString());

    const response = await api.get(`/admin/appointments?${params.toString()}`);
    return response.data;
  },

  // Get single appointment by ID
  getAppointmentById: async (id: number): Promise<AppointmentDTO> => {
    const response = await api.get(`/admin/appointments/${id}`);
    return response.data;
  },

  // Reschedule appointment
  rescheduleAppointment: async (
    id: number,
    data: RescheduleDTO
  ): Promise<AppointmentDTO> => {
    const response = await api.put(`/admin/appointments/${id}/reschedule`, data);
    return response.data;
  },

  // Cancel appointment
  cancelAppointment: async (
    id: number,
    data: CancelDTO
  ): Promise<AppointmentDTO> => {
    const response = await api.put(`/admin/appointments/${id}/cancel`, data);
    return response.data;
  },

  // Get appointment history
  getAppointmentHistory: async (
    id: number
  ): Promise<AppointmentHistoryDTO[]> => {
    const response = await api.get(`/admin/appointments/${id}/history`);
    return response.data;
  },

  // Check-in patient (Receptionist)
  checkInPatient: async (id: number): Promise<AppointmentDTO> => {
    const response = await api.patch(`/receptionist/appointments/${id}/check-in`);
    return response.data;
  },

  // Confirm appointment (Doctor)
  confirmAppointment: async (id: number): Promise<AppointmentDTO> => {
    const response = await api.patch(`/doctor/appointments/${id}/confirm`);
    return response.data;
  },

  // Get doctors for dropdown
  getDoctors: async (): Promise<DoctorOption[]> => {
    const response = await api.get("/public/doctors?pageSize=100");
    // Map the response to DoctorOption format
    return response.data.content.map((doctor: { id: number; fullName: string; specialtyName: string }) => ({
      id: doctor.id,
      name: doctor.fullName,
      specialization: doctor.specialtyName,
    }));
  },

  // Get patients for dropdown (Admin access)
  getPatients: async (): Promise<PatientOption[]> => {
    try {
      const response = await api.get("/admin/users?role=PATIENT&pageSize=100");
      return response.data.content.map((user: { id: number; email: string; fullName?: string }) => ({
        id: user.id,
        name: user.fullName || user.email,
        email: user.email,
      }));
    } catch {
      return [];
    }
  },

  // Get appointment statistics
  getAppointmentStats: async (): Promise<AppointmentStatsDTO> => {
    try {
      const response = await api.get("/admin/appointments/stats");
      return response.data;
    } catch {
      // Return mock stats if endpoint doesn't exist
      return {
        todayTotal: 0,
        weekTotal: 0,
        monthTotal: 0,
        todayPending: 0,
        todayConfirmed: 0,
        todayCheckedIn: 0,
        todayCompleted: 0,
        todayCancelled: 0,
        todayNoShow: 0,
        completionRate: 0,
        cancellationRate: 0,
        noShowRate: 0,
        dailyTrend: {},
        statusBreakdown: {},
        doctorBreakdown: {},
        hourlyDistribution: {},
        peakHour: "",
        peakHourCount: 0,
        avgWaitTimeMinutes: 0,
        weekOverWeekChange: 0,
        monthOverMonthChange: 0,
      };
    }
  },

  // Bulk cancel appointments
  bulkCancel: async (ids: number[], reason: string): Promise<{ successCount: number; failCount: number; failedIds: number[] }> => {
    const response = await api.post("/admin/appointments/bulk/cancel", {
      appointmentIds: ids,
      reason: reason
    });
    return response.data;
  },

  // Export appointments to Excel (returns blob)
  exportToExcel: async (filter: AppointmentFilterDTO): Promise<Blob> => {
    const params = new URLSearchParams();
    if (filter.doctorId) params.append("doctorId", filter.doctorId.toString());
    if (filter.patientId) params.append("patientId", filter.patientId.toString());
    if (filter.status) params.append("status", filter.status);
    if (filter.from) params.append("from", filter.from);
    if (filter.to) params.append("to", filter.to);

    const response = await api.get(`/admin/appointments/export?${params.toString()}`, {
      responseType: "blob",
    });
    return response.data;
  },

  // Send reminder SMS
  sendReminder: async (ids: number[]): Promise<{ successCount: number; failCount: number; failedIds: number[] }> => {
    const response = await api.post("/admin/appointments/bulk/reminders", { appointmentIds: ids });
    return response.data;
  },

  // =========== DETAIL PAGE APIs ===========
  
  // Get appointment detail (extended info)
  getAppointmentDetail: async (id: number): Promise<AppointmentDetailDTO> => {
    const response = await api.get(`/admin/appointments/${id}/detail`);
    return response.data;
  },

  // Mark appointment as no-show
  markAsNoShow: async (id: number, data: { reason: string; sendNotification?: boolean }): Promise<AppointmentDTO> => {
    const response = await api.patch(`/admin/appointments/${id}/mark-no-show`, data);
    return response.data;
  },

  // Start appointment (set to IN_PROGRESS)
  startAppointment: async (id: number): Promise<AppointmentDTO> => {
    const response = await api.patch(`/admin/appointments/${id}/start`);
    return response.data;
  },

  // Complete appointment
  completeAppointment: async (id: number, data: { doctorNotes?: string; diagnosis?: string }): Promise<AppointmentDTO> => {
    const response = await api.patch(`/admin/appointments/${id}/complete`, data);
    return response.data;
  },

  // Get communications for an appointment
  getAppointmentCommunications: async (id: number): Promise<CommunicationDTO[]> => {
    const response = await api.get(`/admin/appointments/${id}/communications`);
    return response.data;
  },

  // Send custom message
  sendCustomMessage: async (id: number, data: SendMessageDTO): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/admin/appointments/${id}/send-message`, data);
    return response.data;
  },

  // Resend failed communication
  resendCommunication: async (appointmentId: number, communicationId: number): Promise<CommunicationDTO> => {
    const response = await api.post(`/admin/appointments/${appointmentId}/communications/${communicationId}/resend`);
    return response.data;
  },

  // Get all related records at once (optimized single API call)
  getRelatedRecords: async (id: number): Promise<RelatedRecordsDTO> => {
    try {
      const response = await api.get(`/admin/appointments/${id}/related`);
      return {
        prescriptions: response.data.prescriptions || [],
        medicalRecord: response.data.medicalRecord || null,
        payments: response.data.payments || [],
        review: response.data.review || null,
      };
    } catch {
      return {
        prescriptions: [],
        medicalRecord: null,
        payments: [],
        review: null,
      };
    }
  },

  // Get prescriptions for an appointment
  getAppointmentPrescriptions: async (id: number): Promise<PrescriptionDTO[]> => {
    const response = await api.get(`/admin/appointments/${id}/related`);
    // Extract prescriptions from related records response
    return response.data.prescriptions || [];
  },

  // Get medical record for an appointment
  getAppointmentMedicalRecord: async (id: number): Promise<MedicalRecordDTO | null> => {
    try {
      const response = await api.get(`/admin/appointments/${id}/related`);
      return response.data.medicalRecord || null;
    } catch {
      return null;
    }
  },

  // Get payment records for an appointment
  getAppointmentPayments: async (id: number): Promise<PaymentRecordDTO[]> => {
    const response = await api.get(`/admin/appointments/${id}/related`);
    return response.data.payments || [];
  },

  // Get review for an appointment
  getAppointmentReview: async (id: number): Promise<ReviewDTO | null> => {
    try {
      const response = await api.get(`/admin/appointments/${id}/related`);
      return response.data.review || null;
    } catch {
      return null;
    }
  },

  // Export history to PDF
  exportHistoryToPDF: async (id: number): Promise<Blob> => {
    const response = await api.get(`/admin/appointments/${id}/history/export`, {
      responseType: "blob",
    });
    return response.data;
  },

  // =========== STATISTICS API ===========

  // Helper: map FE filter to BE query params
  _mapFilterParams: (filter: StatisticsFilterDTO) => {
    const periodToGroupBy: Record<string, string> = {
      DAILY: "DAY",
      WEEKLY: "WEEK",
      MONTHLY: "MONTH",
    };
    return {
      from: filter.from,
      to: filter.to,
      doctorId: filter.doctorId,
      groupBy: filter.period ? periodToGroupBy[filter.period] || "DAY" : "DAY",
    };
  },

  // Get appointments over time (BE returns TimeSeriesStatsDTO wrapper)
  getAppointmentsOverTime: async (filter: StatisticsFilterDTO): Promise<AppointmentOverTimeDTO[]> => {
    const params = appointmentService._mapFilterParams(filter);
    const response = await api.get("/admin/appointments/statistics/over-time", { params });
    // BE returns { data: DataPoint[], ... } - extract and map
    const wrapper = response.data;
    const dataPoints = wrapper.data || [];
    return dataPoints.map((dp: { label: string; date: string; total: number; completed: number; cancelled: number; noShow: number }) => ({
      date: dp.date || dp.label,
      label: dp.label,
      total: dp.total || 0,
      pending: 0,
      confirmed: 0,
      completed: dp.completed || 0,
      cancelled: dp.cancelled || 0,
      noShow: dp.noShow || 0,
    }));
  },

  // Get appointments by status (BE returns StatusDistributionDTO wrapper)
  getAppointmentsByStatus: async (filter: StatisticsFilterDTO): Promise<AppointmentByStatusDTO[]> => {
    const params = appointmentService._mapFilterParams(filter);
    const response = await api.get("/admin/appointments/statistics/by-status", { params });
    // BE returns { total, distribution: [{status, statusDisplayName, count, percentage, color}] }
    const wrapper = response.data;
    const distribution = wrapper.distribution || [];
    return distribution.map((d: { status: string; count: number; percentage: number }) => ({
      status: d.status as AppointmentStatus,
      count: d.count || 0,
      percentage: d.percentage || 0,
    }));
  },

  // Get appointments by doctor (BE returns Page<DoctorStatsDTO>)
  getAppointmentsByDoctor: async (filter: StatisticsFilterDTO): Promise<AppointmentByDoctorDTO[]> => {
    const params = {
      from: filter.from,
      to: filter.to,
      page: 0,
      size: filter.limit || 10,
      sortBy: "totalAppointments",
      sortDir: "DESC",
    };
    const response = await api.get("/admin/appointments/statistics/by-doctor", { params });
    // BE returns Page with content array of DoctorStatsDTO
    const content = response.data.content || response.data || [];
    return content.map((d: {
      doctorId: number; doctorName: string; specialization: string; avatarUrl?: string;
      totalAppointments: number; completedAppointments: number; cancelledAppointments: number;
      noShowAppointments: number; completionRate: number;
    }) => ({
      doctorId: d.doctorId,
      doctorName: d.doctorName,
      doctorSpecialization: d.specialization || "",
      doctorAvatar: d.avatarUrl,
      total: d.totalAppointments || 0,
      completed: d.completedAppointments || 0,
      cancelled: d.cancelledAppointments || 0,
      noShow: d.noShowAppointments || 0,
      completionRate: d.completionRate || 0,
    }));
  },

  // Get peak hours analysis (BE returns nested PeakHoursHeatmapDTO)
  getPeakHoursAnalysis: async (filter: StatisticsFilterDTO): Promise<PeakHoursDTO[]> => {
    const params = appointmentService._mapFilterParams(filter);
    const response = await api.get("/admin/appointments/statistics/peak-hours", { params });
    // BE returns { days: [{dayName, dayShort, dayIndex, hours: [{hour, hourLabel, count, intensity}]}] }
    const wrapper = response.data;
    const result: PeakHoursDTO[] = [];
    if (wrapper.days) {
      for (const day of wrapper.days) {
        if (day.hours) {
          for (const h of day.hours) {
            result.push({
              dayOfWeek: day.dayIndex,
              dayName: day.dayShort || day.dayName,
              hour: h.hour,
              count: h.count || 0,
              intensity: h.intensity || 0,
            });
          }
        }
      }
    }
    return result;
  },

  // Get cancellation analysis (map BE CancellationAnalysisDTO to FE format)
  getCancellationAnalysis: async (filter: StatisticsFilterDTO): Promise<CancellationAnalysisDTO> => {
    const params = appointmentService._mapFilterParams(filter);
    const response = await api.get("/admin/appointments/statistics/cancellation", { params });
    const data = response.data;
    return {
      totalCancellations: data.totalCancellations || 0,
      cancellationRate: data.cancellationRate || 0,
      reasons: (data.topReasons || []).map((r: { reason: string; count: number; percentage: number }) => ({
        reason: r.reason || "Unknown",
        count: r.count || 0,
        percentage: r.percentage || 0,
      })),
      trend: (data.trend || []).map((t: { label: string; date: string; cancellations: number; rate: number }) => ({
        date: t.date || t.label,
        label: t.label,
        total: t.cancellations || 0,
        rate: t.rate || 0,
      })),
      byDoctor: [], // BE doesn't provide per-doctor cancellation breakdown
    };
  },

  // Get no-show analysis (map BE NoShowAnalysisDTO to FE format)
  getNoShowAnalysis: async (filter: StatisticsFilterDTO): Promise<NoShowAnalysisDTO> => {
    const params = appointmentService._mapFilterParams(filter);
    const response = await api.get("/admin/appointments/statistics/no-show", { params });
    const data = response.data;
    return {
      totalNoShows: data.totalNoShows || 0,
      noShowRate: data.noShowRate || 0,
      trend: (data.trend || []).map((t: { label: string; date: string; noShows: number; rate: number }) => ({
        date: t.date || t.label,
        label: t.label,
        total: t.noShows || 0,
        rate: t.rate || 0,
      })),
      repeatOffenders: (data.topRepeatOffenders || []).map((p: {
        patientId: number; patientName: string; phone: string; noShowCount: number; lastNoShowDate: string;
      }) => ({
        patientId: p.patientId,
        patientName: p.patientName,
        patientEmail: p.phone || "",
        noShowCount: p.noShowCount || 0,
        totalAppointments: p.noShowCount || 0,
        noShowRate: 100,
      })),
      byDoctor: [], // BE doesn't provide per-doctor no-show breakdown
    };
  },

  // Get average wait time (map BE WaitTimeStatsDTO to FE format)
  getAverageWaitTime: async (filter: StatisticsFilterDTO): Promise<WaitTimeAnalysisDTO> => {
    const params = appointmentService._mapFilterParams(filter);
    const response = await api.get("/admin/appointments/statistics/wait-time", { params });
    const data = response.data;
    return {
      overallAverageWaitTime: data.averageWaitTime || 0,
      byDoctor: (data.byHour || []).map((h: { hour: number; hourLabel: string; averageWait: number; appointmentCount: number }) => ({
        doctorId: h.hour,
        doctorName: h.hourLabel || `${h.hour}:00`,
        averageWaitTime: h.averageWait || 0,
        minWaitTime: 0,
        maxWaitTime: 0,
        appointmentCount: h.appointmentCount || 0,
      })),
      byType: (data.byDayOfWeek || []).map((d: { dayName: string; averageWait: number; appointmentCount: number }) => ({
        appointmentType: d.dayName as AppointmentType,
        averageWaitTime: d.averageWait || 0,
        appointmentCount: d.appointmentCount || 0,
      })),
      trend: (data.trend || []).map((t: { label: string; date: string; averageWait: number }) => ({
        date: t.date || t.label,
        label: t.label,
        averageWaitTime: t.averageWait || 0,
      })),
    };
  },

  // Export all statistics to PDF
  exportStatisticsToPDF: async (filter: StatisticsFilterDTO): Promise<Blob> => {
    const params = appointmentService._mapFilterParams(filter);
    const response = await api.get("/admin/appointments/statistics/export", {
      params,
      responseType: "blob",
    });
    return response.data;
  },

  // Get summary statistics (map BE AppointmentSummaryStatsDTO to FE SummaryStatisticsDTO)
  getSummaryStatistics: async (filter: StatisticsFilterDTO): Promise<SummaryStatisticsDTO> => {
    const params = appointmentService._mapFilterParams(filter);
    const response = await api.get("/admin/appointments/statistics/summary", { params });
    const data = response.data;
    return {
      totalAppointments: data.totalAppointments || 0,
      completedAppointments: data.completedAppointments || 0,
      cancelledAppointments: data.cancelledAppointments || 0,
      noShowAppointments: data.noShowAppointments || 0,
      pendingAppointments: data.pendingAppointments || 0,
      completionRate: data.completionRate || 0,
      cancellationRate: data.cancellationRate || 0,
      noShowRate: data.noShowRate || 0,
      averageWaitTime: 0,
      totalRevenue: 0,
      averageRevenuePerAppointment: 0,
      topDoctor: null,
      peakHour: 0,
      peakDay: "",
      changePercentage: data.changePercentage || 0,
      previousPeriodTotal: data.previousPeriodTotal || 0,
      averageAppointmentsPerDay: data.averageAppointmentsPerDay || 0,
    };
  },
};

// =========== STATISTICS INTERFACES ===========
export interface StatisticsFilterDTO {
  from?: string;
  to?: string;
  doctorId?: number;
  period?: "DAILY" | "WEEKLY" | "MONTHLY";
  limit?: number;
}

export interface AppointmentOverTimeDTO {
  date: string;
  label: string;
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  noShow: number;
}

export interface AppointmentByStatusDTO {
  status: AppointmentStatus;
  count: number;
  percentage: number;
}

export interface AppointmentByDoctorDTO {
  doctorId: number;
  doctorName: string;
  doctorSpecialization: string;
  doctorAvatar?: string;
  total: number;
  completed: number;
  cancelled: number;
  noShow: number;
  completionRate: number;
}

export interface PeakHoursDTO {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  dayName: string;
  hour: number;
  count: number;
  intensity: number; // 0-1 normalized value
}

export interface CancellationReasonDTO {
  reason: string;
  count: number;
  percentage: number;
}

export interface CancellationTrendDTO {
  date: string;
  label: string;
  total: number;
  rate: number;
}

export interface CancellationByDoctorDTO {
  doctorId: number;
  doctorName: string;
  totalAppointments: number;
  cancellations: number;
  cancellationRate: number;
}

export interface CancellationAnalysisDTO {
  totalCancellations: number;
  cancellationRate: number;
  reasons: CancellationReasonDTO[];
  trend: CancellationTrendDTO[];
  byDoctor: CancellationByDoctorDTO[];
}

export interface NoShowTrendDTO {
  date: string;
  label: string;
  total: number;
  rate: number;
}

export interface RepeatNoShowPatientDTO {
  patientId: number;
  patientName: string;
  patientEmail: string;
  noShowCount: number;
  totalAppointments: number;
  noShowRate: number;
}

export interface NoShowByDoctorDTO {
  doctorId: number;
  doctorName: string;
  totalAppointments: number;
  noShows: number;
  noShowRate: number;
}

export interface NoShowAnalysisDTO {
  totalNoShows: number;
  noShowRate: number;
  trend: NoShowTrendDTO[];
  repeatOffenders: RepeatNoShowPatientDTO[];
  byDoctor: NoShowByDoctorDTO[];
}

export interface WaitTimeByDoctorDTO {
  doctorId: number;
  doctorName: string;
  averageWaitTime: number;
  minWaitTime: number;
  maxWaitTime: number;
  appointmentCount: number;
}

export interface WaitTimeByTypeDTO {
  appointmentType: AppointmentType;
  averageWaitTime: number;
  appointmentCount: number;
}

export interface WaitTimeTrendDTO {
  date: string;
  label: string;
  averageWaitTime: number;
}

export interface WaitTimeAnalysisDTO {
  overallAverageWaitTime: number;
  byDoctor: WaitTimeByDoctorDTO[];
  byType: WaitTimeByTypeDTO[];
  trend: WaitTimeTrendDTO[];
}

export interface SummaryStatisticsDTO {
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  pendingAppointments: number;
  completionRate: number;
  cancellationRate: number;
  noShowRate: number;
  averageWaitTime: number;
  totalRevenue: number;
  averageRevenuePerAppointment: number;
  topDoctor: AppointmentByDoctorDTO | null;
  peakHour: number;
  peakDay: string;
  // Additional from BE
  changePercentage?: number;
  previousPeriodTotal?: number;
  averageAppointmentsPerDay?: number;
}

export default appointmentService;
>>>>>>> Dev
