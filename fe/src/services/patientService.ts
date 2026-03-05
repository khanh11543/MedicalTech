import api from "./api";

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
    const response = await api.get("/receptionist/patients", { params });
    return response.data;
  },

  // Search patients (quick search, min 3 chars)
  searchPatients: async (
    query: string,
    page = 0,
    size = 20
  ): Promise<PageResponse<PatientBasicDTO>> => {
    const response = await api.get("/receptionist/patients/search", {
      params: { q: query, page, size },
    });
    return response.data;
  },

  // Create walk-in patient
  createPatient: async (data: CreatePatientDTO): Promise<PatientBasicDTO> => {
    const response = await api.post("/receptionist/patients", data);
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
    const response = await api.get("/receptionist/patients/new", { params });
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
    const response = await api.get("/receptionist/patients/frequent", {
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
    formData.append("file", file);
    formData.append("documentType", documentType);
    if (notes) formData.append("notes", notes);

    const response = await api.post(
      `/receptionist/patients/${patientId}/documents`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
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
      { responseType: "blob" }
    );
    return response.data;
  },

  // Statistics
  getPatientStats: async (): Promise<PatientStatsDTO> => {
    const response = await api.get("/receptionist/patients/stats");
    return response.data;
  },

  // Message templates
  getMessageTemplates: async (): Promise<NotificationTemplateDTO[]> => {
    const response = await api.get("/receptionist/patients/message-templates");
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
};

export default patientService;
