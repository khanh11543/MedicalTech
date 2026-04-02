import api from './api';

// ==================== TYPES ====================

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface PatientListDTO {
  id: number;
  userId: number;
  mrn: string;
  name: string;
  age: number | null;
  gender: string;
  maskedPhone: string;
  maskedEmail: string;
  cityDistrict: string | null;
  lastVisit: string | null;
  totalAppointments: number;
  insuranceStatus: string; // "INSURED" | "UNINSURED"
  createdAt: string;
  isActive: boolean;
}

export interface PatientBasicDTO {
  id: number;
  userId: number;
  name: string;
  maskedPhone: string;
  email: string;
  gender: string;
  dateOfBirth: string;
  mrn: string;
}

export interface PatientDetailDTO {
  id: number;
  userId: number;
  mrn: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  age: number | null;
  gender: string;
  avatarUrl: string | null;
  address: string;
  insuranceNumber: string | null;
  insuranceProvider: string | null;
  insuranceStatus: string;
  emergencyContact: string | null;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  lastVisit: string | null;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePatientDemographicDTO {
  phone?: string;
  email?: string;
  address?: string;
  insuranceNumber?: string;
  insuranceProvider?: string;
  emergencyContact?: string;
}

export interface PatientStatsDTO {
  totalPatients: number;
  activePatients: number;
  deactivatedPatients: number;
  newThisMonth: number;
  insuredPatients: number;
  uninsuredPatients: number;
  malePatients: number;
  femalePatients: number;
  otherGenderPatients: number;
}

export interface NewPatientDTO {
  id: number;
  userId: number;
  mrn: string;
  name: string;
  age: number | null;
  gender: string;
  maskedPhone: string;
  insuranceStatus: string;
  registeredAt: string;
  hasAppointment: boolean;
  isNew: boolean;
}

export interface FrequentPatientDTO {
  id: number;
  userId: number;
  mrn: string;
  name: string;
  age: number | null;
  gender: string;
  maskedPhone: string;
  insuranceStatus: string;
  totalVisits: number;
  lastVisit: string | null;
  mostVisitedDoctorName: string | null;
  mostVisitedDoctorId: number | null;
  visitCountWithTopDoctor: number | null;
  lifetimeSpending: number;
  daysSinceLastVisit: number | null;
  lapsedStatus: string | null;
  isVip: boolean;
}

export interface PatientClinicalSummaryDTO {
  patientId: number;
  totalMedicalRecords: number;
  totalPrescriptions: number;
  totalCompletedVisits: number;
  hasClinicalData: boolean;
}

export interface PatientDocumentDTO {
  id: number;
  patientId: number;
  documentType: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  notes: string | null;
  uploadedByName: string;
  uploadedByUserId: number;
  uploadedAt: string;
}

export interface PatientPaymentHistoryDTO {
  id: number;
  paymentCode: string;
  appointmentCode: string | null;
  doctorName: string | null;
  amount: number;
  totalAmount: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  paidAt: string | null;
  createdAt: string;
  hasReceipt: boolean;
  invoiceId: number | null;
}

export interface PatientCommunicationDTO {
  id: number;
  channel: string;
  recipient: string;
  subject: string;
  templateName: string;
  status: string;
  errorMessage: string | null;
  sentByName: string | null;
  sentByUserId: number | null;
  sentAt: string;
  referenceType: string;
  referenceId: number;
}

export interface PatientAppointmentDTO {
  id: number;
  appointmentCode: string;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: string;
  bookedBy: string;
  queueNumber: number | null;
  reasonForVisit: string | null;
  symptoms: string | null;
  notes: string | null;
  cancellationReason: string | null;
  checkedInAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationTemplateDTO {
  id: string;
  name: string;
  channel: string;
  category: string;
  contentPreview: string;
  active: boolean;
}

export interface QuickBookAppointmentDTO {
  doctorId: number;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  timeSlotId?: number;
  reasonForVisit?: string;
  notes?: string;
}

export interface CreatePatientDTO {
  name: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
}

// ==================== PATIENT SELF-SERVICE TYPES ====================

export type AppointmentStatus =
  | 'PENDING'
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'RESCHEDULED';

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
  reasonForVisit: string | null;
  symptoms: string | null;
  notes: string | null;
  cancellationReason: string | null;
  appointmentType: string | null;
  paymentStatus: string | null;
  /** Id of payment for this appointment (for Pay Now) */
  paymentId?: number | null;
  /** Consultation fee from doctor (for display) */
  consultationFee?: number | null;
  hasReview?: boolean;
  checkedInAt: string | null;
  createdAt: string;
  updatedAt: string;
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
  status: string;
  transactionId: string;
  transactionCode: string;
  paymentDate: string;
  paidAt: string | null;
  refundedAt: string | null;
  refundAmount: number;
  refundReason: string | null;
  processedBy: number | null;
  processedByName: string | null;
  doctorName: string;
  /** Doctor specialty for display (e.g. "Pediatrics") */
  doctorSpecialty?: string | null;
  /** Appointment date for display */
  appointmentDate?: string | null;
  /** Appointment status (e.g. PENDING, COMPLETED, CANCELLED) */
  appointmentStatus?: string | null;
  amountReceived: number;
  changeGiven: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

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

export interface PatientProfileResponse {
  userId: number;
  patientId: number;
  email: string;
  fullName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  idNumber: string | null; // CCCD
  insuranceNumber: string | null;
  insuranceProvider: string | null;
  emergencyContact: string | null;
  bloodGroup: string | null;
  allergies: string | null;
  medicalHistory: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePatientProfileRequest {
  fullName?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  idNumber?: string; // CCCD
  insuranceNumber?: string;
  insuranceProvider?: string;
  emergencyContact?: string;
  bloodGroup?: string;
  allergies?: string;
  medicalHistory?: string;
}

export interface Specialty {
  id: number;
  name: string;
  description: string;
  imageUrl: string | null;
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
  hospitalAffiliation: string | null;
  city: string | null;
  officeAddress: string | null;
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
  hospitalAffiliation: string | null;
  officeAddress: string | null;
  isAvailable: boolean;
  verificationStatus: string;
}

export interface TimeSlot {
  id: number;
  doctorId: number;
  doctorName: string;
  specialization: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  status: string;
  isAvailable: boolean;
  source: string;
  note: string | null;
}

export interface PrescriptionItem {
  id: number;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  unit: string;
  instructions: string;
  notes: string | null;
  morningDose?: number | null;
  noonDose?: number | null;
  afternoonDose?: number | null;
  eveningDose?: number | null;
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
  prescriptionCode: string;
  prescriptionDate: string;
  expiryDate: string | null;
  status: string;
  diagnosis: string;
  notes: string | null;
  followUpDate: string | null;
  isActive: boolean;
  items: PrescriptionItem[];
  createdAt: string;
  updatedAt: string;
}

export interface MedicalRecord {
  id: number;
  recordCode: string;
  doctorId: number;
  doctorName: string;
  doctorSpecialization: string | null;
  appointmentId: number | null;
  visitDate: string;
  chiefComplaint: string | null;
  presentIllness: string | null;
  vitalSigns: unknown;
  physicalExam: string | null;
  diagnosis: string;
  diagnosisCode: string | null;
  treatmentPlan: string | null;
  prescription: string | null;
  labResults: unknown;
  followUpDate: string | null;
  followUpNotes: string | null;
  attachments: unknown;
  isConfidential: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewCreateRequest {
  /** Omit for general review (testimonial); set for appointment-based review */
  appointmentId?: number;
  /** Optional: doctor to associate with a general review */
  doctorId?: number;
  rating: number;
  comment?: string;
  isAnonymous?: boolean;
  /** Optional: image URLs from upload endpoint (for general review) */
  imageUrls?: string[];
}

export interface ReviewDTO {
  id: number;
  appointmentId: number | null;
  patientId: number | null;
  patientName: string | null;
  doctorId: number | null;
  doctorName: string | null;
  rating: number;
  comment: string | null;
  imageUrls?: string[];
  isAnonymous?: boolean;
  isVisible?: boolean;
  adminResponse?: string | null;
  respondedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface BookAppointmentRequest {
  patientId: number;
  doctorId: number;
  appointmentDate: string;
  timeSlotId?: number;
  startTime: string;
  endTime: string;
  reasonForVisit?: string;
  symptoms?: string;
  notes?: string;
}

export interface PaymentQrDTO {
  id: number;
  paymentId: number;
  provider: string;
  qrPayload: string;
  payUrl: string;
  expiresAt: string;
  status: string;
  createdAt: string;
}

export interface PaymentInitDTO {
  paymentId: number;
  paymentCode: string;
  payUrl: string;
  qrCodeUrl: string;
  orderId: string;
  message: string;
  success: boolean;
}

export interface InvoiceDTO {
  id: number;
  invoiceNumber: string;
  paymentId: number;
  paymentCode: string;
  patientId: number;
  patientName: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: string;
  notes: string;
  createdAt: string;
}

// ==================== SERVICE ====================

const patientService = {
  // 3.1 All Patients — paginated with filters
  listAllPatients: async (params: {
    search?: string;
    gender?: string;
    isActive?: boolean;
    hasInsurance?: boolean;
    page?: number;
    size?: number;
    sort?: string;
  }): Promise<PageResponse<PatientListDTO>> => {
    const response = await api.get('/receptionist/patients', { params });
    return response.data;
  },

  // Search patients (quick search, min 3 chars)
  searchPatients: async (
    query: string,
    page = 0,
    size = 20
  ): Promise<PageResponse<PatientBasicDTO>> => {
    const response = await api.get('/receptionist/patients/search', {
      params: { q: query, page, size },
    });
    return response.data;
  },

  // Create walk-in patient
  createPatient: async (data: CreatePatientDTO): Promise<PatientBasicDTO> => {
    const response = await api.post('/receptionist/patients', data);
    return response.data;
  },

  // Patient detail (audited)
  getPatientDetail: async (id: number): Promise<PatientDetailDTO> => {
    const response = await api.get(`/receptionist/patients/${id}`);
    return response.data;
  },

  // Update demographic (restricted fields only)
  updateDemographic: async (
    id: number,
    data: UpdatePatientDemographicDTO
  ): Promise<PatientDetailDTO> => {
    const response = await api.put(
      `/receptionist/patients/${id}/demographic`,
      data
    );
    return response.data;
  },

  // Deactivate patient (soft delete)
  deactivatePatient: async (id: number): Promise<void> => {
    await api.patch(`/receptionist/patients/${id}/deactivate`);
  },

  // Reactivate patient
  reactivatePatient: async (id: number): Promise<void> => {
    await api.patch(`/receptionist/patients/${id}/reactivate`);
  },

  // 3.2 New Patients (this month)
  getNewPatients: async (params: {
    page?: number;
    size?: number;
  }): Promise<PageResponse<NewPatientDTO>> => {
    const response = await api.get('/receptionist/patients/new', { params });
    return response.data;
  },

  // 3.3 Frequent Patients
  getFrequentPatients: async (params: {
    minVisits?: number;
    lapsedDays?: number;
    search?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<FrequentPatientDTO>> => {
    const response = await api.get('/receptionist/patients/frequent', {
      params,
    });
    return response.data;
  },

  // Patient Appointments
  getPatientAppointments: async (
    patientId: number,
    params: { page?: number; size?: number }
  ): Promise<PageResponse<PatientAppointmentDTO>> => {
    const response = await api.get(
      `/receptionist/patients/${patientId}/appointments`,
      { params }
    );
    return response.data;
  },

  // Clinical Summary
  getClinicalSummary: async (
    patientId: number
  ): Promise<PatientClinicalSummaryDTO> => {
    const response = await api.get(
      `/receptionist/patients/${patientId}/clinical-summary`
    );
    return response.data;
  },

  // Documents
  getPatientDocuments: async (
    patientId: number
  ): Promise<PatientDocumentDTO[]> => {
    const response = await api.get(
      `/receptionist/patients/${patientId}/documents`
    );
    return response.data;
  },

  // Upload document
  uploadDocument: async (
    patientId: number,
    file: File,
    documentType: string,
    notes?: string
  ): Promise<PatientDocumentDTO> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    if (notes) formData.append('notes', notes);

    const response = await api.post(
      `/receptionist/patients/${patientId}/documents`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  // Communication log
  getCommunicationLog: async (
    patientId: number,
    params: { page?: number; size?: number }
  ): Promise<PageResponse<PatientCommunicationDTO>> => {
    const response = await api.get(
      `/receptionist/patients/${patientId}/communications`,
      { params }
    );
    return response.data;
  },

  // Send message (template-based)
  sendMessage: async (
    patientId: number,
    channel: string,
    templateId: string
  ): Promise<void> => {
    await api.post(`/receptionist/patients/${patientId}/send-message`, {
      channel,
      templateId,
    });
  },

  // Payment history
  getPaymentHistory: async (
    patientId: number,
    params: { page?: number; size?: number }
  ): Promise<PageResponse<PatientPaymentHistoryDTO>> => {
    const response = await api.get(
      `/receptionist/patients/${patientId}/payments`,
      { params }
    );
    return response.data;
  },

  // Download receipt PDF
  downloadReceipt: async (
    patientId: number,
    paymentId: number
  ): Promise<Blob> => {
    const response = await api.get(
      `/receptionist/patients/${patientId}/payments/${paymentId}/receipt`,
      { responseType: 'blob' }
    );
    return response.data;
  },

  // Statistics
  getPatientStats: async (): Promise<PatientStatsDTO> => {
    const response = await api.get('/receptionist/patients/stats');
    return response.data;
  },

  // Message templates
  getMessageTemplates: async (): Promise<NotificationTemplateDTO[]> => {
    const response = await api.get('/receptionist/patients/message-templates');
    return response.data;
  },

  // Quick-book appointment
  quickBookAppointment: async (
    patientId: number,
    data: QuickBookAppointmentDTO
  ): Promise<PatientAppointmentDTO> => {
    const response = await api.post(
      `/receptionist/patients/${patientId}/appointments/quick-book`,
      data
    );
    return response.data;
  },

  // ==================== PATIENT SELF-SERVICE ====================

  // Dashboard stats
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/patient/dashboard/stats');
    return response.data;
  },

  // My patient profile (User + Patient fields)
  getMyProfile: async (): Promise<PatientProfileResponse> => {
    const response = await api.get('/patient/profile');
    return response.data;
  },

  updateMyProfile: async (
    data: UpdatePatientProfileRequest
  ): Promise<PatientProfileResponse> => {
    const response = await api.put('/patient/profile', data);
    return response.data;
  },

  // Upcoming appointments
  getUpcomingAppointments: async (): Promise<Appointment[]> => {
    const response = await api.get('/patient/appointments/upcoming');
    return response.data;
  },

  // My appointments (paginated)
  getMyAppointments: async (params: {
    status?: string;
    statuses?: string;
    from?: string;
    to?: string;
    pageNumber?: number;
    pageSize?: number;
  }): Promise<PageResponse<Appointment>> => {
    const response = await api.get('/patient/appointments', { params });
    return response.data;
  },

  // Cancel my appointment
  cancelMyAppointment: async (
    appointmentId: number,
    reason?: string
  ): Promise<Appointment> => {
    const response = await api.patch(`/appointments/${appointmentId}/cancel`, {
      reason,
    });
    return response.data;
  },

  // My payments (paginated)
  getMyPayments: async (params: {
    status?: string;
    pageNumber?: number;
    pageSize?: number;
  }): Promise<PageResponse<Payment>> => {
    const response = await api.get('/patient/payments', { params });
    return response.data;
  },

  // Search doctors (public)
  searchDoctors: async (params: {
    q?: string;
    specialtyId?: number;
    sortBy?: string;
    pageNumber?: number;
    pageSize?: number;
  }): Promise<PageResponse<DoctorCard>> => {
    const response = await api.get('/public/doctors', { params });
    return response.data;
  },

  // Get specialties (public)
  getSpecialties: async (): Promise<Specialty[]> => {
    const response = await api.get('/public/specialties');
    return response.data;
  },

  // Doctor detail (public)
  getDoctorDetail: async (id: number): Promise<DoctorDetail> => {
    const response = await api.get(`/public/doctors/${id}`);
    return response.data;
  },

  // Doctor available slots (public)
  getDoctorSlots: async (
    doctorId: number,
    dateFrom: string,
    dateTo: string
  ): Promise<TimeSlot[]> => {
    const response = await api.get(`/public/doctors/${doctorId}/slots`, {
      params: { dateFrom, dateTo },
    });
    // API returns List directly
    return response.data.content || response.data;
  },

  // Book appointment (patient)
  bookAppointment: async (
    data: BookAppointmentRequest
  ): Promise<Appointment> => {
    const response = await api.post('/patient/appointments', data);
    return response.data;
  },

  // My medical records (paginated)
  getMyRecords: async (params: {
    pageNumber?: number;
    pageSize?: number;
  }): Promise<PageResponse<MedicalRecord>> => {
    const response = await api.get('/patient/medical-records', { params });
    return response.data;
  },

  // Medical record detail
  getRecordDetail: async (id: number): Promise<MedicalRecord> => {
    const response = await api.get(`/patient/medical-records/${id}`);
    return response.data;
  },

  // My prescriptions (paginated)
  getMyPrescriptions: async (params: {
    pageNumber?: number;
    pageSize?: number;
  }): Promise<PageResponse<Prescription>> => {
    const response = await api.get('/patient/prescriptions', { params });
    return response.data;
  },

  // Prescription detail
  getPrescriptionDetail: async (id: number): Promise<Prescription> => {
    const response = await api.get(`/patient/prescriptions/${id}`);
    return response.data;
  },

  // Payment detail
  getPaymentDetail: async (id: number): Promise<Payment> => {
    const response = await api.get(`/patient/payments/${id}`);
    return response.data;
  },

  // Get QR code for payment
  getPaymentQr: async (id: number): Promise<PaymentQrDTO> => {
    const response = await api.get(`/patient/payments/${id}/qr`);
    return response.data;
  },

  // Get invoice by payment ID
  getInvoiceByPayment: async (paymentId: number): Promise<InvoiceDTO> => {
    const response = await api.get(`/patient/invoices/by-payment/${paymentId}`);
    return response.data;
  },

  // Download invoice PDF
  downloadInvoicePdf: async (invoiceId: number): Promise<Blob> => {
    const response = await api.get(`/patient/invoices/${invoiceId}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Init MOMO payment (patient self-service)
  initMomoPayment: async (paymentId: number): Promise<PaymentInitDTO> => {
    const response = await api.post(
      `/patient/payments/${paymentId}/momo/init`,
      {}
    );
    return response.data;
  },

  // Cancel payment (patient self-service)
  cancelMyPayment: async (
    paymentId: number,
    reason?: string
  ): Promise<Payment> => {
    const response = await api.patch(`/patient/payments/${paymentId}/cancel`, {
      reason,
    });
    return response.data;
  },

  createReview: async (data: ReviewCreateRequest): Promise<any> => {
    const response = await api.post('/patient/reviews', data);
    return response.data;
  },

  getMyReviewByAppointmentId: async (appointmentId: number): Promise<ReviewDTO> => {
    const response = await api.get(`/patient/reviews/by-appointment/${appointmentId}`);
    return response.data;
  },

  /** Upload image for review (general/testimonial). Returns { url: string }. */
  uploadReviewImage: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/patient/reviews/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Reschedule appointment
  rescheduleAppointment: async (
    appointmentId: number,
    data: {
      newDate: string; // yyyy-MM-dd
      newStartTime: string; // HH:mm
      newEndTime: string; // HH:mm
      reason?: string;
    }
  ) => {
    const response = await api.patch(
      `/appointments/${appointmentId}/reschedule`,
      data
    );
    return response.data;
  },
};

export default patientService;
