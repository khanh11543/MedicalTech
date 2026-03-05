import api from "./api";

// ==================== TYPES ====================

export type DoctorQueueStatus = "AVAILABLE" | "BUSY" | "ON_BREAK" | "OFFLINE";
export type AppointmentStatus = "CHECKED_IN" | "IN_PROGRESS" | "COMPLETED" | "NO_SHOW" | "CONFIRMED" | "CANCELLED";

export interface QueuePatientDTO {
  appointmentId: number;
  appointmentCode: string;
  queueNumber: number;
  patientId: number;
  patientName: string;
  maskedPhone: string;
  age: number | null;
  gender: string;
  appointmentTime: string; // HH:mm
  checkedInAt: string | null;
  waitTimeMinutes: number | null;
  status: AppointmentStatus;
  isUrgent: boolean;
  reasonForVisit: string | null;
  waitTimeAlertLevel: "NORMAL" | "WARNING" | "CRITICAL";
  doctorId: number;
  doctorName: string;
  roomNumber: string | null;
}

export interface DoctorQueueStatusDTO {
  doctorId: number;
  doctorName: string;
  specialization: string;
  doctorStatus: DoctorQueueStatus;
  roomNumber: string | null;
  totalAppointmentsToday: number;
  checkedInWaiting: number;
  inProgress: number;
  completed: number;
  noShow: number;
  currentQueueNumber: number | null;
  nextQueueNumber: number | null;
  estimatedWaitMinutes: number | null;
  waitingPatients: QueuePatientDTO[];
  currentPatient: QueuePatientDTO | null;
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
  roomNumber: string | null;
  notifyMethod: string | null;
}

export interface QueueDisplayDTO {
  queueNumber: number;
  roomNumber: string | null;
  status: "SERVING" | "WAITING" | "CALLED";
  doctorId: number;
  doctorName: string | null;
  specialization: string | null;
  patientName: string | null;
  appointmentCode: string | null;
}

export interface QueueAuditDTO {
  id: number;
  eventType: string;
  appointmentId: number;
  appointmentCode: string;
  queueNumber: number | null;
  patientName: string;
  doctorId: number;
  doctorName: string;
  fromDoctorId: number | null;
  fromDoctorName: string | null;
  toDoctorId: number | null;
  toDoctorName: string | null;
  performedByUserId: number;
  performedByName: string;
  reason: string | null;
  timestamp: string;
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

// ==================== REQUEST DTOs ====================

export interface CallNextRequest {
  queueNumber?: number;
  note?: string;
  notifyMethod?: string;
  roomNumber?: string;
}

export interface ReorderQueueRequest {
  orderedAppointmentIds: number[];
  reason: string;
}

export interface AddWalkInRequest {
  patientId: number;
  reasonForVisit?: string;
  preferredTime?: string;
  urgent: boolean;
  note?: string;
}

export interface MoveDoctorRequest {
  appointmentId: number;
  toDoctorId: number;
  reason: string;
}

export interface UpdateDoctorStatusRequest {
  status: DoctorQueueStatus;
  roomNumber?: string;
  reason?: string;
}

export interface MarkNoShowRequest {
  reason?: string;
  sendNotification?: boolean;
}

// ==================== SERVICE ====================

const BASE = "/receptionist/queue";

const queueService = {
  // ===== VIEW MODES =====

  /** Legacy simple queue status (counts per doctor) */
  getQueueStatus: async (): Promise<DoctorQueueStatusDTO[]> => {
    const response = await api.get(`${BASE}/status`);
    return response.data;
  },

  /** Detailed queue per doctor with waiting patient list */
  getQueueByDoctor: async (): Promise<DoctorQueueStatusDTO[]> => {
    const response = await api.get(`${BASE}/by-doctor`);
    return response.data;
  },

  /** Queue grouped by room */
  getQueueByRoom: async (): Promise<DoctorQueueStatusDTO[]> => {
    const response = await api.get(`${BASE}/by-room`);
    return response.data;
  },

  /** Flat list of all queued patients */
  getAllQueuedPatients: async (
    sortBy: string = "queueNumber",
    sortDir: string = "ASC"
  ): Promise<QueuePatientDTO[]> => {
    const response = await api.get(`${BASE}/all-patients`, {
      params: { sortBy, sortDir },
    });
    return response.data;
  },

  // ===== DOCTOR STATUS =====

  /** Update doctor queue status */
  updateDoctorStatus: async (
    doctorId: number,
    data: UpdateDoctorStatusRequest
  ): Promise<DoctorQueueStatusDTO> => {
    const response = await api.patch(`${BASE}/doctors/${doctorId}/status`, data);
    return response.data;
  },

  /** List all doctors today with queue summary */
  getDoctorsList: async (): Promise<DoctorQueueStatusDTO[]> => {
    const response = await api.get(`${BASE}/doctors`);
    return response.data;
  },

  // ===== QUEUE OPERATIONS =====

  /** Call next patient in doctor's queue */
  callNextPatient: async (
    doctorId: number,
    data?: CallNextRequest
  ): Promise<QueueCallResultDTO> => {
    const response = await api.post(`${BASE}/${doctorId}/call-next`, data || {});
    return response.data;
  },

  /** Reorder doctor's queue */
  reorderQueue: async (
    doctorId: number,
    data: ReorderQueueRequest
  ): Promise<DoctorQueueStatusDTO> => {
    const response = await api.patch(`${BASE}/${doctorId}/reorder`, data);
    return response.data;
  },

  /** Add walk-in patient to queue */
  addWalkIn: async (
    doctorId: number,
    data: AddWalkInRequest
  ): Promise<QueueCallResultDTO> => {
    const response = await api.post(`${BASE}/${doctorId}/add-walk-in`, data);
    return response.data;
  },

  /** Move patient to different doctor */
  moveDoctor: async (data: MoveDoctorRequest): Promise<QueueCallResultDTO> => {
    const response = await api.post(`${BASE}/move-doctor`, data);
    return response.data;
  },

  /** Mark patient as no-show */
  markNoShow: async (
    appointmentId: number,
    data?: MarkNoShowRequest
  ): Promise<void> => {
    await api.patch(`/receptionist/appointments/${appointmentId}/mark-no-show`, data || {});
  },

  // ===== DISPLAY =====

  /** Public TV board (no PII) */
  getPublicDisplay: async (): Promise<QueueDisplayDTO[]> => {
    const response = await api.get(`${BASE}/display/public`);
    return response.data;
  },

  /** Internal staff screen (with names) */
  getInternalDisplay: async (): Promise<QueueDisplayDTO[]> => {
    const response = await api.get(`${BASE}/display/internal`);
    return response.data;
  },

  // ===== AUDIT =====

  /** Queue audit log (paginated) */
  getAuditLog: async (
    pageNumber: number = 0,
    pageSize: number = 20
  ): Promise<PageResponse<QueueAuditDTO>> => {
    const response = await api.get(`${BASE}/audit-log`, {
      params: { pageNumber, pageSize },
    });
    return response.data;
  },

  /** Queue history for a specific doctor */
  getDoctorHistory: async (doctorId: number): Promise<QueueAuditDTO[]> => {
    const response = await api.get(`${BASE}/${doctorId}/history`);
    return response.data;
  },
};

export default queueService;
