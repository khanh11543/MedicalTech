import api from "./api";

// ============== TYPES ==============

export interface DashboardStats {
  totalAppointments: number;
  upcomingAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  totalPrescriptions: number;
  activePrescriptions: number;
  totalMedicalRecords: number;
  totalPayments: number;
  pendingPayments: number;
  nextAppointment: Appointment | null;
  generatedAt: string;
}

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
  status: AppointmentStatus;
  bookedBy: string;
  bookedByUserName: string;
  queueNumber: number | null;
  reasonForVisit: string;
  symptoms: string;
  notes: string;
  cancellationReason: string;
  checkedInAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW"
  | "RESCHEDULED";

export interface BookAppointmentRequest {
  patientId: number;
  doctorId: number;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  reasonForVisit?: string;
  symptoms?: string;
  notes?: string;
}

export interface DoctorCard {
  id: number;
  fullName: string;
  avatarUrl: string | null;
  primarySpecialty: string;
  specialties: string[];
  experienceYears: number;
  consultationFee: number;
  ratingAvg: number;
  ratingCount: number;
  hospitalAffiliation: string;
  city: string;
  officeAddress: string;
  isAvailable: boolean;
}

export interface DoctorDetail {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
  licenseNumber: string;
  bio: string;
  education: string;
  experienceYears: number;
  primarySpecialty: string;
  specialties: Specialty[];
  consultationFee: number;
  followUpFee: number;
  ratingAvg: number;
  ratingCount: number;
  hospitalAffiliation: string;
  officeAddress: string;
  isAvailable: boolean;
  verificationStatus: string;
}

export interface Specialty {
  id: number;
  name: string;
  description: string;
  iconUrl: string | null;
  isActive: boolean;
}

export interface TimeSlot {
  id: number;
  doctorId: number;
  slotDate: string;
  startTime: string;
  endTime: string;
  status: string;
  isAvailable: boolean;
}

export interface MedicalRecord {
  id: number;
  recordCode: string;
  doctorId: number;
  doctorName: string;
  doctorSpecialization: string;
  appointmentId: number | null;
  visitDate: string;
  chiefComplaint: string;
  presentIllness: string;
  vitalSigns: Record<string, unknown> | null;
  physicalExam: string;
  diagnosis: string;
  diagnosisCode: string;
  treatmentPlan: string;
  prescription: string;
  labResults: Record<string, unknown> | null;
  followUpDate: string | null;
  followUpNotes: string;
  attachments: unknown;
  isConfidential: boolean;
  createdAt: string;
  updatedAt: string;
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

export interface PrescriptionItem {
  id: number;
  medicationId: number;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions: string;
}

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
  paymentMethod: string;
  paymentStatus: string;
  transactionId: string;
  paidAt: string | null;
  refundedAt: string | null;
  refundAmount: number | null;
  refundReason: string | null;
  processedBy: number | null;
  processedByName: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: number;
  appointmentId: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  rating: number;
  comment: string;
  isAnonymous: boolean;
  isVisible: boolean;
  adminResponse: string | null;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewRequest {
  appointmentId: number;
  patientId: number;
  rating: number;
  comment: string;
  isAnonymous?: boolean;
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

// ============== PATIENT SERVICE ==============

const patientService = {
  // ==================== DASHBOARD ====================
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await api.get("/patient/dashboard/stats");
    return response.data;
  },

  getUpcomingAppointments: async (): Promise<Appointment[]> => {
    const response = await api.get("/patient/dashboard/upcoming-appointments");
    return response.data;
  },

  // ==================== APPOINTMENTS ====================
  getMyAppointments: async (params: {
    status?: string;
    from?: string;
    to?: string;
    pageNumber?: number;
    pageSize?: number;
  } = {}): Promise<Page<Appointment>> => {
    const response = await api.get("/patient/appointments", { params });
    return response.data;
  },

  bookAppointment: async (data: BookAppointmentRequest): Promise<Appointment> => {
    const response = await api.post("/patient/appointments", data);
    return response.data;
  },

  // ==================== DOCTORS (PUBLIC) ====================
  searchDoctors: async (params: {
    q?: string;
    specialtyId?: number;
    city?: string;
    minFee?: number;
    maxFee?: number;
    pageNumber?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: string;
  } = {}): Promise<Page<DoctorCard>> => {
    const response = await api.get("/public/doctors", { params });
    return response.data;
  },

  getDoctorDetail: async (doctorId: number): Promise<DoctorDetail> => {
    const response = await api.get(`/public/doctors/${doctorId}`);
    return response.data;
  },

  getDoctorSlots: async (
    doctorId: number,
    dateFrom: string,
    dateTo: string
  ): Promise<TimeSlot[]> => {
    const response = await api.get(`/public/doctors/${doctorId}/slots`, {
      params: { dateFrom, dateTo },
    });
    return response.data;
  },

  getSpecialties: async (): Promise<Specialty[]> => {
    const response = await api.get("/public/specialties");
    return response.data;
  },

  // ==================== MEDICAL RECORDS ====================
  getMyRecords: async (params: {
    from?: string;
    to?: string;
    pageNumber?: number;
    pageSize?: number;
  } = {}): Promise<Page<MedicalRecord>> => {
    const response = await api.get("/patient/medical-records", { params });
    return response.data;
  },

  getRecordDetail: async (id: number): Promise<MedicalRecord> => {
    const response = await api.get(`/patient/medical-records/${id}`);
    return response.data;
  },

  // ==================== PRESCRIPTIONS ====================
  getMyPrescriptions: async (params: {
    from?: string;
    to?: string;
    pageNumber?: number;
    pageSize?: number;
  } = {}): Promise<Page<Prescription>> => {
    const response = await api.get("/patient/prescriptions", { params });
    return response.data;
  },

  getPrescriptionDetail: async (id: number): Promise<Prescription> => {
    const response = await api.get(`/patient/prescriptions/${id}`);
    return response.data;
  },

  // ==================== PAYMENTS ====================
  getMyPayments: async (params: {
    status?: string;
    method?: string;
    from?: string;
    to?: string;
    pageNumber?: number;
    pageSize?: number;
  } = {}): Promise<Page<Payment>> => {
    const response = await api.get("/patient/payments", { params });
    return response.data;
  },

  getPaymentDetail: async (id: number): Promise<Payment> => {
    const response = await api.get(`/patient/payments/${id}`);
    return response.data;
  },

  // ==================== REVIEWS ====================
  createReview: async (data: CreateReviewRequest): Promise<Review> => {
    const response = await api.post("/api/patient/reviews", data);
    return response.data;
  },

  // ==================== FAVORITES ====================
  getFavoriteDoctors: async (params: {
    patientId: number;
    pageNumber?: number;
    pageSize?: number;
  }): Promise<{ content: DoctorCard[]; totalPages: number; totalElements: number }> => {
    const response = await api.get("/api/patient/favorites", { params });
    return response.data;
  },

  removeFavoriteDoctor: async (id: number, patientId: number): Promise<void> => {
    await api.delete(`/api/patient/favorites/${id}`, {
      params: { patientId },
    });
  },
};

export default patientService;
